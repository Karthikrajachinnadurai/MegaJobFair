package com.megajobfair.backend.dto;

/** Company as the admin sees it. */
public record CompanyResponse(
        Long id,
        String name,
        String description,
        String rolesOffered,
        String cabinNo,
        boolean active
) {
}
