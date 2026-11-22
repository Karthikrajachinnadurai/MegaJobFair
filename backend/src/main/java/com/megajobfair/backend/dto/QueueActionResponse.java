package com.megajobfair.backend.dto;

import com.megajobfair.backend.enums.RegistrationStatus;

/** Result of drop, in-interview and decision: the student's new status and the company's waiting count. */
public record QueueActionResponse(
        Long registrationId,
        Long studentId,
        String studentName,
        Long companyId,
        String companyName,
        RegistrationStatus status,
        long waitingCount
) {
}