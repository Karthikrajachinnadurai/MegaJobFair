package com.megajobfair.backend.dto;

import com.megajobfair.backend.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Used to create a company login. role must be COMPANY_VOLUNTEER or HR. */
public record CompanyUserRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotNull Role role
) {
}
