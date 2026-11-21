package com.megajobfair.backend.service;

import com.megajobfair.backend.dto.CompanyUserRequest;
import com.megajobfair.backend.dto.CredentialsResponse;
import com.megajobfair.backend.dto.StaffAccountRequest;
import com.megajobfair.backend.dto.UserResponse;
import com.megajobfair.backend.entity.Company;
import com.megajobfair.backend.entity.Student;
import com.megajobfair.backend.entity.User;
import com.megajobfair.backend.enums.Role;
import com.megajobfair.backend.exception.ApiException;
import com.megajobfair.backend.repository.AttendanceRepository;
import com.megajobfair.backend.repository.CompanyRepository;
import com.megajobfair.backend.repository.StudentRepository;
import com.megajobfair.backend.repository.UserRepository;
import com.megajobfair.backend.util.TokenGenerator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Creates login accounts: company volunteer / HR, gate volunteers, and student credentials. */
@Service
public class UserAccountService {

    private static final int STUDENT_PASSWORD_LENGTH = 10;

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenGenerator tokenGenerator;
    private final NotificationService notificationService;

    public UserAccountService(UserRepository userRepository,
                              CompanyRepository companyRepository,
                              StudentRepository studentRepository,
                              AttendanceRepository attendanceRepository,
                              PasswordEncoder passwordEncoder,
                              TokenGenerator tokenGenerator,
                              NotificationService notificationService) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.studentRepository = studentRepository;
        this.attendanceRepository = attendanceRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenGenerator = tokenGenerator;
        this.notificationService = notificationService;
    }

    @Transactional
    public UserResponse createCompanyUser(Long companyId, CompanyUserRequest request) {
        if (!request.role().isCompanyStaff()) {
            throw ApiException.badRequest("Company logins must have role COMPANY_VOLUNTEER or HR");
        }
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> ApiException.notFound("Company not found"));

        User user = newUser(request.email(), request.password(), request.role());
        user.setCompany(company);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse createGateVolunteer(StaffAccountRequest request) {
        User user = newUser(request.email(), request.password(), Role.GATE_VOLUNTEER);
        return toResponse(userRepository.save(user));
    }

    /**
     * Gives a checked-in student a fresh random password and asks the Python service to email it.
     * Creates the student's login account the first time. The plain password is never stored.
     * Must be called inside a transaction (GateService and resetStudentCredentials do that).
     *
     * @return true if the email was handed to the Python service.
     */
    public boolean issueStudentCredentials(Student student) {
        String password = tokenGenerator.randomPassword(STUDENT_PASSWORD_LENGTH);

        User user = student.getUser();
        if (user == null) {
            if (userRepository.existsByEmailIgnoreCase(student.getEmail())) {
                throw ApiException.conflict("This student's email is already used by a staff account");
            }
            user = new User();
            user.setEmail(student.getEmail().trim().toLowerCase());
            user.setRole(Role.STUDENT);
            user.setPasswordHash(passwordEncoder.encode(password));
            user = userRepository.save(user);
            student.setUser(user);
        } else {
            user.setPasswordHash(passwordEncoder.encode(password));
        }

        return notificationService.sendCredentials(student.getEmail(), student.getName(), password);
    }

    /** Admin action: student lost the email or the email failed. Generates a new password. */
    @Transactional
    public CredentialsResponse resetStudentCredentials(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> ApiException.notFound("Student not found"));
        if (!attendanceRepository.existsByStudent_Id(studentId)) {
            throw ApiException.conflict("Student has not checked in at the gate yet");
        }
        return new CredentialsResponse(issueStudentCredentials(student));
    }

    private User newUser(String email, String rawPassword, Role role) {
        String normalized = email.trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalized)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        User user = new User();
        user.setEmail(normalized);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        return user;
    }

    private UserResponse toResponse(User user) {
        Long companyId = user.getCompany() == null ? null : user.getCompany().getId();
        return new UserResponse(user.getId(), user.getEmail(), user.getRole(), companyId, user.isEnabled());
    }
}
