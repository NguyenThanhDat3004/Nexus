package com.nexus.identify_access.dto;

public class SsoDto {

    public record CallbackRequest(
            String provider,
            String code,
            String redirectUri
    ) {}

    public record LoginResponse(
            boolean success,
            String accessToken,
            String refreshToken,
            long expiresIn, // Số giây hiệu lực của vé từ Backend (Single Source of Truth)
            UserData user
    ) {
        public record UserData(
                String id,
                String email,
                String fullName
        ) {}
    }
}
