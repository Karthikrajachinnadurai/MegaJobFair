package com.megajobfair.backend.security;

import com.megajobfair.backend.enums.Role;

/**
 * The logged-in user, rebuilt from the JWT on every request.
 * Controllers receive it with @AuthenticationPrincipal AuthUser user.
 */
public record AuthUser(Long id, String email, Role role, Long companyId) {
}
