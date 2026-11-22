package com.megajobfair.backend.service;

import com.megajobfair.backend.dto.GateScanRequest;
import com.megajobfair.backend.dto.GateScanResponse;
import com.megajobfair.backend.entity.Attendance;
import com.megajobfair.backend.entity.Student;
import com.megajobfair.backend.exception.ApiException;
import com.megajobfair.backend.repository.AttendanceRepository;
import com.megajobfair.backend.repository.StudentRepository;
import com.megajobfair.backend.repository.UserRepository;
import com.megajobfair.backend.security.AuthUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class GateService {

    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final UserAccountService userAccountService;

    public GateService(StudentRepository studentRepository,
                       AttendanceRepository attendanceRepository,
                       UserRepository userRepository,
                       UserAccountService userAccountService) {
        this.studentRepository = studentRepository;
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
        this.userAccountService = userAccountService;
    }

    /**
     * Gate check-in. Idempotent: scanning the same QR twice does not mark attendance twice
     * and does not send a second password email; it just reports the first check-in.
     */
    @Transactional
    public GateScanResponse scan(GateScanRequest request, AuthUser scanner) {
        Student student = studentRepository.findByQrToken(request.qrToken().trim())
                .orElseThrow(() -> ApiException.notFound("Invalid QR code: no student found"));

        Optional<Attendance> existing = attendanceRepository.findByStudent_Id(student.getId());
        if (existing.isPresent()) {
            return toResponse(student, existing.get(), true, false);
        }

        Attendance attendance = new Attendance();
        attendance.setStudent(student);
        attendance.setScannedBy(userRepository.getReferenceById(scanner.id()));
        // flush now so the UNIQUE(student_id) constraint catches a simultaneous double scan here
        attendance = attendanceRepository.saveAndFlush(attendance);

        boolean sent = userAccountService.issueStudentCredentials(student);
        return toResponse(student, attendance, false, sent);
    }

    private GateScanResponse toResponse(Student s, Attendance a, boolean alreadyCheckedIn, boolean sent) {
        return new GateScanResponse(s.getId(), s.getName(), s.getEmail(), s.getRegisterNo(),
                s.getDepartment(), alreadyCheckedIn, a.getCheckedInAt(), sent);
    }
}
