package com.megajobfair.backend.repository;

import com.megajobfair.backend.dto.CompanyStatusCount;
import com.megajobfair.backend.entity.Registration;
import com.megajobfair.backend.enums.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    List<Registration> findByStudent_IdOrderByRegisteredAtAsc(Long studentId);

    boolean existsByStudent_IdAndCompany_Id(Long studentId, Long companyId);

    Optional<Registration> findByCompanyQrToken(String companyQrToken);

    long countByCompany_IdAndStatus(Long companyId, RegistrationStatus status);

    /** How many registrations each company has in each status. Used by the admin dashboard. */
    @Query("""
            select new com.megajobfair.backend.dto.CompanyStatusCount(r.company.id, r.status, count(r))
            from Registration r
            group by r.company.id, r.status
            """)
    List<CompanyStatusCount> countAllByCompanyAndStatus();

    /** How many students are in one status (e.g. WAITING) at each company. Used for live waiting counts. */
    @Query("""
            select new com.megajobfair.backend.dto.CompanyStatusCount(r.company.id, r.status, count(r))
            from Registration r
            where r.status = :status
            group by r.company.id, r.status
            """)
    List<CompanyStatusCount> countByStatusPerCompany(@Param("status") RegistrationStatus status);
}
