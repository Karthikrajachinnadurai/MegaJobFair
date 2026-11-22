package com.megajobfair.backend.service;

import com.megajobfair.backend.dto.HrDecisionRequest;
import com.megajobfair.backend.dto.QueueActionResponse;
import com.megajobfair.backend.dto.QueueItem;
import com.megajobfair.backend.entity.Registration;
import com.megajobfair.backend.enums.QueueState;
import com.megajobfair.backend.enums.RegistrationStatus;
import com.megajobfair.backend.exception.ApiException;
import com.megajobfair.backend.repository.QueueEntryRepository;
import com.megajobfair.backend.repository.RegistrationRepository;
import com.megajobfair.backend.security.AuthUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Module 2: HR panel (search, in-interview, select / reject). */
@Service
public class HrService {

    private final RegistrationRepository registrationRepository;
    private final QueueEntryRepository queueEntryRepository;
    private final RegistrationService registrationService;
    private final QueueService queueService;

    public HrService(RegistrationRepository registrationRepository,
                     QueueEntryRepository queueEntryRepository,
                     RegistrationService registrationService,
                     QueueService queueService) {
        this.registrationRepository = registrationRepository;
        this.queueEntryRepository = queueEntryRepository;
        this.registrationService = registrationService;
        this.queueService = queueService;
    }

    /** Students in HR's company queue (waiting or in interview) whose name contains the text. Blank = all. */
    @Transactional(readOnly = true)
    public List<QueueItem> search(String name, AuthUser hr) {
        String text = name == null ? "" : name.trim();
        return queueEntryRepository
                .findByCompany_IdAndStateAndStudent_NameContainingIgnoreCaseOrderByJoinedAtAsc(
                        hr.companyId(), QueueState.ACTIVE, text)
                .stream()
                .map(e -> queueService.toItem(e, null))
                .toList();
    }

    /** WAITING -> IN_INTERVIEW. The queue entry stays ACTIVE, so the student cannot join another queue. */
    @Transactional
    public QueueActionResponse inInterview(Long registrationId, AuthUser hr) {
        Registration registration = ownRegistration(registrationId, hr);
        registrationService.changeStatus(registration, RegistrationStatus.IN_INTERVIEW);
        return queueService.toActionResponse(registration);
    }

    /** IN_INTERVIEW -> SELECTED / REJECTED, then the queue visit is closed and the student is free again. */
    @Transactional
    public QueueActionResponse decide(Long registrationId, HrDecisionRequest request, AuthUser hr) {
        RegistrationStatus decision = request.decision();
        if (decision != RegistrationStatus.SELECTED && decision != RegistrationStatus.REJECTED) {
            throw ApiException.badRequest("Decision must be SELECTED or REJECTED");
        }
        Registration registration = ownRegistration(registrationId, hr);

        // changeStatus throws 409 unless the student is IN_INTERVIEW: Select/Reject is enforced here, not just in the UI
        registrationService.changeStatus(registration, decision);

        queueEntryRepository.findByRegistration_IdAndState(registrationId, QueueState.ACTIVE)
                .ifPresent(entry -> entry.close(QueueState.DONE));

        return queueService.toActionResponse(registration);
    }

    /** Loads a registration and makes sure it belongs to this HR's company. */
    private Registration ownRegistration(Long registrationId, AuthUser hr) {
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> ApiException.notFound("Registration not found"));
        if (!registration.getCompany().getId().equals(hr.companyId())) {
            throw ApiException.forbidden("This student is not registered for your company");
        }
        return registration;
    }
}