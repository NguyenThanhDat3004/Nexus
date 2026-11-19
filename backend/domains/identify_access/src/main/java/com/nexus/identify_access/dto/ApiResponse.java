package com.nexus.identify_access.dto;

import java.time.Instant;

public record ApiResponse<T>(
    boolean success,
    int code,
    String message,
    T data,
    Instant timestamp
) {
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, 200, message, data, Instant.now());
    }

    public static <T> ApiResponse<T> error(int code, String message) {
        return new ApiResponse<>(false, code, message, null, Instant.now());
    }
}
