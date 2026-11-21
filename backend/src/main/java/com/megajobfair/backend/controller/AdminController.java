package com.megajobfair.backend.controller;

import com.megajobfair.backend.dto.CompanyResponse;
import com.megajobfair.backend.dto.CompanyUserRequest;
import com.megajobfair.backend.dto.CreateCompanyRequest;
import com.megajobfair.backend.dto.CreateStudentRequest;
import com.megajobfair.backend.dto.CredentialsResponse;
import com.megajobfair.backend.dto.DashboardResponse;
import com.megajobfair.backend.dto.StaffAccountRequest;
import com.megajobfair.backend.dto.StudentResponse;
import com.megajobfair.backend.dto.UserResponse;
import com.megajobfair.backend.service.CompanyService;
import com.megajobfair.backend.service.DashboardService;
import com.megajobfair.backend.service.StudentService;
import com.megajobfair.backend.service.UserAccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Everything here requires role ADMIN (enforced in SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final CompanyService companyService;
    private final UserAccountService userAccountService;
    private final StudentService studentService;
    private final DashboardService dashboardService;

    public AdminController(CompanyService companyService,
                           UserAccountService userAccountService,
                           StudentService studentService,
                           DashboardService dashboardService) {
        this.companyService = companyService;
        this.userAccountService = userAccountService;
        this.studentService = studentService;
        this.dashboardService = dashboardService;
    }

    // ---------- companies ----------

    @PostMapping("/companies")
    @ResponseStatus(HttpStatus.CREATED)
    public CompanyResponse createCompany(@Valid @RequestBody CreateCompanyRequest request) {
        return companyService.create(request);
    }

    @GetMapping("/companies")
    public List<CompanyResponse> listCompanies() {
        return companyService.listAll();
    }

    @PatchMapping("/companies/{companyId}/active")
    public CompanyResponse setCompanyActive(@PathVariable Long companyId, @RequestParam boolean value) {
        return companyService.setActive(companyId, value);
    }

    /** Create a COMPANY_VOLUNTEER or HR login for a company. */
    @PostMapping("/companies/{companyId}/users")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createCompanyUser(@PathVariable Long companyId,
                                          @Valid @RequestBody CompanyUserRequest request) {
        return userAccountService.createCompanyUser(companyId, request);
    }

    // ---------- gate volunteers ----------

    @PostMapping("/gate-volunteers")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createGateVolunteer(@Valid @RequestBody StaffAccountRequest request) {
        return userAccountService.createGateVolunteer(request);
    }

    // ---------- students ----------

    @GetMapping("/students")
    public List<StudentResponse> listStudents() {
        return studentService.listAll();
    }

    @PostMapping("/students")
    @ResponseStatus(HttpStatus.CREATED)
    public StudentResponse createStudent(@Valid @RequestBody CreateStudentRequest request) {
        return studentService.create(request);
    }

    @PostMapping("/students/{studentId}/reset-credentials")
    public CredentialsResponse resetCredentials(@PathVariable Long studentId) {
        return userAccountService.resetStudentCredentials(studentId);
    }

    // ---------- dashboard ----------

    @GetMapping("/dashboard")
    public DashboardResponse dashboard() {
        return dashboardService.summary();
    }
}
