package com.nexus.identify_access.dto;

public class SsoDto {

    public record CallbackRequest(
            String provider,
            String code,
            String redirectUri
    ) {}

    public record RegistrationRequest(
            String email,
            String fullName,
            String avatarUrl,
            String providerId,
            String role,
            boolean agreedPolicy,
            String pin,
            String confirmPin
    ) {}

    public record LoginResponse(
            boolean success,
            boolean isNewUser,
            String accessToken,
            String refreshToken,
            long expiresIn, // Ticket/Token TTL in seconds
            UserData user
    ) {
        public record UserData(
                String id,
                String email,
                String fullName,
                String avatarUrl,
                String role
        ) {}
    }
}
