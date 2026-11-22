package com.megajobfair.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record GateScanRequest(@NotBlank String qrToken) {
}
