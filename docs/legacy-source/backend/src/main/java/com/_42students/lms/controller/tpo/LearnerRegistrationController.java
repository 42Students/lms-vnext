package com._42students.lms.controller.tpo;

import com._42students.lms.model.tpo.PlacementRegistration;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.TpoSeasonService;
import com._42students.lms.service.tpo.TpoStudentService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** The student's own registration card: Placements / Higher studies / Not interested. */
@RestController
@RequestMapping("/api/v1/learner/registration")
public class LearnerRegistrationController {

    private final TpoStudentService studentService;
    private final TpoSeasonService seasonService;
    private final SecurityContextUtil securityContextUtil;
    private final com._42students.lms.service.tpo.BatchRegistrationService batchRegistration;

    public LearnerRegistrationController(TpoStudentService studentService, TpoSeasonService seasonService,
                                          SecurityContextUtil securityContextUtil, com._42students.lms.service.tpo.BatchRegistrationService batchRegistration) {
        this.studentService = studentService;
        this.seasonService = seasonService;
        this.securityContextUtil = securityContextUtil;
        this.batchRegistration = batchRegistration;
    }

    private UserPrincipal principal() {
        return securityContextUtil.getAuthenticatedUserPrincipal();
    }

    @GetMapping
    public ResponseEntity<PlacementRegistration> mine() {
        UserPrincipal p = principal();
        Long seasonId = seasonService.current(p.getCollegeId()).getId();
        return studentService.registration(p.getId(), seasonId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping
    public ResponseEntity<PlacementRegistration> register(@RequestParam String choice, @RequestParam(defaultValue = "false") boolean consent) {
        UserPrincipal p = principal();
        // The same rules as the placements page (LearnerPlacementService.register): the student's three choices, and agreeing to
        // share details before registering for placements. This older endpoint took any choice and no consent.
        if (!java.util.Set.of("PLACEMENTS", "HIGHER_STUDIES", "NOT_INTERESTED").contains(choice)) return ResponseEntity.badRequest().build();
        if ("PLACEMENTS".equals(choice) && !consent) return ResponseEntity.badRequest().build();
        // Registration is open only in the student's batch window (invited, before the deadline, batch not finished).
        if (!batchRegistration.windowFor(p.getId()).open) return ResponseEntity.status(org.springframework.http.HttpStatus.CONFLICT).build();
        Long seasonId = seasonService.current(p.getCollegeId()).getId();
        return ResponseEntity.ok(studentService.register(p.getId(), seasonId, choice, "SELF"));
    }
}
