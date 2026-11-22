package com.megajobfair.backend.dto;

import java.time.Instant;
import java.util.Map;

/** Every error response has this shape, so the frontend can show error messages the same way everywhere. */
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        Map<String, String> fieldErrors
) {
}
