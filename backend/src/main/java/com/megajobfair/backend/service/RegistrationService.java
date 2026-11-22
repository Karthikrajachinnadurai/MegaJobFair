package com.megajobfair.backend.service;

import com.megajobfair.backend.dto.CompanyStatusCount;
import com.megajobfair.backend.dto.RegistrationResponse;
import com.megajobfair.backend.entity.Company;
import com.megajobfair.backend.entity.Registration;
import com.megajobfair.backend.entity.Student;
import com.megajobfair.backend.enums.RegistrationStatus;
import com.megajobfair.backend.exception.ApiException;
import com.megajobfair.backend.repository.CompanyRepository;
import com.megajobfair.backend.repository.RegistrationRepository;
import com.megajobfair.backend.security.AuthUser;
import com.megajobfair.backend.util.TokenGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final CompanyRepository companyRepository;
    private final StudentService studentService;
    private final TokenGenerator tokenGenerator;

    public RegistrationService(RegistrationRepository registrationRepository,
                               CompanyRepository companyRepository,
                               StudentService studentService,
                               TokenGenerator tokenGenerator) {
        this.registrationRepository = registrationRepository;
        this.companyRepository = companyRepository;
        this.studentService = studentService;
        this.tokenGenerator = tokenGenerator;
    }

    /** Student registers for a company and gets that company's unique QR token. */
    @Transactional
    public RegistrationResponse register(AuthUser authUser, Long companyId) {
        Student student = studentService.getCurrentStudent(authUser);
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> ApiException.notFound("Company not found"));
        if (!company.isActive()) {
            throw ApiException.conflict("This company is not accepting registrations");
        }
        if (registrationRepository.existsByStudent_IdAndCompany_Id(student.getId(), companyId)) {
            throw ApiException.conflict("You are already registered for this company");
        }

        Registration registration = new Registration();
        registration.setStudent(student);
        registration.setCompany(company);
        registration.setCompanyQrToken(tokenGenerator.newQrToken());
        registration = registrationRepository.save(registration);

        long waiting = registrationRepository.countByCompany_IdAndStatus(companyId, RegistrationStatus.WAITING);
        return toResponse(registration, waiting);
    }

    @Transactional(readOnly = true)
    public List<RegistrationResponse> myRegistrations(AuthUser authUser) {
        Student student = studentService.getCurrentStudent(authUser);
        Map<Long, Long> waiting = registrationRepository.countByStatusPerCompany(RegistrationStatus.WAITING)
                .stream()
                .collect(Collectors.toMap(CompanyStatusCount::companyId, CompanyStatusCount::count));

        return registrationRepository.findByStudent_IdOrderByRegisteredAtAsc(student.getId()).stream()
                .map(r -> toResponse(r, waiting.getOrDefault(r.getCompany().getId(), 0L)))
                .toList();
    }

    /**
     * THE single place where a registration's status changes. Shared with Module 2 (queue / HR):
     * always call this instead of calling setStatus() directly, so the rules live in one place.
     * Allowed moves are defined in RegistrationStatus.allowedNext().
     */
    @Transactional
    public Registration changeStatus(Long registrationId, RegistrationStatus next) {
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> ApiException.notFound("Registration not found"));
        return changeStatus(registration, next);
    }

    @Transactional
    public Registration changeStatus(Registration registration, RegistrationStatus next) {
        RegistrationStatus current = registration.getStatus();
        if (!current.canMoveTo(next)) {
            throw ApiException.conflict("Cannot change status from " + current + " to " + next);
        }
        registration.setStatus(next);
        return registration;
    }

    private RegistrationResponse toResponse(Registration r, long waitingCount) {
        Company c = r.getCompany();
        return new RegistrationResponse(r.getId(), c.getId(), c.getName(), c.getCabinNo(),
                r.getStatus(), r.getCompanyQrToken(), r.getRegisteredAt(), waitingCount);
    }
}
