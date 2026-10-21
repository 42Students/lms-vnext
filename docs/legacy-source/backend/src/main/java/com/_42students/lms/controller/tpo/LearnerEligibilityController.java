package com._42students.lms.controller.tpo;

import com._42students.lms.model.Learner;
import com._42students.lms.model.tpo.CollegePlacementRules;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.EligibilityService;
import com._42students.lms.service.tpo.PlacementRulesService;
import com._42students.lms.service.tpo.TpoSettingsService;
import com._42students.lms.service.tpo.StudentCalendarService;
import com._42students.lms.service.tpo.TpoShareService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** The per-rule eligibility checklist a student sees on a drive's detail page. */
@RestController
@RequestMapping("/api/v1/learner/drives")
public class LearnerEligibilityController {

    private final EligibilityService eligibilityService;
    private final JobRepository jobRepository;
    private final LearnerRepository learnerRepository;
    private final TpoSettingsService settingsService;
    private final PlacementRulesService placementRulesService;
    private final SecurityContextUtil securityContextUtil;
    private final com._42students.lms.service.tpo.TpoAccessGuard guard;
    private final TpoShareService shareService;
    private final StudentCalendarService studentCalendarService;

    @org.springframework.beans.factory.annotation.Autowired
    private com._42students.lms.service.tpo.ApplyGate applyGate;

    public LearnerEligibilityController(EligibilityService eligibilityService, JobRepository jobRepository,
                                         LearnerRepository learnerRepository, TpoSettingsService settingsService,
                                         PlacementRulesService placementRulesService,
                                         SecurityContextUtil securityContextUtil,
                                         com._42students.lms.service.tpo.TpoAccessGuard guard,
                                         TpoShareService shareService,
                                         StudentCalendarService studentCalendarService) {
        this.guard = guard;
        this.eligibilityService = eligibilityService;
        this.jobRepository = jobRepository;
        this.learnerRepository = learnerRepository;
        this.settingsService = settingsService;
        this.placementRulesService = placementRulesService;
        this.securityContextUtil = securityContextUtil;
        this.shareService = shareService;
        this.studentCalendarService = studentCalendarService;
    }

    @GetMapping("/{jobId}/eligibility")
    public ResponseEntity<EligibilityService.EligibilityResult> eligibility(@PathVariable Integer jobId) {
        UserPrincipal p = securityContextUtil.getAuthenticatedUserPrincipal();
        guard.requireJobVisibleToLearner(p, jobId);
        com._42students.lms.model.Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Drive not found"));
        Learner learner = learnerRepository.findById(p.getId()).orElseThrow(() -> new IllegalArgumentException("Not found"));
        return ResponseEntity.ok(eligibilityService.evaluate(job, p.getId(), learner.getDepartment()));
    }

    /** Whether the student can apply here, and if not, why and what to do (the same gate as applying itself). */
    @GetMapping("/{jobId}/apply-check")
    public ResponseEntity<Map<String, Object>> applyCheck(@PathVariable Integer jobId) {
        UserPrincipal p = securityContextUtil.getAuthenticatedUserPrincipal();
        guard.requireJobVisibleToLearner(p, jobId);
        com._42students.lms.model.Job job = jobRepository.findById(jobId).orElseThrow(() -> new IllegalArgumentException("Drive not found"));
        Learner learner = learnerRepository.findById(p.getId()).orElseThrow(() -> new IllegalArgumentException("Not found"));
        return ResponseEntity.ok(applyGate.check(job, learner).toMap());
    }

    /**
     * The same gate for many drives at once (the Drives list and Home): a placed student was told "6 open jobs available to apply"
     * while the college's held-offer rule kept them out of most of them (student audit, 14 Oct 2026). Up to 100 drive ids; a drive
     * the student cannot see is left out.
     */
    @GetMapping("/apply-checks")
    public ResponseEntity<Map<String, Object>> applyChecks(@RequestParam("ids") List<Integer> ids) {
        UserPrincipal p = securityContextUtil.getAuthenticatedUserPrincipal();
        if (p == null || !p.isLearner()) throw new org.springframework.security.access.AccessDeniedException("Only students apply to drives");
        Learner learner = learnerRepository.findById(p.getId()).orElseThrow(() -> new IllegalArgumentException("Not found"));
        Map<String, Object> out = new LinkedHashMap<>();
        for (Integer id : new java.util.LinkedHashSet<>(ids == null ? List.<Integer>of() : ids)) {
            if (id == null || out.size() >= 100) continue;
            try {
                guard.requireJobVisibleToLearner(p, id);
            } catch (IllegalArgumentException hidden) {
                continue;
            }
            jobRepository.findById(id).ifPresent(job -> out.put(String.valueOf(id), applyGate.check(job, learner).toMap()));
        }
        return ResponseEntity.ok(out);
    }

    /**
     * Student V1 §"Placement rules page": the college's rules in the TPO's own sentences with
     * real numbers, plus a personal line when the student holds an offer. Linked from the
     * registration card, every eligibility checklist, and every offer.
     */
    @GetMapping("/placement-rules")
    public ResponseEntity<?> placementRules() {
        UserPrincipal p = securityContextUtil.getAuthenticatedUserPrincipal();
        // The student's own batch's rules: the numbers came from the college's while the sentence came from the batch's, so a
        // batch with its own rules read two different answers on one page.
        CollegePlacementRules rules = placementRulesService.rulesForLearner(p.getId(), p.getCollegeId());
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("countsAsPlacedAt", rules.getCountsAsPlacedAt());
        out.put("maxHeldOffers", rules.getMaxHeldOffers());
        out.put("upliftPct", rules.getUpliftPct());
        out.put("minResponseHours", rules.getMinResponseHours());
        out.put("summary", placementRulesService.summarySentenceFor(p.getId(), p.getCollegeId()));
        out.put("personalNote", placementRulesService.personalNote(p.getId(), p.getCollegeId()));
        out.put("points", placementRulesService.studentPoints(rules));
        return ResponseEntity.ok(out);
    }

    /**
     * Student V1 §7 "See what companies see": exactly what a company sharing link would show for
     * this student on this drive — same column bands/toggles as the college's "What companies see"
     * settings, same retention rules ({@link TpoShareService#rowsFor}), so there is only one place
     * this logic lives. Readiness scores, debarments and no-show marks are never part of that
     * shared-column set at all, so this preview can never leak them by construction.
     */
    @GetMapping("/{jobId}/company-preview")
    public ResponseEntity<?> companyPreview(@PathVariable Integer jobId) {
        UserPrincipal p = securityContextUtil.getAuthenticatedUserPrincipal();
        guard.requireJobVisibleToLearner(p, jobId);
        List<Map<String, Object>> rows = shareService.rowsFor(jobId, p.getCollegeId(), TpoShareService.ALL_COLUMNS, null, p.getId());
        if (rows.isEmpty()) throw new IllegalArgumentException("Apply to this drive to see this preview");
        return ResponseEntity.ok(Map.of("preview", rows.get(0), "columns", TpoShareService.ALL_COLUMNS));
    }

    /**
     * Student V1 §8 Calendar: talks (pre-placement info sessions) and the college's blocked exam
     * dates — the two pieces the existing career calendar (interviews/deadlines, served
     * elsewhere) never carried. Both reuse existing TPO-facing data read-only
     * ({@link StudentCalendarService}), scoped to what this student may see.
     */
    @GetMapping("/calendar-extras")
    public ResponseEntity<?> calendarExtras(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        UserPrincipal p = securityContextUtil.getAuthenticatedUserPrincipal();
        if (start == null || end == null || start.isAfter(end)) {
            throw new IllegalArgumentException("start and end are required, and start must not be after end");
        }
        return ResponseEntity.ok(studentCalendarService.extras(p.getId(), start, end));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<java.util.Map<String, String>> handleNotFound(IllegalArgumentException e) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body(java.util.Map.of("error", e.getMessage()));
    }
}
