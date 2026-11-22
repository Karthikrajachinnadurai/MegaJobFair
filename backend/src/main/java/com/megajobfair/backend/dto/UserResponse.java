package com.megajobfair.backend.dto;

import com.megajobfair.backend.enums.Role;

/** Never contains the password hash. */
public record UserResponse(
        Long id,
        String email,
        Role role,
        Long companyId,
        boolean enabled
) {
}
