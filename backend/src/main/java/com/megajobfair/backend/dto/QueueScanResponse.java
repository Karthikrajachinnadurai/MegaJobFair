package com.megajobfair.backend.dto;

import com.megajobfair.backend.enums.RegistrationStatus;

import java.time.Instant;


public record QueueScanResponse(
        Long registrationId,
        Long studentId,
        String studentName,
        String registerNo,
        String department,
        String companyName,
        RegistrationStatus status,
        boolean alreadyInQueue,
        Instant joinedAt,
        long waitingCount
) {
}