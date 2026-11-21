package com.megajobfair.backend.dto;

import com.megajobfair.backend.enums.RegistrationStatus;

import java.time.Instant;

/** One of the student's company registrations, including that company's QR token. */
public record RegistrationResponse(
        Long id,
        Long companyId,
        String companyName,
        String cabinNo,
        RegistrationStatus status,
        String companyQrToken,
        Instant registeredAt,
        long waitingCount
) {
}
