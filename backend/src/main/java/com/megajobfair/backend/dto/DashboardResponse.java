package com.megajobfair.backend.dto;

import java.util.List;

public record DashboardResponse(
        long totalStudents,
        long checkedIn,
        long totalCompanies,
        List<CompanyStats> companies
) {
    public record CompanyStats(
            Long companyId,
            String name,
            String cabinNo,
            boolean active,
            long totalRegistrations,
            long registered,
            long waiting,
            long inInterview,
            long selected,
            long rejected
    ) {
    }
}
