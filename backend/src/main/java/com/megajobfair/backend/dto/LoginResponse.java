package com.megajobfair.backend.dto;

import com.megajobfair.backend.enums.Role;

import java.time.Instant;

public record LoginResponse(
        String token,
        Role role,
        String email,
        Long companyId,
        Instant expiresAt
) {
}
