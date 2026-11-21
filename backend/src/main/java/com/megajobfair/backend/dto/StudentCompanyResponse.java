package com.megajobfair.backend.dto;

/** Company as a student sees it in the company list. */
public record StudentCompanyResponse(
        Long id,
        String name,
        String description,
        String rolesOffered,
        String cabinNo,
        long waitingCount,
        boolean registered
) {
}
