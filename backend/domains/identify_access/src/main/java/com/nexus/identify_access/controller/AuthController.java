package com.nexus.identify_access.controller;

import com.nexus.identify_access.dto.ApiResponse;
import com.nexus.identify_access.dto.AuthorizeUrlResponse;
import com.nexus.identify_access.service.SsoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth/sso")
public class AuthController {

    private final SsoService ssoService;

    public AuthController(SsoService ssoService) {
        this.ssoService = ssoService;
    }

    @GetMapping("/authorize-url")
    public ResponseEntity<ApiResponse<AuthorizeUrlResponse>> getAuthorizeUrl() {
        AuthorizeUrlResponse response = ssoService.getAuthorizationUrl();
        return ResponseEntity.ok(ApiResponse.success(response, "Google Authorization URL generated successfully"));
    }
}

