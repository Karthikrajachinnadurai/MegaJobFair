package com.megajobfair.backend.util;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.UUID;

@Component
public class TokenGenerator {

    // no 0/O, 1/l/I: students type this password on a phone
    private static final String PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

    private final SecureRandom random = new SecureRandom();

    /** Random, unguessable token for QR codes. UUID v4 uses SecureRandom internally. */
    public String newQrToken() {
        return UUID.randomUUID().toString();
    }

    public String randomPassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(PASSWORD_CHARS.charAt(random.nextInt(PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }
}
