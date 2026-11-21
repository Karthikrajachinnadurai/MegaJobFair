package com.megajobfair.backend.service;

import com.megajobfair.backend.dto.CreateStudentRequest;
import com.megajobfair.backend.dto.StudentResponse;
import com.megajobfair.backend.entity.Attendance;
import com.megajobfair.backend.entity.Student;
import com.megajobfair.backend.exception.ApiException;
import com.megajobfair.backend.repository.AttendanceRepository;
import com.megajobfair.backend.repository.StudentRepository;
import com.megajobfair.backend.security.AuthUser;
import com.megajobfair.backend.util.TokenGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;
    private final TokenGenerator tokenGenerator;

    public StudentService(StudentRepository studentRepository,
                          AttendanceRepository attendanceRepository,
                          TokenGenerator tokenGenerator) {
        this.studentRepository = studentRepository;
        this.attendanceRepository = attendanceRepository;
        this.tokenGenerator = tokenGenerator;
    }

    /** Manual add by admin (testing / walk-ins). Normal students come from the Python import. */
    @Transactional
    public StudentResponse create(CreateStudentRequest request) {
        String email = request.email().trim().toLowerCase();
        if (studentRepository.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("A student with this email already exists");
        }
        Student s = new Student();
        s.setName(request.name().trim());
        s.setEmail(email);
        s.setRegisterNo(request.registerNo());
        s.setDepartment(request.department());
        s.setStudyYear(request.studyYear());
        s.setPhone(request.phone());
        s.setQrToken(tokenGenerator.newQrToken());
        return toResponse(studentRepository.save(s), null);
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> listAll() {
        Map<Long, Instant> checkIns = attendanceRepository.findAll().stream()
                .collect(Collectors.toMap(a -> a.getStudent().getId(), Attendance::getCheckedInAt,
                        (first, second) -> first));
        return studentRepository.findAllByOrderByNameAsc().stream()
                .map(s -> toResponse(s, checkIns.get(s.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public StudentResponse me(AuthUser authUser) {
        Student student = getCurrentStudent(authUser);
        Instant checkedInAt = attendanceRepository.findByStudent_Id(student.getId())
                .map(Attendance::getCheckedInAt)
                .orElse(null);
        return toResponse(student, checkedInAt);
    }

    /** The Student row belonging to the logged-in STUDENT account. Used by other services too. */
    public Student getCurrentStudent(AuthUser authUser) {
        return studentRepository.findByUser_Id(authUser.id())
                .orElseThrow(() -> ApiException.notFound("No student profile linked to this account"));
    }

    public StudentResponse toResponse(Student s, Instant checkedInAt) {
        return new StudentResponse(s.getId(), s.getName(), s.getEmail(), s.getRegisterNo(),
                s.getDepartment(), s.getStudyYear(), s.getPhone(), s.getQrToken(),
                checkedInAt != null, checkedInAt);
    }
}
