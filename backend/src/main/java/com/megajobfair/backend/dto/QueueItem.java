package com.megajobfair.backend.dto;

import com.megajobfair.backend.enums.RegistrationStatus;

import java.time.Instant;

/** One student in a company's queue. position is 1, 2, 3... for waiting students and null for those in interview. */
public record QueueItem(
        Integer position,
        Long registrationId,
        Long studentId,
        String studentName,
        String registerNo,
        String department,
        RegistrationStatus status,
        Instant joinedAt
) {
}