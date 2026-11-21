package com.megajobfair.backend.service;

import com.megajobfair.backend.dto.LoginRequest;
import com.megajobfair.backend.dto.LoginResponse;
import com.megajobfair.backend.entity.User;
import com.megajobfair.backend.exception.ApiException;
import com.megajobfair.backend.repository.UserRepository;
import com.megajobfair.backend.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        // Same message for "no such user" and "wrong password", so attackers can't discover which emails exist
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .filter(User::isEnabled)
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid email or password");
        }

        JwtService.IssuedToken issued = jwtService.issue(user);
        Long companyId = user.getCompany() == null ? null : user.getCompany().getId();
        return new LoginResponse(issued.token(), user.getRole(), user.getEmail(), companyId, issued.expiresAt());
    }
}
