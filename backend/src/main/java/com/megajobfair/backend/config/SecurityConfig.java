package com.megajobfair.backend.config;

import com.megajobfair.backend.security.JwtAuthFilter;
import com.megajobfair.backend.security.JwtService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtService jwtService) throws Exception {
        http
                // JWT in a header, not cookies, so CSRF protection is not needed
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                // no server-side sessions: every request carries its own token
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/gate/**").hasAnyRole("GATE_VOLUNTEER", "ADMIN")
                        .requestMatchers("/api/student/**").hasRole("STUDENT")
                        // Module 2 (Java teammate)
                        .requestMatchers("/api/queue/**").hasAnyRole("COMPANY_VOLUNTEER", "HR")
                        .requestMatchers("/api/hr/**").hasRole("HR")
                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) ->
                                writeError(res, 401, "Unauthorized", "Login required or token expired"))
                        .accessDeniedHandler((req, res, e) ->
                                writeError(res, 403, "Forbidden", "Your role cannot access this")))
                .addFilterBefore(new JwtAuthFilter(jwtService), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** Lets the frontend (running on a different port) call this API from the browser. */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.frontend.allowed-origins}") String allowedOrigins) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    /** Same JSON shape as ApiError, written by hand because this runs before controllers. */
    private static void writeError(HttpServletResponse res, int status, String error, String message)
            throws IOException {
        res.setStatus(status);
        res.setContentType("application/json");
        res.getWriter().write("{\"timestamp\":\"" + Instant.now() + "\",\"status\":" + status
                + ",\"error\":\"" + error + "\",\"message\":\"" + message + "\",\"fieldErrors\":null}");
    }
}
