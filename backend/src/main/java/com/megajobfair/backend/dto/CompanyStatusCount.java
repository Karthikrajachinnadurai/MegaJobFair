package com.megajobfair.backend.dto;

import com.megajobfair.backend.enums.RegistrationStatus;

/** Result row of a "count registrations grouped by company and status" query. */
public record CompanyStatusCount(Long companyId, RegistrationStatus status, Long count) {
}
