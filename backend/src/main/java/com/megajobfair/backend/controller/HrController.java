package com.megajobfair.backend.controller;

import com.megajobfair.backend.dto.HrDecisionRequest;
import com.megajobfair.backend.dto.QueueActionResponse;
import com.megajobfair.backend.dto.QueueItem;
import com.megajobfair.backend.security.AuthUser;
import com.megajobfair.backend.service.HrService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** HR panel. Requires role HR (see SecurityConfig). */
@RestController
@RequestMapping("/api/hr")
public class HrController {

    private final HrService hrService;

    public HrController(HrService hrService) {
        this.hrService = hrService;
    }

    /** Search the company's queue by student name. Example: /api/hr/search?name=ravi */
    @GetMapping("/search")
    public List<QueueItem> search(@RequestParam(defaultValue = "") String name,
                                  @AuthenticationPrincipal AuthUser user) {
        return hrService.search(name, user);
    }

    @PostMapping("/{registrationId}/in-interview")
    public QueueActionResponse inInterview(@PathVariable Long registrationId,
                                           @AuthenticationPrincipal AuthUser user) {
        return hrService.inInterview(registrationId, user);
    }

    /** Body: { "decision": "SELECTED" } or { "decision": "REJECTED" } */
    @PostMapping("/{registrationId}/decision")
    public QueueActionResponse decide(@PathVariable Long registrationId,
                                      @Valid @RequestBody HrDecisionRequest request,
                                      @AuthenticationPrincipal AuthUser user) {
        return hrService.decide(registrationId, request, user);
    }
}