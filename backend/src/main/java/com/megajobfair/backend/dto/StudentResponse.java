package com.megajobfair.backend.dto;

import java.time.Instant;

public record StudentResponse(
        Long id,
        String name,
        String email,
        String registerNo,
        String department,
        Integer studyYear,
        String phone,
        /** The gate QR token. Shown to the student themselves and to the admin. */
        String qrToken,
        boolean checkedIn,
        Instant checkedInAt
) {
}
