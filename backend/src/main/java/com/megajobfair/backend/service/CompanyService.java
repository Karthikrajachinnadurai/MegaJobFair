package com.megajobfair.backend.service;

import com.megajobfair.backend.dto.CompanyResponse;
import com.megajobfair.backend.dto.CompanyStatusCount;
import com.megajobfair.backend.dto.CreateCompanyRequest;
import com.megajobfair.backend.dto.StudentCompanyResponse;
import com.megajobfair.backend.entity.Company;
import com.megajobfair.backend.entity.Student;
import com.megajobfair.backend.enums.RegistrationStatus;
import com.megajobfair.backend.exception.ApiException;
import com.megajobfair.backend.repository.CompanyRepository;
import com.megajobfair.backend.repository.RegistrationRepository;
import com.megajobfair.backend.security.AuthUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final RegistrationRepository registrationRepository;
    private final StudentService studentService;

    public CompanyService(CompanyRepository companyRepository,
                          RegistrationRepository registrationRepository,
                          StudentService studentService) {
        this.companyRepository = companyRepository;
        this.registrationRepository = registrationRepository;
        this.studentService = studentService;
    }

    @Transactional
    public CompanyResponse create(CreateCompanyRequest request) {
        String name = request.name().trim();
        if (companyRepository.existsByNameIgnoreCase(name)) {
            throw ApiException.conflict("A company with this name already exists");
        }
        Company company = new Company();
        company.setName(name);
        company.setDescription(request.description());
        company.setRolesOffered(request.rolesOffered());
        company.setCabinNo(request.cabinNo());
        return toResponse(companyRepository.save(company));
    }

    @Transactional(readOnly = true)
    public List<CompanyResponse> listAll() {
        return companyRepository.findAllByOrderByNameAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    /** Inactive companies disappear from the student list and stop accepting registrations. */
    @Transactional
    public CompanyResponse setActive(Long companyId, boolean active) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> ApiException.notFound("Company not found"));
        company.setActive(active);
        return toResponse(company);
    }

    /** The student's company list: active companies, live waiting counts, and which ones they joined. */
    @Transactional(readOnly = true)
    public List<StudentCompanyResponse> listForStudent(AuthUser authUser) {
        Student student = studentService.getCurrentStudent(authUser);

        Map<Long, Long> waiting = registrationRepository.countByStatusPerCompany(RegistrationStatus.WAITING)
                .stream()
                .collect(Collectors.toMap(CompanyStatusCount::companyId, CompanyStatusCount::count));

        Set<Long> registeredCompanyIds = registrationRepository
                .findByStudent_IdOrderByRegisteredAtAsc(student.getId()).stream()
                .map(r -> r.getCompany().getId())
                .collect(Collectors.toSet());

        return companyRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(c -> new StudentCompanyResponse(
                        c.getId(), c.getName(), c.getDescription(), c.getRolesOffered(), c.getCabinNo(),
                        waiting.getOrDefault(c.getId(), 0L),
                        registeredCompanyIds.contains(c.getId())))
                .toList();
    }

    private CompanyResponse toResponse(Company c) {
        return new CompanyResponse(c.getId(), c.getName(), c.getDescription(),
                c.getRolesOffered(), c.getCabinNo(), c.isActive());
    }
}
