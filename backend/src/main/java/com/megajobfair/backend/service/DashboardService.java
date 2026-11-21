package com.megajobfair.backend.service;

import com.megajobfair.backend.dto.CompanyStatusCount;
import com.megajobfair.backend.dto.DashboardResponse;
import com.megajobfair.backend.dto.DashboardResponse.CompanyStats;
import com.megajobfair.backend.enums.RegistrationStatus;
import com.megajobfair.backend.repository.AttendanceRepository;
import com.megajobfair.backend.repository.CompanyRepository;
import com.megajobfair.backend.repository.RegistrationRepository;
import com.megajobfair.backend.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Admin live view. All counts are computed from registrations.status, never stored separately. */
@Service
public class DashboardService {

    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;
    private final CompanyRepository companyRepository;
    private final RegistrationRepository registrationRepository;

    public DashboardService(StudentRepository studentRepository,
                            AttendanceRepository attendanceRepository,
                            CompanyRepository companyRepository,
                            RegistrationRepository registrationRepository) {
        this.studentRepository = studentRepository;
        this.attendanceRepository = attendanceRepository;
        this.companyRepository = companyRepository;
        this.registrationRepository = registrationRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse summary() {
        // companyId -> (status -> count)
        Map<Long, Map<RegistrationStatus, Long>> counts = new HashMap<>();
        for (CompanyStatusCount row : registrationRepository.countAllByCompanyAndStatus()) {
            counts.computeIfAbsent(row.companyId(), id -> new EnumMap<>(RegistrationStatus.class))
                    .put(row.status(), row.count());
        }

        List<CompanyStats> companies = companyRepository.findAllByOrderByNameAsc().stream()
                .map(c -> {
                    Map<RegistrationStatus, Long> m = counts.getOrDefault(c.getId(), Map.of());
                    long total = m.values().stream().mapToLong(Long::longValue).sum();
                    return new CompanyStats(c.getId(), c.getName(), c.getCabinNo(), c.isActive(), total,
                            m.getOrDefault(RegistrationStatus.REGISTERED, 0L),
                            m.getOrDefault(RegistrationStatus.WAITING, 0L),
                            m.getOrDefault(RegistrationStatus.IN_INTERVIEW, 0L),
                            m.getOrDefault(RegistrationStatus.SELECTED, 0L),
                            m.getOrDefault(RegistrationStatus.REJECTED, 0L));
                })
                .toList();

        return new DashboardResponse(studentRepository.count(), attendanceRepository.count(),
                companies.size(), companies);
    }
}
