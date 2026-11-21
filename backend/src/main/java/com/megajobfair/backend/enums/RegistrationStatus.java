package com.megajobfair.backend.enums;

import java.util.EnumSet;
import java.util.Set;

/**
 * Status of one student at one company.
 * REGISTERED -> WAITING -> IN_INTERVIEW -> SELECTED / REJECTED
 * WAITING -> REGISTERED when the student drops the queue.
 */
public enum RegistrationStatus {
    REGISTERED,
    WAITING,
    IN_INTERVIEW,
    SELECTED,
    REJECTED;

    public Set<RegistrationStatus> allowedNext() {
        return switch (this) {
            case REGISTERED -> EnumSet.of(WAITING);
            case WAITING -> EnumSet.of(REGISTERED, IN_INTERVIEW);
            case IN_INTERVIEW -> EnumSet.of(SELECTED, REJECTED);
            case SELECTED, REJECTED -> EnumSet.noneOf(RegistrationStatus.class);
        };
    }

    public boolean canMoveTo(RegistrationStatus next) {
        return allowedNext().contains(next);
    }
}
