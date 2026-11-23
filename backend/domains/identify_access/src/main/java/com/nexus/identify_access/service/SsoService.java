package com.nexus.identify_access.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexus.identify_access.dto.AuthorizeUrlResponse;
import com.nexus.identify_access.dto.SsoDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.UUID;

@Service
public class SsoService {

    private static final Logger log = LoggerFactory.getLogger(SsoService.class);
    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String REDIS_TICKET_PREFIX = "nexus:sso:ticket:";
    
    private static final Duration TICKET_TTL = Duration.ofMinutes(10);

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_USED = "USED";

    @Value("${sso.google.client-id}")
    private String googleClientId;

    @Value("${sso.google.client-secret}")
    private String googleClientSecret;

    @Value("${sso.google.redirect-uri}")
    private String googleRedirectUri;

    private final RestClient restClient = RestClient.builder().build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    public AuthorizeUrlResponse getAuthorizationUrl() {
        String url = UriComponentsBuilder
                .fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
                .queryParam("client_id", googleClientId)
                .queryParam("redirect_uri", googleRedirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", "openid email profile")
                .queryParam("access_type", "offline")
                .queryParam("prompt", "select_account")
                .build()
                .toUriString();

        return new AuthorizeUrlResponse("GOOGLE", url);
    }

    /**
     * Trao đổi authorization code từ Google, giải mã id_token và khởi tạo vé PENDING trong Redis
     */
    public SsoDto.LoginResponse exchangeGoogleCode(SsoDto.CallbackRequest request) {
        String effectiveRedirectUri = (request.redirectUri() != null && !request.redirectUri().isBlank())
                ? request.redirectUri()
                : googleRedirectUri;

        log.info("Exchanging auth code with Google Token Endpoint...");

        MultiValueMap<String, String> formParams = new LinkedMultiValueMap<>();
        formParams.add("client_id", googleClientId);
        formParams.add("client_secret", googleClientSecret);
        formParams.add("code", request.code());
        formParams.add("redirect_uri", effectiveRedirectUri);
        formParams.add("grant_type", "authorization_code");

        // Gửi POST sang Google Token Endpoint
        JsonNode tokenNode;
        try {
            tokenNode = restClient.post()
                    .uri(GOOGLE_TOKEN_URL)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formParams)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                        log.warn("Google rejected auth code: HTTP {}", res.getStatusCode());
                        throw new ResponseStatusException(
                                HttpStatusCode.valueOf(400),
                                "Code Invalid. Try Again"
                        );
                    })
                    .onStatus(HttpStatusCode::is5xxServerError, (req, res) -> {
                        log.error("Google Token Endpoint error: HTTP {}", res.getStatusCode());
                        throw new ResponseStatusException(
                                HttpStatusCode.valueOf(504),
                                "Authentication service temporarily unavailable. Please try again later."
                        );
                    })
                    .body(JsonNode.class);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Connection failed to Google Token Endpoint: {}", e.getMessage());
            throw new ResponseStatusException(
                    HttpStatusCode.valueOf(504),
                    "Connection to Google timed out. Please try again."
            );
        }

        if (tokenNode == null || !tokenNode.has("id_token")) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(400), "Google did not return a valid id_token");
        }

        // Parse payload từ id_token
        try {
            String idToken = tokenNode.get("id_token").asText();
            String[] parts = idToken.split("\\.");
            if (parts.length < 2) {
                throw new IllegalArgumentException("Invalid JWT format");
            }
            byte[] decodedBytes = Base64.getUrlDecoder().decode(parts[1]);
            JsonNode payload = objectMapper.readTree(new String(decodedBytes, StandardCharsets.UTF_8));

            String email = payload.get("email").asText();
            String fullName = payload.has("name") ? payload.get("name").asText() : email;
            String generatedUserId = UUID.randomUUID().toString();
            String nexusAccessToken = "nexus_jwt_" + UUID.randomUUID();
            String nexusRefreshToken = "nexus_rf_" + UUID.randomUUID();

            // Khởi tạo trạng thái PENDING trong Redis với TTL 10 phút (600 giây)
            if (redisTemplate != null) {
                try {
                    String redisKey = REDIS_TICKET_PREFIX + nexusAccessToken;
                    String redisValue = STATUS_PENDING + ":" + email;
                    redisTemplate.opsForValue().set(redisKey, redisValue, TICKET_TTL);
                    log.info("Initialized SSO ticket [PENDING] in Redis: {} [TTL = 10m]", redisKey);
                } catch (Exception redisEx) {
                    log.warn("Unable to connect to Redis ({}). Continuing auth flow without Redis cache.", redisEx.getMessage());
                }
            } else {
                log.warn("RedisTemplate not configured. Skipping Redis cache.");
            }

            log.info("Google authentication successful for user: {}", email);

            return new SsoDto.LoginResponse(
                    true,
                    nexusAccessToken,
                    nexusRefreshToken,
                    TICKET_TTL.toSeconds(),
                    new SsoDto.LoginResponse.UserData(generatedUserId, email, fullName)
            );
        } catch (Exception e) {
            log.error("Failed to decode Google id_token: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatusCode.valueOf(400), "Failed to extract identity from Google ID Token");
        }
    }

    /**
     * Xác thực và tiêu thụ vé One-Time
     */
    public String consumeTicket(String ticket) {
        if (redisTemplate == null) {
            log.warn("Redis unavailable. Skipping ticket verification.");
            return "UNKNOWN";
        }

        String redisKey = REDIS_TICKET_PREFIX + ticket;
        String currentValue = redisTemplate.opsForValue().get(redisKey);

        if (currentValue == null) {
            log.warn("SSO ticket does not exist or expired after 10m: {}", ticket);
            throw new ResponseStatusException(
                    HttpStatusCode.valueOf(400),
                    "Code Invalid. Try Again"
            );
        }

        if (currentValue.startsWith(STATUS_USED + ":")) {
            log.warn("[SECURITY_ALERT] Replay attack detected for ticket: {}", ticket);
            throw new ResponseStatusException(
                    HttpStatusCode.valueOf(400),
                    "Code already used"
            );
        }

        if (currentValue.startsWith(STATUS_PENDING + ":")) {
            String email = currentValue.substring((STATUS_PENDING + ":").length());
            Long remainingTtl = redisTemplate.getExpire(redisKey);

            Duration keepDuration = (remainingTtl != null && remainingTtl > 0)
                    ? Duration.ofSeconds(remainingTtl)
                    : TICKET_TTL;

            redisTemplate.opsForValue().set(redisKey, STATUS_USED + ":" + email, keepDuration);
            log.info("SSO ticket consumed successfully for user: {}. Status set to [USED]", email);
            return email;
        }

        throw new ResponseStatusException(HttpStatusCode.valueOf(400), "Code Invalid. Try Again");
    }
}
