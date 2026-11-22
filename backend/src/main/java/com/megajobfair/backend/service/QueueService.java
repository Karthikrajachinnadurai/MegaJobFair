package com.megajobfair.backend.service;

import com.megajobfair.backend.dto.QueueActionResponse;
import com.megajobfair.backend.dto.QueueItem;
import com.megajobfair.backend.dto.QueueScanRequest;
import com.megajobfair.backend.dto.QueueScanResponse;
import com.megajobfair.backend.dto.QueueSummaryResponse;
import com.megajobfair.backend.entity.Company;
import com.megajobfair.backend.entity.QueueEntry;
import com.megajobfair.backend.entity.Registration;
import com.megajobfair.backend.entity.Student;
import com.megajobfair.backend.enums.QueueState;
import com.megajobfair.backend.enums.RegistrationStatus;
import com.megajobfair.backend.exception.ApiException;
import com.megajobfair.backend.repository.CompanyRepository;
import com.megajobfair.backend.repository.QueueEntryRepository;
import com.megajobfair.backend.repository.RegistrationRepository;
import com.megajobfair.backend.repository.UserRepository;
import com.megajobfair.backend.security.AuthUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** Module 2: company waiting lists (scan, drop, live summary). */
@Service
public class QueueService {

    private final RegistrationRepository registrationRepository;
    private final QueueEntryRepository queueEntryRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final RegistrationService registrationService;
    private final StudentService studentService;

    public QueueService(RegistrationRepository registrationRepository,
                        QueueEntryRepository queueEntryRepository,
                        CompanyRepository companyRepository,
                        UserRepository userRepository,
                        RegistrationService registrationService,
                        StudentService studentService) {
        this.registrationRepository = registrationRepository;
        this.queueEntryRepository = queueEntryRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.registrationService = registrationService;
        this.studentService = studentService;
    }

    /**
     * Company volunteer scans a student's company QR to add them to this company's waiting list.
     * Everything runs in one transaction: if any check fails, nothing is saved.
     */
    @Transactional
    public QueueScanResponse scan(QueueScanRequest request, AuthUser scanner) {
        // 1. The QR must belong to a real registration
        Registration registration = registrationRepository.findByCompanyQrToken(request.qrToken().trim())
                .orElseThrow(() -> ApiException.notFound("Invalid QR code: no registration found"));

        // 2. A volunteer can only add students to their OWN company's queue
        Long companyId = registration.getCompany().getId();
        if (!companyId.equals(scanner.companyId())) {
            throw ApiException.forbidden("This QR is for " + registration.getCompany().getName()
                    + ", not your company");
        }

        Student student = registration.getStudent();

        // 3. Scanned twice? Already waiting here: report it, change nothing
        if (registration.getStatus() == RegistrationStatus.WAITING) {
            QueueEntry existing = queueEntryRepository
                    .findByRegistration_IdAndState(registration.getId(), QueueState.ACTIVE)
                    .orElse(null);
            return toScanResponse(registration, true, existing != null ? existing.getJoinedAt() : null);
        }

        // 4. Only a REGISTERED student can join (not one in interview or already selected/rejected)
        if (registration.getStatus() != RegistrationStatus.REGISTERED) {
            throw ApiException.conflict(student.getName() + " is already " + registration.getStatus()
                    + " at this company");
        }

        // 5. One queue at a time: are they active anywhere else?
        Optional<QueueEntry> elsewhere =
                queueEntryRepository.findByStudent_IdAndState(student.getId(), QueueState.ACTIVE);
        if (elsewhere.isPresent()) {
            throw ApiException.conflict(student.getName() + " is in " + elsewhere.get().getCompany().getName()
                    + "'s queue. Ask them to drop that queue in their login, then scan again.");
        }

        // 6. All checks passed: move to WAITING and create the queue entry
        registrationService.changeStatus(registration, RegistrationStatus.WAITING);

        QueueEntry entry = new QueueEntry();
        entry.setRegistration(registration);
        entry.setStudent(student);
        entry.setCompany(registration.getCompany());
        entry.setScannedBy(userRepository.getReferenceById(scanner.id()));
        // flush now so the "one ACTIVE entry per student" index catches a simultaneous scan here
        entry = queueEntryRepository.saveAndFlush(entry);

        return toScanResponse(registration, false, entry.getJoinedAt());
    }

    /**
     * Student leaves a company's waiting list from their own login, so they can join another queue.
     * The student always comes from the token, never from the URL.
     */
    @Transactional
    public QueueActionResponse drop(Long companyId, AuthUser authUser) {
        Student student = studentService.getCurrentStudent(authUser);

        QueueEntry entry = queueEntryRepository
                .findByStudent_IdAndCompany_IdAndState(student.getId(), companyId, QueueState.ACTIVE)
                .orElseThrow(() -> ApiException.notFound("You are not in this company's queue"));

        Registration registration = entry.getRegistration();
        if (registration.getStatus() == RegistrationStatus.IN_INTERVIEW) {
            throw ApiException.conflict("You are in an interview with this company and cannot drop the queue now");
        }

        // WAITING -> REGISTERED (allowed by RegistrationStatus.allowedNext), then close the visit
        registrationService.changeStatus(registration, RegistrationStatus.REGISTERED);
        entry.close(QueueState.DROPPED);

        return toActionResponse(registration);
    }

    /** Live counts and lists for one company. Company staff can only see their own company. */
    @Transactional(readOnly = true)
    public QueueSummaryResponse summary(Long companyId, AuthUser user) {
        if (!companyId.equals(user.companyId())) {
            throw ApiException.forbidden("You can only view your own company's queue");
        }
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> ApiException.notFound("Company not found"));

        List<QueueItem> waitingList = new ArrayList<>();
        List<QueueItem> inInterviewList = new ArrayList<>();
        for (QueueEntry e : queueEntryRepository.findByCompany_IdAndStateOrderByJoinedAtAsc(companyId, QueueState.ACTIVE)) {
            if (e.getRegistration().getStatus() == RegistrationStatus.IN_INTERVIEW) {
                inInterviewList.add(toItem(e, null));
            } else {
                waitingList.add(toItem(e, waitingList.size() + 1));
            }
        }

        return new QueueSummaryResponse(company.getId(), company.getName(),
                count(companyId, RegistrationStatus.REGISTERED),
                count(companyId, RegistrationStatus.WAITING),
                count(companyId, RegistrationStatus.IN_INTERVIEW),
                count(companyId, RegistrationStatus.SELECTED),
                count(companyId, RegistrationStatus.REJECTED),
                waitingList, inInterviewList);
    }

    // ---------- helpers (also used by HrService) ----------

    public QueueItem toItem(QueueEntry e, Integer position) {
        Student s = e.getStudent();
        Registration r = e.getRegistration();
        return new QueueItem(position, r.getId(), s.getId(), s.getName(), s.getRegisterNo(), s.getDepartment(),
                r.getStatus(), e.getJoinedAt());
    }

    public QueueActionResponse toActionResponse(Registration r) {
        Company c = r.getCompany();
        Student s = r.getStudent();
        return new QueueActionResponse(r.getId(), s.getId(), s.getName(), c.getId(), c.getName(),
                r.getStatus(), count(c.getId(), RegistrationStatus.WAITING));
    }

    private long count(Long companyId, RegistrationStatus status) {
        return registrationRepository.countByCompany_IdAndStatus(companyId, status);
    }

    private QueueScanResponse toScanResponse(Registration r, boolean alreadyInQueue, Instant joinedAt) {
        Student s = r.getStudent();
        return new QueueScanResponse(r.getId(), s.getId(), s.getName(), s.getRegisterNo(), s.getDepartment(),
                r.getCompany().getName(), r.getStatus(), alreadyInQueue, joinedAt,
                count(r.getCompany().getId(), RegistrationStatus.WAITING));
    }
}