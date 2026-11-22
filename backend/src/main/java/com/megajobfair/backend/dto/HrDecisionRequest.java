package com.megajobfair.backend.dto;

import com.megajobfair.backend.enums.RegistrationStatus;
import jakarta.validation.constraints.NotNull;

/** HR's final decision. Only SELECTED or REJECTED are accepted (checked in HrService). */
public record HrDecisionRequest(@NotNull RegistrationStatus decision) {
}