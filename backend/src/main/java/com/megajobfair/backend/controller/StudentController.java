package com.megajobfair.backend.controller;

import com.megajobfair.backend.dto.RegistrationResponse;
import com.megajobfair.backend.dto.StudentCompanyResponse;
import com.megajobfair.backend.dto.StudentResponse;
import com.megajobfair.backend.security.AuthUser;
import com.megajobfair.backend.service.CompanyService;
import com.megajobfair.backend.service.RegistrationService;
import com.megajobfair.backend.service.StudentService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Student portal. Requires role STUDENT. The student is always taken from the token, never from the URL. */
@RestController
@RequestMapping("/api/student")
public class StudentController {

    private final StudentService studentService;
    private final CompanyService companyService;
    private final RegistrationService registrationService;

    public StudentController(StudentService studentService,
                             CompanyService companyService,
                             RegistrationService registrationService) {
        this.studentService = studentService;
        this.companyService = companyService;
        this.registrationService = registrationService;
    }

    @GetMapping("/me")
    public StudentResponse me(@AuthenticationPrincipal AuthUser user) {
        return studentService.me(user);
    }

    @GetMapping("/companies")
    public List<StudentCompanyResponse> companies(@AuthenticationPrincipal AuthUser user) {
        return companyService.listForStudent(user);
    }

    @PostMapping("/companies/{companyId}/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegistrationResponse register(@AuthenticationPrincipal AuthUser user, @PathVariable Long companyId) {
        return registrationService.register(user, companyId);
    }

    /** The student's registrations, each with its company QR token, status and live waiting count. */
    @GetMapping("/registrations")
    public List<RegistrationResponse> registrations(@AuthenticationPrincipal AuthUser user) {
        return registrationService.myRegistrations(user);
    }
}
