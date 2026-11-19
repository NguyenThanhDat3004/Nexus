package com.nexus.identify_access.service;

import com.nexus.identify_access.dto.AuthorizeUrlResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class SsoService {

    @Value("${sso.google.client-id}")
    private String googleClientId;

    @Value("${sso.google.redirect-uri}")
    private String googleRedirectUri;

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
}
