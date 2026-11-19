package com.nexus.identify_access.dto;

public record AuthorizeUrlResponse(
    String provider,
    String authorizationUrl
) {}
