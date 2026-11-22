package com.megajobfair.backend.enums;

public enum Role {
    ADMIN,
    STUDENT,
    GATE_VOLUNTEER,
    COMPANY_VOLUNTEER,
    HR;

    /** Roles that must be linked to a company. */
    public boolean isCompanyStaff() {
        return this == COMPANY_VOLUNTEER || this == HR;
    }
}
