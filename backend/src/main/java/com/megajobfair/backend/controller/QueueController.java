package com.megajobfair.backend.controller;

import com.megajobfair.backend.dto.QueueScanRequest;
import com.megajobfair.backend.dto.QueueScanResponse;
import com.megajobfair.backend.dto.QueueSummaryResponse;
import com.megajobfair.backend.security.AuthUser;
import com.megajobfair.backend.service.QueueService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Company side of the queue. Requires role COMPANY_VOLUNTEER or HR (see SecurityConfig). */
@RestController
@RequestMapping("/api/queue")
public class QueueController {

    private final QueueService queueService;

    public QueueController(QueueService queueService) {
        this.queueService = queueService;
    }

    /** Scan a student's company QR and add them to this company's waiting list. */
    @PostMapping("/scan")
    public QueueScanResponse scan(@Valid @RequestBody QueueScanRequest request,
                                  @AuthenticationPrincipal AuthUser user) {
        return queueService.scan(request, user);
    }

    /** Live counts and waiting list. The company screen polls this every few seconds. */
    @GetMapping("/{companyId}/summary")
    public QueueSummaryResponse summary(@PathVariable Long companyId,
                                        @AuthenticationPrincipal AuthUser user) {
        return queueService.summary(companyId, user);
    }
}