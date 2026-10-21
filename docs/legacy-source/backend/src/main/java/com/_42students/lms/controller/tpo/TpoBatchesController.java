package com._42students.lms.controller.tpo;

import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.PlacementEligibilityService;
import com._42students.lms.service.tpo.PlacementRulesService;
import com._42students.lms.service.tpo.TpoWorkspaceService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Batches and eligibility for the placement cell and the college admin (docs/tpo-ux/BATCHES-AND-ELIGIBILITY-DESIGN.md).
 * Under /api/v1/tpo, so the placement team filter already limits it to TPO admins.
 */
@RestController
@RequestMapping("/api/v1/tpo")
@RequiredArgsConstructor
public class TpoBatchesController {

    private final PlacementEligibilityService eligibility;
    private final PlacementRulesService rules;
    private final com._42students.lms.service.tpo.BatchRegistrationService registration;
    private final SecurityContextUtil securityContextUtil;
    private final com._42students.lms.service.tpo.JobTypeService jobTypeService;

    private UserPrincipal p() { return securityContextUtil.getAuthenticatedUserPrincipal(); }

    private Integer college() {
        Integer c = p() == null ? null : p().getCollegeId();
        if (c == null) throw new IllegalArgumentException("Choose a college");
        return c;
    }

    private String placed(Integer collegeId) { return TpoWorkspaceService.placedOfferStatuses(rules.rulesFor(collegeId).getCountsAsPlacedAt()); }

    @GetMapping("/batches")
    public Map<String, Object> batches() { Integer c = college(); return eligibility.overview(c, placed(c)); }

    @GetMapping("/batches/{batchId}")
    public Map<String, Object> batch(@PathVariable Long batchId) {
        Integer c = college();
        return eligibility.batch(c, batchId, placed(c));
    }

    @GetMapping("/batches/{batchId}/students")
    public List<Map<String, Object>> batchStudents(@PathVariable Long batchId) {
        Integer c = college();
        return eligibility.batchStudents(c, batchId, TpoWorkspaceService.placedOfferStatuses(rules.rulesForBatch(c, batchId).getCountsAsPlacedAt()));
    }

    /** The college's rules, this batch's own changes, and what applies to its students. */
    @GetMapping("/batches/{batchId}/rules")
    public Map<String, Object> batchRules(@PathVariable Long batchId) {
        Integer c = college();
        eligibility.batch(c, batchId, placed(c)); // 404 for a batch of another college
        return batchRulesView(c, batchId);
    }

    /** Body: the batch's own values for any of countsAsPlacedAt, maxHeldOffers, upliftPct, minResponseHours; {} = follow the college. */
    @PutMapping("/batches/{batchId}/rules")
    public Map<String, Object> saveBatchRules(@PathVariable Long batchId, @RequestBody Map<String, Object> body) {
        Integer c = college();
        eligibility.saveBatchRules(p(), c, batchId, body);
        return batchRulesView(c, batchId);
    }

    private Map<String, Object> batchRulesView(Integer c, Long batchId) {
        com._42students.lms.model.tpo.CollegePlacementRules base = rules.rulesFor(c);
        com._42students.lms.model.tpo.CollegePlacementRules eff = rules.rulesForBatch(c, batchId);
        Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("college", Map.of("countsAsPlacedAt", base.getCountsAsPlacedAt(), "maxHeldOffers", base.getMaxHeldOffers(), "upliftPct", base.getUpliftPct(), "minResponseHours", base.getMinResponseHours()));
        out.put("batch", rules.batchOverride(batchId));
        out.put("effective", Map.of("countsAsPlacedAt", eff.getCountsAsPlacedAt(), "maxHeldOffers", eff.getMaxHeldOffers(), "upliftPct", eff.getUpliftPct(), "minResponseHours", eff.getMinResponseHours()));
        // The college's job types (Settings > Job types), each with whether its offers count as placed: it used to be the five
        // built-in names only, missing the college's own types and the answer that matters here.
        out.put("jobTypes", jobTypeService.visible(c).stream().map(t -> Map.of("name", t.name(), "countsAsPlaced", t.countsAsPlaced())).toList());
        return out;
    }

    public static class BatchUpdate {
        public LocalDateTime registrationDeadline;
        public boolean setDeadline;
        public Boolean finished;
    }

    @PutMapping("/batches/{batchId}")
    public Map<String, Object> updateBatch(@PathVariable Long batchId, @RequestBody BatchUpdate body) {
        Integer c = college();
        eligibility.updateBatch(c, batchId, body.registrationDeadline, body.finished, body.setDeadline);
        return eligibility.batch(c, batchId, placed(c));
    }

    public static class InviteRequest { public LocalDateTime deadline; }

    /** Invite the batch's eligible students to register by the deadline (also moves the deadline). */
    @PostMapping("/batches/{batchId}/invite")
    public Map<String, Object> invite(@PathVariable Long batchId, @RequestBody InviteRequest body) {
        Integer c = college();
        Map<String, Object> out = new java.util.LinkedHashMap<>(registration.invite(p(), c, batchId, body == null ? null : body.deadline));
        out.put("batch", eligibility.batch(c, batchId, placed(c)));
        return out;
    }

    /** Remind the eligible students who have not chosen yet. */
    @PostMapping("/batches/{batchId}/remind")
    public Map<String, Object> remind(@PathVariable Long batchId) {
        return registration.remind(p(), college(), batchId);
    }

    public static class DecideRequest { public List<PlacementEligibilityService.Change> changes; }

    @PostMapping("/eligibility")
    public Map<String, Object> decide(@RequestBody DecideRequest body) {
        return eligibility.decide(p(), college(), body == null ? null : body.changes);
    }

    @GetMapping("/eligibility/last-action")
    public Map<String, Object> lastAction() {
        Map<String, Object> a = eligibility.lastAction(college());
        return a == null ? Map.of() : a;
    }

    public static class UndoRequest { public String actionId; }

    @PostMapping("/eligibility/undo")
    public Map<String, Object> undo(@RequestBody UndoRequest body) {
        return eligibility.undo(p(), college(), body == null ? null : body.actionId);
    }

    public static class ImportRequest { public List<Map<String, Object>> rows; }

    @PostMapping("/eligibility/import/preview")
    public Map<String, Object> importPreview(@RequestBody ImportRequest body) {
        return eligibility.importPreview(college(), body == null ? List.of() : body.rows);
    }

    @PostMapping("/eligibility/import")
    public Map<String, Object> importCommit(@RequestBody ImportRequest body) {
        return eligibility.importCommit(p(), college(), body == null ? List.of() : body.rows);
    }
}
