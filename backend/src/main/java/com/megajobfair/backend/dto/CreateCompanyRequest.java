package com.megajobfair.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCompanyRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 1000) String description,
        @Size(max = 500) String rolesOffered,
        @Size(max = 50) String cabinNo
) {
}
