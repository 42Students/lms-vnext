package com._42students.lms.controller.tpo;

import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.LearnerPlacementService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** The student's own placement page (Student V1 - Changes). Everything is scoped to the caller; there is no id to guess. */
@RestController
@RequestMapping("/api/v1/learner/placement")
@RequiredArgsConstructor
public class LearnerPlacementController {

    private final LearnerPlacementService service;
    private final com._42students.lms.service.tpo.LearnerJourneyService journeyService;
    private final com._42students.lms.service.tpo.TpoAccessGuard guard;
    private final SecurityContextUtil securityContextUtil;

    private UserPrincipal p() { return securityContextUtil.getAuthenticatedUserPrincipal(); }

    @GetMapping("/overview")
    public Map<String, Object> overview() { return service.overview(p().getId(), p().getCollegeId()); }

    /** Learners only: the caller's id is read as a learner id. */
    private UserPrincipal learner() {
        UserPrincipal p = p();
        if (p == null || !p.isLearner()) throw new org.springframework.security.access.AccessDeniedException("Only students have placements");
        return p;
    }

    /** Every application with its drive's rounds and where the student is in them, their schedule and their offers. */
    @GetMapping("/journey")
    public Map<String, Object> journey() { return journeyService.journey(learner().getId()); }

    /** A drive's selection process (its rounds), for the drive page. */
    @GetMapping("/drives/{jobId}/process")
    public java.util.List<Map<String, Object>> process(@PathVariable Integer jobId) {
        guard.requireJobVisibleToLearner(learner(), jobId);
        return journeyService.process(jobId);
    }

    public static class RegisterRequest { public String choice; public boolean consent; }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody RegisterRequest r) {
        service.register(p().getId(), p().getCollegeId(), r.choice, r.consent);
        return Map.of("ok", true);
    }
}
