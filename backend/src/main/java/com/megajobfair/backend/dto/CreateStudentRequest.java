package com.megajobfair.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Manual student entry by the admin. Normally students come from the Python Google Form import;
 * this is for testing and for walk-ins.
 */
public record CreateStudentRequest(
        @NotBlank @Size(max = 150) String name,
        @NotBlank @Email String email,
        @Size(max = 50) String registerNo,
        @Size(max = 100) String department,
        Integer studyYear,
        @Size(max = 20) String phone
) {
}
