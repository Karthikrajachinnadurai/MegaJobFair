package com.megajobfair.backend.dto;

import java.time.Instant;

/**
 * What the gate volunteer sees after a scan.
 * alreadyCheckedIn = true means this QR was scanned before; nothing new happened.
 */
public record GateScanResponse(
        Long studentId,
        String name,
        String email,
        String registerNo,
        String department,
        boolean alreadyCheckedIn,
        Instant checkedInAt,
        boolean credentialsSent
) {
}
