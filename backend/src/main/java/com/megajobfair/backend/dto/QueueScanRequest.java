package com.megajobfair.backend.dto;

import jakarta.validation.constraints.NotBlank;

/** Sent by the company volunteer's scanner: the token inside the student's company QR. */
public record QueueScanRequest(@NotBlank String qrToken) {
}