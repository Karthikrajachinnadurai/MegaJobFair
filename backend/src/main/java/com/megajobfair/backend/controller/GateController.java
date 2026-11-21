package com.megajobfair.backend.controller;

import com.megajobfair.backend.dto.GateScanRequest;
import com.megajobfair.backend.dto.GateScanResponse;
import com.megajobfair.backend.security.AuthUser;
import com.megajobfair.backend.service.GateService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Requires role GATE_VOLUNTEER or ADMIN. */
@RestController
@RequestMapping("/api/gate")
public class GateController {

    private final GateService gateService;

    public GateController(GateService gateService) {
        this.gateService = gateService;
    }

    @PostMapping("/scan")
    public GateScanResponse scan(@Valid @RequestBody GateScanRequest request,
                                 @AuthenticationPrincipal AuthUser scanner) {
        return gateService.scan(request, scanner);
    }
}
