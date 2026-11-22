package com.megajobfair.backend.controller;

import com.megajobfair.backend.dto.QueueActionResponse;
import com.megajobfair.backend.security.AuthUser;
import com.megajobfair.backend.service.QueueService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Student side of the queue. Requires role STUDENT (covered by /api/student/** in SecurityConfig). */
@RestController
@RequestMapping("/api/student/queue")
public class StudentQueueController {

    private final QueueService queueService;

    public StudentQueueController(QueueService queueService) {
        this.queueService = queueService;
    }

    /** Leave this company's waiting list so the student can be scanned into another one. */
    @PostMapping("/{companyId}/drop")
    public QueueActionResponse drop(@PathVariable Long companyId,
                                    @AuthenticationPrincipal AuthUser user) {
        return queueService.drop(companyId, user);
    }
}