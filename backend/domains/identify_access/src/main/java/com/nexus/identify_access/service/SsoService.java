package com.nexus.identify_access.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexus.identify_access.dto.AuthorizeUrlResponse;
import com.nexus.identify_access.dto.SsoDto;
import com.nexus.identify_access.entity.Account;
import com.nexus.identify_access.entity.Profile;
import com.nexus.identify_access.repository.AccountRepository;
import com.nexus.identify_access.repository.ProfileRepository;
import com.nexus.shared.redis.lock.RedisLockService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class SsoService {

    private static final Logger log = LoggerFactory.getLogger(SsoService.class);
    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String REDIS_TICKET_PREFIX = "nexus:sso:ticket:";

    private static final Duration TICKET_TTL = Duration.ofMinutes(10);
    private static final Pattern PIN_PATTERN = Pattern.compile("^\\d{8}$");

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_USED = "USED";

    @Value("${sso.google.client-id}")
    private String googleClientId;

    @Value("${sso.google.client-secret}")
    private String googleClientSecret;

    @Value("${sso.google.redirect-uri}")
    private String googleRedirectUri;

    private final AccountRepository accountRepository;
    private final ProfileRepository profileRepository;
    private final RedisLockService redisLockService;

    private final RestClient restClient = RestClient.builder().build();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Argon2PasswordEncoder argon2Encoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    public SsoService(AccountRepository accountRepository,
                      ProfileRepository profileRepository,
                      RedisLockService redisLockService) {
        this.accountRepository = accountRepository;
        this.profileRepository = profileRepository;
        this.redisLockService = redisLockService;
    }

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
     * Trao đổi authorization code từ Google, giải mã id_token.
     * Quy tắc:
     * 1. Search database theo email.
     * 2. Nếu CHƯA CÓ tài khoản: trả về isNewUser = true + thông tin pre-fill (email, fullName, avatarUrl, providerId)
     *    để frontend hiển thị popup/form đăng ký.
     * 3. Nếu ĐÃ CÓ tài khoản: cấp vé/session (isNewUser = false) để log thẳng vào workspace dashboard.
     */
    @Transactional
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

        try {
            String idToken = tokenNode.get("id_token").asText();
            String[] parts = idToken.split("\\.");
            if (parts.length < 2) {
                throw new IllegalArgumentException("Invalid JWT format");
            }
            byte[] decodedBytes = Base64.getUrlDecoder().decode(parts[1]);
            JsonNode payload = objectMapper.readTree(new String(decodedBytes, StandardCharsets.UTF_8));

            String email = payload.get("email").asText().toLowerCase().trim();
            String fullName = payload.has("name") ? payload.get("name").asText() : email;
            String avatarUrl = payload.has("picture") ? payload.get("picture").asText() : null;
            String providerId = payload.has("sub") ? payload.get("sub").asText() : null;

            log.info("Searching database for existing account with email: {}", email);
            Optional<Account> existingAccountOpt = accountRepository.findByEmail(email);

            if (existingAccountOpt.isEmpty()) {
                // TRƯỜNG HỢP 1: Chưa có tài khoản trong DB -> Trả về isNewUser = true để hiện popup đăng ký
                log.info("Account not found for email: {}. Prompting user to complete registration.", email);
                return new SsoDto.LoginResponse(
                        true,
                        true, // isNewUser = true
                        null, // Không cấp access token đăng nhập cho đến khi đăng ký hoàn tất
                        null,
                        0,
                        new SsoDto.LoginResponse.UserData(
                                providerId,
                                email,
                                fullName,
                                avatarUrl,
                                "USER"
                        )
                );
            }

            // TRƯỜNG HỢP 2: Đã có tài khoản trong DB -> Cấp vé session/JWT để log vào dashboard workspace
            Account account = existingAccountOpt.get();
            account.setLastLoginAt(OffsetDateTime.now());
            accountRepository.save(account);

            String userFullName = fullName;
            String userAvatar = avatarUrl;
            Optional<Profile> profileOpt = profileRepository.findByAccountId(account.getId());
            if (profileOpt.isPresent()) {
                Profile profile = profileOpt.get();
                if (profile.getFullName() != null && !profile.getFullName().isBlank()) {
                    userFullName = profile.getFullName();
                }
                if (profile.getAvatarUrl() != null && !profile.getAvatarUrl().isBlank()) {
                    userAvatar = profile.getAvatarUrl();
                }
            }

            String nexusAccessToken = "nexus_jwt_" + UUID.randomUUID();
            String nexusRefreshToken = "nexus_rf_" + UUID.randomUUID();

            if (redisTemplate != null) {
                try {
                    String redisKey = REDIS_TICKET_PREFIX + nexusAccessToken;
                    String redisValue = STATUS_PENDING + ":" + email;
                    redisTemplate.opsForValue().set(redisKey, redisValue, TICKET_TTL);
                    log.info("Initialized SSO ticket [PENDING] in Redis: {} [TTL = 10m]", redisKey);
                } catch (Exception redisEx) {
                    log.warn("Unable to connect to Redis ({}). Continuing auth flow without Redis cache.", redisEx.getMessage());
                }
            }

            log.info("Google authentication successful for existing user: {}", email);

            return new SsoDto.LoginResponse(
                    true,
                    false, // isNewUser = false
                    nexusAccessToken,
                    nexusRefreshToken,
                    TICKET_TTL.toSeconds(),
                    new SsoDto.LoginResponse.UserData(
                            account.getId().toString(),
                            account.getEmail(),
                            userFullName,
                            userAvatar,
                            account.getRole()
                    )
            );
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to decode Google id_token or verify user: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatusCode.valueOf(400), "Failed to extract identity from Google ID Token");
        }
    }

    /**
     * Đăng ký tài khoản mới sau khi người dùng xác nhận thông tin từ popup SSO.
     * Sử dụng Redis Distributed Lock để khóa nguyên tử lúc ghi dữ liệu xuống DB,
     * chống race condition và duplicate inserts.
     */
    @Transactional
    public SsoDto.LoginResponse registerSsoUser(SsoDto.RegistrationRequest request) {
        if (request.email() == null || request.email().isBlank()) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(400), "Email is required");
        }
        if (!request.agreedPolicy()) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(400), "You must agree to the Terms and Policies");
        }
        if (request.pin() == null || !PIN_PATTERN.matcher(request.pin()).matches()) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(400), "PIN must be exactly 8 numeric digits");
        }
        if (request.confirmPin() == null || !PIN_PATTERN.matcher(request.confirmPin()).matches()) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(400), "Confirm PIN must be exactly 8 numeric digits");
        }
        if (!request.pin().equals(request.confirmPin())) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(400), "PIN confirmation does not match");
        }

        String email = request.email().toLowerCase().trim();
        String lockKey = "db:save:register:" + email;

        // 1. Kiểm tra Cooldown: Chặn double click spam liên tiếp (2 giây vừa đủ mượt cho UX)
        redisLockService.acquireCooldownOrThrow("register:cooldown:" + email, Duration.ofSeconds(2));

        // 2. Khóa phân tán Redis nguyên tử (Distributed Lock) trong lúc thao tác Database
        boolean lockAcquired = redisLockService.tryAcquire(lockKey, Duration.ofSeconds(10));
        if (!lockAcquired) {
            log.warn("Database registration lock collision for email: {}", email);
            throw new ResponseStatusException(
                    HttpStatusCode.valueOf(409),
                    "Registration request is already processing in database. Please wait."
            );
        }

        try {
            if (accountRepository.existsByEmail(email)) {
                throw new ResponseStatusException(HttpStatusCode.valueOf(409), "Account with this email already exists");
            }

            log.info("Locked Redis for DB persistence. Registering new SSO user: {}", email);

            // 3. Tạo account & hash mã PIN bằng Argon2 (chỉ lưu pinHash, không lưu confirmPin)
            Account account = new Account(
                    email,
                    "GOOGLE",
                    request.providerId(),
                    request.role() != null && !request.role().isBlank() ? request.role() : "USER",
                    true // Google email is verified
            );
            account.setPinHash(argon2Encoder.encode(request.pin()));
            account.setLastLoginAt(OffsetDateTime.now());
            Account savedAccount = accountRepository.save(account);

            // 4. Tạo profile
            Profile profile = new Profile(savedAccount, request.fullName(), request.avatarUrl());
            Profile savedProfile = profileRepository.save(profile);

            // 5. Cấp session token & Redis SSO Ticket
            String nexusAccessToken = "nexus_jwt_" + UUID.randomUUID();
            String nexusRefreshToken = "nexus_rf_" + UUID.randomUUID();

            if (redisTemplate != null) {
                try {
                    String redisKey = REDIS_TICKET_PREFIX + nexusAccessToken;
                    String redisValue = STATUS_PENDING + ":" + email;
                    redisTemplate.opsForValue().set(redisKey, redisValue, TICKET_TTL);
                    log.info("Initialized SSO ticket [PENDING] in Redis for newly registered user: {}", redisKey);
                } catch (Exception redisEx) {
                    log.warn("Unable to connect to Redis ({}). Continuing auth flow without Redis cache.", redisEx.getMessage());
                }
            }

            log.info("SSO user registration committed to DB successfully: {}", email);

            return new SsoDto.LoginResponse(
                    true,
                    false, // Newly registered, now logged in
                    nexusAccessToken,
                    nexusRefreshToken,
                    TICKET_TTL.toSeconds(),
                    new SsoDto.LoginResponse.UserData(
                            savedAccount.getId().toString(),
                            savedAccount.getEmail(),
                            savedProfile.getFullName(),
                            savedProfile.getAvatarUrl(),
                            savedAccount.getRole()
                    )
            );
        } finally {
            // Giải phóng khóa Redis ngay sau khi hoàn tất giao dịch lưu DB
            redisLockService.releaseLock(lockKey);
            log.debug("Released Redis DB persistence lock for email: {}", email);
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
