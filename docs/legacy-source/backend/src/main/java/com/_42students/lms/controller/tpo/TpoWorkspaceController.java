package com._42students.lms.controller.tpo;

import com._42students.lms.dto.tpo.RoundForm;
import com._42students.lms.model.Job;
import com._42students.lms.model.tpo.JobRound;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.*;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Everything the Drive page needs beyond the base drive endpoints (TPO V1 - Locked.docx §4-5): the applicant
 * table, the offers list, rounds with counts, the summary, round CRUD, Excel-import preview/commit for results
 * and selections, "offer to next waitlisted", clone, and the publish preview. Every id is checked against the
 * caller's college first; not-found and not-yours answer the same way.
 */
@RestController
@RequestMapping("/api/v1/tpo")
@RequiredArgsConstructor
public class TpoWorkspaceController {

    private final TpoWorkspaceService workspace;
    private final TpoImportService importService;
    private final TpoWaitlistService waitlistService;
    private final TpoDriveExtrasService extras;
    private final TpoAuditService audit;
    private final TpoMessagesService messagesService;
    private final TpoStudentsReadService studentsRead;
    private final TpoTeamThreadService teamThreads;
    private final PlacementAnnouncementService announcements;
    private final TpoAccessGuard guard;
    private final SecurityContextUtil securityContextUtil;

    private UserPrincipal p() { return securityContextUtil.getAuthenticatedUserPrincipal(); }

    // ---------------------------------------------------------------- reads
    @GetMapping("/drives/{jobId}/workspace/applicants")
    public List<Map<String, Object>> applicants(@PathVariable Integer jobId) {
        guard.requireJob(p(), jobId);
        return workspace.applicants(jobId);
    }

    @GetMapping("/drives/{jobId}/workspace/offers")
    public List<Map<String, Object>> offers(@PathVariable Integer jobId) {
        guard.requireJob(p(), jobId);
        return workspace.offers(jobId);
    }

    @GetMapping("/drives/{jobId}/workspace/rounds")
    public List<Map<String, Object>> rounds(@PathVariable Integer jobId) {
        guard.requireJob(p(), jobId);
        return workspace.roundsWithCounts(jobId);
    }

    @GetMapping("/drives/{jobId}/workspace/summary")
    public Map<String, Object> summary(@PathVariable Integer jobId) {
        guard.requireJob(p(), jobId);
        return workspace.summary(jobId, p().getCollegeId());
    }

    @GetMapping("/drives/{jobId}/workspace/activity")
    public List<Map<String, Object>> activity(@PathVariable Integer jobId) {
        guard.requireJob(p(), jobId);
        return audit.list(p().getCollegeId(), "DRIVE", jobId.longValue(), 100);
    }

    /** Applied and offer counts for every drive, for the Drives list. */
    @GetMapping("/drives/counts")
    public List<Map<String, Object>> driveCounts() {
        return extras.listCounts(p().getCollegeId());
    }

    @GetMapping("/drives/{jobId}/eligibility-preview")
    public Map<String, Object> eligibilityPreview(@PathVariable Integer jobId) {
        guard.requireJob(p(), jobId);
        Map<String, Object> out = extras.eligibilityPreview(jobId, p().getCollegeId());
        return out;
    }

    // ---------------------------------------------------------------- rounds
    @PostMapping("/drives/{jobId}/rounds")
    public ResponseEntity<JobRound> createRound(@PathVariable Integer jobId, @RequestBody RoundForm form) {
        guard.requireJobWritable(p(), jobId);
        JobRound r = extras.saveRound(jobId, null, form);
        audit.log(p().getCollegeId(), "TPO", p().getId(), "ROUND_ADDED", "DRIVE", jobId.longValue(), r.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(r);
    }

    @PutMapping("/drives/{jobId}/rounds/{roundId}")
    public JobRound updateRound(@PathVariable Integer jobId, @PathVariable Long roundId, @RequestBody RoundForm form) {
        guard.requireJobWritable(p(), jobId);
        guard.requireRound(p(), roundId);
        JobRound r = extras.saveRound(jobId, roundId, form);
        audit.log(p().getCollegeId(), "TPO", p().getId(), "ROUND_UPDATED", "DRIVE", jobId.longValue(), r.getName());
        return r;
    }

    public static class ReorderRequest { public List<Long> orderedIds; }

    /** Drag to reorder: the full new order of the drive's round ids. */
    @PostMapping("/drives/{jobId}/rounds/reorder")
    public List<JobRound> reorderRounds(@PathVariable Integer jobId, @RequestBody ReorderRequest body) {
        guard.requireJobWritable(p(), jobId);
        List<JobRound> out = extras.reorderRounds(jobId, body.orderedIds);
        audit.log(p().getCollegeId(), "TPO", p().getId(), "ROUNDS_REORDERED", "DRIVE", jobId.longValue(), out.size() + " rounds");
        return out;
    }

    @DeleteMapping("/drives/{jobId}/rounds/{roundId}")
    public ResponseEntity<Void> deleteRound(@PathVariable Integer jobId, @PathVariable Long roundId) {
        guard.requireJobWritable(p(), jobId);
        guard.requireRound(p(), roundId);
        extras.deleteRound(jobId, roundId);
        audit.log(p().getCollegeId(), "TPO", p().getId(), "ROUND_DELETED", "DRIVE", jobId.longValue(), "round " + roundId);
        return ResponseEntity.noContent().build();
    }

    // ---------------------------------------------------------------- imports
    public static class ImportRequest {
        public List<Map<String, Object>> rows;
        public String notInFileAction; // NOT_CLEARED | LEAVE_PENDING
    }

    private Integer jobOfRound(Long roundId) {
        guard.requireRound(p(), roundId);
        return guard.jobIdOfRound(roundId);
    }

    @PostMapping("/rounds/{roundId}/results/import-preview")
    public Map<String, Object> previewResults(@PathVariable Long roundId, @RequestBody ImportRequest req) {
        Integer jobId = jobOfRound(roundId);
        return importService.previewResults(jobId, req.rows == null ? List.of() : req.rows);
    }

    @PostMapping("/rounds/{roundId}/results/import")
    public Map<String, Object> importResults(@PathVariable Long roundId, @RequestBody ImportRequest req) {
        Integer jobId = jobOfRound(roundId);
        Map<String, Object> out = importService.commitResults(jobId, roundId, req.rows == null ? List.of() : req.rows,
                req.notInFileAction, p().getId());
        audit.log(p().getCollegeId(), "TPO", p().getId(), "RESULTS_IMPORTED", "DRIVE", jobId.longValue(), out.toString());
        return out;
    }

    @PostMapping("/drives/{jobId}/offers/import-preview")
    public Map<String, Object> previewSelections(@PathVariable Integer jobId, @RequestBody ImportRequest req) {
        guard.requireJobWritable(p(), jobId);
        return importService.previewSelections(jobId, req.rows == null ? List.of() : req.rows);
    }

    @PostMapping("/drives/{jobId}/offers/import")
    public Map<String, Object> importSelections(@PathVariable Integer jobId, @RequestBody ImportRequest req) {
        guard.requireJobWritable(p(), jobId);
        int n = importService.commitSelections(jobId, req.rows == null ? List.of() : req.rows, p().getId());
        audit.log(p().getCollegeId(), "TPO", p().getId(), "SELECTIONS_IMPORTED", "DRIVE", jobId.longValue(), n + " selections");
        return Map.of("recorded", n);
    }

    // ---------------------------------------------------------------- offers, drives
    /** Placements UX pass, "Waitlist Promotion Preview": who offer-next would actually pick, and why
     * anyone ahead of them on the ranked waitlist would be skipped - read only, before committing. */
    @GetMapping("/offers/{offerId}/offer-next-preview")
    public Map<String, Object> offerNextPreview(@PathVariable Long offerId) {
        guard.requireOffer(p(), offerId);
        return waitlistService.previewOfferToNext(offerId);
    }

    @PostMapping("/offers/{offerId}/offer-next")
    public Map<String, Object> offerNext(@PathVariable Long offerId) {
        guard.requireOfferWritable(p(), offerId);
        Map<String, Object> out = waitlistService.offerToNext(offerId, p().getId());
        audit.log(p().getCollegeId(), "TPO", p().getId(), "OFFER_TO_NEXT_WAITLISTED", "OFFER", offerId, out.toString());
        return out;
    }

    @PostMapping("/drives/{jobId}/clone")
    public ResponseEntity<java.util.Map<String, Object>> clone(@PathVariable Integer jobId) {
        // Copying only reads the old drive: a past drive is the very thing people clone, so it needs no write access.
        guard.requireJob(p(), jobId);
        var result = extras.cloneDrive(jobId, p().getOrganizationId(), p().getCollegeId(), p().getId());
        Job job = result.job();
        audit.log(p().getCollegeId(), "TPO", p().getId(), "DRIVE_CLONED", "DRIVE", (long) job.getId(), "Copied from " + result.sourceName() + " (drive " + jobId + ")");
        // What the drive form tells the TPO about the copy: where it came from and what was left behind on purpose.
        java.util.Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("id", job.getId());
        out.put("lifecycleStatus", job.getLifecycleStatus());
        out.put("sourceId", jobId);
        out.put("sourceName", result.sourceName());
        out.put("droppedBatches", result.droppedBatches());
        out.put("droppedPassingYears", result.droppedPassingYears());
        out.put("wasRecordedOutside", result.wasRecordedOutside());
        out.put("wasFromRecruiter", result.wasFromRecruiter());
        return ResponseEntity.status(HttpStatus.CREATED).body(out);
    }

    @PostMapping("/drives/{jobId}/approve-and-publish")
    public Job approveAndPublish(@PathVariable Integer jobId) {
        guard.requireJobWritable(p(), jobId);
        Job job = extras.approveAndPublish(jobId, p().getId());
        audit.log(p().getCollegeId(), "TPO", p().getId(), "DRIVE_APPROVED_AND_PUBLISHED", "DRIVE", jobId.longValue(), null);
        return job;
    }

    public static class OverrideRequest { public Integer learnerId; public String type; public String reason; }

    /** Include or exclude one named student on a drive, with a reason (logged). */
    @PostMapping("/drives/{jobId}/overrides")
    public Map<String, Object> setOverride(@PathVariable Integer jobId, @RequestBody OverrideRequest r) {
        guard.requireJobWritable(p(), jobId);
        guard.requireLearner(p(), r.learnerId);
        extras.setOverride(jobId, r.learnerId, r.type, r.reason, p().getId());
        audit.log(p().getCollegeId(), "TPO", p().getId(), "ELIGIBILITY_" + r.type, "DRIVE", jobId.longValue(), "learner " + r.learnerId + ": " + r.reason);
        return Map.of("ok", true);
    }

    @DeleteMapping("/drives/{jobId}/overrides/{learnerId}")
    public Map<String, Object> removeOverride(@PathVariable Integer jobId, @PathVariable Integer learnerId) {
        guard.requireJobWritable(p(), jobId);
        guard.requireLearner(p(), learnerId);
        extras.removeOverride(jobId, learnerId);
        audit.log(p().getCollegeId(), "TPO", p().getId(), "ELIGIBILITY_OVERRIDE_REMOVED", "DRIVE", jobId.longValue(), "learner " + learnerId);
        return Map.of("ok", true);
    }

    /** Per drive: apply this company's results automatically. Off by default; pass lists only, it never marks missing rows. */
    @PostMapping("/drives/{jobId}/auto-apply")
    public Map<String, Object> autoApply(@PathVariable Integer jobId, @RequestBody Map<String, Boolean> body) {
        guard.requireJobWritable(p(), jobId);
        boolean enabled = Boolean.TRUE.equals(body.get("enabled"));
        extras.setAutoApply(jobId, enabled);
        audit.log(p().getCollegeId(), "TPO", p().getId(), enabled ? "AUTO_APPLY_ON" : "AUTO_APPLY_OFF", "DRIVE", jobId.longValue(), null);
        return Map.of("enabled", enabled);
    }

    // ---------------------------------------------------------------- audit + bell
    @GetMapping("/audit")
    public org.springframework.http.ResponseEntity<List<Map<String, Object>>> auditLog(@RequestParam(required = false) String entityType,
                                              @RequestParam(required = false) Long entityId,
                                              @RequestParam(defaultValue = "200") int limit,
                                              @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate from,
                                              @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate to) {
        List<Map<String, Object>> rows = audit.list(p().getCollegeId(), entityType, entityId, limit, from, to);
        // BE-0034: the body stays the list; headers say how many events match, so a cut list (and its export) is labelled.
        org.springframework.http.ResponseEntity.BodyBuilder ok = org.springframework.http.ResponseEntity.ok();
        if (from != null || to != null) {
            long total = audit.count(p().getCollegeId(), entityType, entityId, from, to);
            ok.header("X-Total-Count", String.valueOf(total)).header("X-Truncated", String.valueOf(total > rows.size()));
        }
        return ok.body(rows);
    }

    @GetMapping("/bell")
    public List<Map<String, Object>> bell(@RequestParam(defaultValue = "50") int limit) {
        return audit.bellFeed(p().getCollegeId(), p().getUserType(), p().getId(), limit);
    }

    @PostMapping("/bell/{id}/read")
    public Map<String, Object> bellRead(@PathVariable Long id) {
        return Map.of("updated", audit.bellMarkRead(p().getCollegeId(), p().getUserType(), p().getId(), id));
    }

    /** What the top bar needs every 30 seconds: two numbers, no payload. The bell number is this person's own unread count. */
    @GetMapping("/counts")
    public Map<String, Object> counts() {
        Integer college = p().getCollegeId();
        return Map.of("bell", audit.bellUnreadCount(college, p().getUserType(), p().getId()), "messages", messagesService.unreadForTpo(college),
                "requests", studentsRead.pendingRequestCount(college), "team", teamThreads.unread(college, p().getId()),
                "announcements", announcements.unreadFrom42(college, p().getId()));
    }

    @PostMapping("/bell/read-all")
    public Map<String, Object> bellReadAll() {
        return Map.of("updated", audit.bellMarkAllRead(p().getCollegeId(), p().getUserType(), p().getId()));
    }
}
