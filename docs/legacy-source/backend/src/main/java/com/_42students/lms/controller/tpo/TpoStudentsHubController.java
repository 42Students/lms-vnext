package com._42students.lms.controller.tpo;

import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.*;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Students page endpoints (TPO V1 - Locked.docx §6): table with views, student panel, notes, registration, bulk actions, import. */
@RestController
@RequestMapping("/api/v1/tpo/students")
@RequiredArgsConstructor
public class TpoStudentsHubController {

    private final TpoStudentsReadService students;
    private final PlacementRulesService rules;
    private final TpoAccessGuard guard;
    private final SecurityContextUtil securityContextUtil;
    private final TpoDriveExtrasService driveExtras;
    private final ProfileVerificationService verification;
    private final TpoAuditService audit;

    private UserPrincipal p() { return securityContextUtil.getAuthenticatedUserPrincipal(); }

    public static class BulkRequest {
        public List<Integer> learnerIds;
        public String message;
        public String reason;
        public LocalDate untilDate;
        public Integer untilDrives;
        public Integer courseId;
        public Integer assessmentId;
        public LocalDateTime dueAt;
        public String choice;
        public String label;
        public String note;
        public Integer jobId;
        public String type;
        public String section;
        public String detail;
    }

    /** Every bulk action checks each student belongs to the college. */
    private void scope(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) throw new IllegalArgumentException("Pick at least one student");
        for (Integer id : ids) guard.requireLearner(p(), id);
    }

    public static class RowsRequest { public List<Map<String, Object>> rows; }

    /** The Students page: only students in placements. everyone=true lists every student (pickers). */
    @GetMapping("/table")
    public Map<String, Object> table(@RequestParam(defaultValue = "false") boolean everyone) {
        UserPrincipal p = p();
        String placed = TpoWorkspaceService.placedOfferStatuses(rules.rulesFor(p.getCollegeId()).getCountsAsPlacedAt());
        return students.table(p.getCollegeId(), null, placed, !everyone);
    }

    @GetMapping("/{learnerId}/detail")
    public Map<String, Object> detail(@PathVariable Integer learnerId) {
        guard.requireLearner(p(), learnerId);
        String placed = TpoWorkspaceService.placedOfferStatuses(rules.rulesFor(p().getCollegeId()).getCountsAsPlacedAt());
        return students.detail(p().getCollegeId(), learnerId, placed);
    }

    @PostMapping("/{learnerId}/notes")
    public Map<String, Object> addNote(@PathVariable Integer learnerId, @RequestBody Map<String, String> body) {
        guard.requireLearner(p(), learnerId);
        students.addNote(p().getCollegeId(), learnerId, body.get("note"), p().getId());
        return Map.of("ok", true);
    }

    @PostMapping("/{learnerId}/register")
    public Map<String, Object> register(@PathVariable Integer learnerId, @RequestBody Map<String, String> body) {
        guard.requireLearner(p(), learnerId);
        students.register(p().getCollegeId(), learnerId, body.get("choice"), body.get("label"), body.get("detail"), p().getId());
        return Map.of("ok", true);
    }

    @PostMapping("/bulk/nudge")
    public Map<String, Object> nudge(@RequestBody BulkRequest r) {
        scope(r.learnerIds);
        return Map.of("sent", students.bulkNudge(p().getCollegeId(), r.learnerIds, r.message, p().getId()));
    }

    @PostMapping("/bulk/assign-prep")
    public Map<String, Object> assignPrep(@RequestBody BulkRequest r) {
        scope(r.learnerIds);
        return students.bulkAssignPrep(p().getCollegeId(), r.learnerIds, r.courseId, r.assessmentId, r.dueAt, p().getId());
    }

    @PostMapping("/bulk/higher-studies")
    public Map<String, Object> higherStudies(@RequestBody BulkRequest r) {
        scope(r.learnerIds);
        return Map.of("updated", students.bulkMarkHigherStudies(p().getCollegeId(), r.learnerIds, p().getId()));
    }

    /** Undo of a bulk registration change (Mark higher studies): rows [{ learnerId, choice }], choice null = was not registered. */
    @PostMapping("/bulk/restore-registration")
    public Map<String, Object> restoreRegistration(@RequestBody RowsRequest r) {
        List<Map<String, Object>> rows = r.rows == null ? List.of() : r.rows;
        for (Map<String, Object> row : rows) {
            Object id = row.get("learnerId");
            if (!(id instanceof Number)) throw new IllegalArgumentException("Not found");
            guard.requireLearner(p(), ((Number) id).intValue());
        }
        return Map.of("restored", students.restoreRegistrations(p().getCollegeId(), rows, p().getId()));
    }

    @PostMapping("/bulk/debar")
    public Map<String, Object> debar(@RequestBody BulkRequest r) {
        scope(r.learnerIds);
        return Map.of("debarred", students.bulkDebar(p().getCollegeId(), r.learnerIds, r.reason, r.untilDate, r.untilDrives, p().getId()));
    }

    @PostMapping("/bulk/register")
    public Map<String, Object> bulkRegister(@RequestBody BulkRequest r) {
        scope(r.learnerIds);
        return students.bulkRegister(p().getCollegeId(), r.learnerIds, r.choice, r.label, r.detail, p().getId());
    }

    @PostMapping("/bulk/lift-debarment")
    public Map<String, Object> bulkLift(@RequestBody BulkRequest r) {
        scope(r.learnerIds);
        return Map.of("lifted", students.bulkLiftDebarments(p().getCollegeId(), r.learnerIds, r.reason, p().getId()));
    }

    @PostMapping("/bulk/note")
    public Map<String, Object> bulkNote(@RequestBody BulkRequest r) {
        scope(r.learnerIds);
        return Map.of("added", students.bulkNote(p().getCollegeId(), r.learnerIds, r.note, p().getId()));
    }

    /** Show a drive to these students (INCLUDE) or hide it from them (EXCLUDE), with a reason. Returns what each had before, for undo. */
    @PostMapping("/bulk/drive-override")
    public Map<String, Object> bulkOverride(@RequestBody BulkRequest r) {
        scope(r.learnerIds);
        if (r.jobId == null) throw new IllegalArgumentException("Choose the drive");
        guard.requireJobWritable(p(), r.jobId);
        List<Map<String, Object>> before = students.overridesOf(r.jobId, r.learnerIds);
        for (Integer id : new java.util.LinkedHashSet<>(r.learnerIds)) driveExtras.setOverride(r.jobId, id, r.type, r.reason, p().getId());
        audit.log(p().getCollegeId(), "TPO", p().getId(), "ELIGIBILITY_" + r.type, "DRIVE", r.jobId.longValue(), new java.util.LinkedHashSet<>(r.learnerIds).size() + " students: " + r.reason);
        return Map.of("done", new java.util.LinkedHashSet<>(r.learnerIds).size(), "before", before);
    }

    public static class OverrideRestore { public Integer jobId; public List<Map<String, Object>> rows; }

    /** Undo of the above: each student's override goes back to what it was (none, include or exclude). */
    @PostMapping("/bulk/drive-override/restore")
    public Map<String, Object> restoreOverride(@RequestBody OverrideRestore r) {
        if (r.jobId == null || r.rows == null) throw new IllegalArgumentException("Nothing to undo");
        guard.requireJobWritable(p(), r.jobId);
        List<Integer> ids = r.rows.stream().map(x -> ((Number) x.get("learnerId")).intValue()).toList();
        scope(ids);
        for (Map<String, Object> row : r.rows) {
            Integer id = ((Number) row.get("learnerId")).intValue();
            Object type = row.get("type");
            if (type == null) driveExtras.removeOverride(r.jobId, id);
            else driveExtras.setOverride(r.jobId, id, type.toString(), String.valueOf(row.get("reason")), p().getId());
        }
        audit.log(p().getCollegeId(), "TPO", p().getId(), "ELIGIBILITY_OVERRIDE_RESTORED", "DRIVE", r.jobId.longValue(), ids.size() + " students put back (undo)");
        return Map.of("restored", ids.size());
    }

    /** Verify every section these students submitted and the college has not decided. Students with nothing waiting are reported. */
    @PostMapping("/bulk/verify")
    public Map<String, Object> bulkVerify(@RequestBody BulkRequest r) {
        scope(r.learnerIds);
        Integer college = verification.verifierCollege(p(), null);
        int done = 0;
        List<Map<String, Object>> failed = new java.util.ArrayList<>();
        for (Integer id : new java.util.LinkedHashSet<>(r.learnerIds)) {
            for (String section : ProfileVerificationService.SECTIONS) {
                try { verification.requireDocumentsForBlindVerify(college, id, section); verification.verify(p(), college, id, section); done++; }
                catch (IllegalStateException nothingWaiting) { /* that section has nothing to verify */ }
                catch (RuntimeException e) { failed.add(Map.of("learnerId", id, "section", section, "reason", String.valueOf(e.getMessage()))); }
            }
        }
        return Map.of("verified", done, "failed", failed);
    }

    /** Send a section back to each of these students with one reason (only where something is waiting). */
    @PostMapping("/bulk/send-back")
    public Map<String, Object> bulkSendBack(@RequestBody BulkRequest r) {
        scope(r.learnerIds);
        Integer college = verification.verifierCollege(p(), null);
        List<String> sections = r.section == null || r.section.isBlank() || "ALL".equalsIgnoreCase(r.section) ? ProfileVerificationService.SECTIONS : List.of(r.section);
        int done = 0;
        List<Map<String, Object>> failed = new java.util.ArrayList<>();
        for (Integer id : new java.util.LinkedHashSet<>(r.learnerIds)) {
            int forThem = 0;
            boolean errored = false;
            for (String section : sections) {
                try { verification.sendBack(p(), college, id, section, r.reason); done++; forThem++; }
                catch (IllegalStateException nothingWaiting) { /* nothing waiting in that section */ }
                catch (RuntimeException e) { errored = true; failed.add(Map.of("learnerId", id, "section", section, "reason", String.valueOf(e.getMessage()))); }
            }
            // Nothing of what was asked is waiting for this student (e.g. Education chosen, only Identity waiting): say so, not "Done".
            if (forThem == 0 && !errored) failed.add(Map.of("learnerId", id, "section", String.join(",", sections),
                    "reason", sections.size() == 1 ? "Nothing waiting in " + (ProfileVerificationService.EDUCATION.equals(sections.get(0)) ? "Education" : "Identity") : "Nothing waiting"));
        }
        return Map.of("sentBack", done, "failed", failed);
    }

    @PostMapping("/academic-import/preview")
    public Map<String, Object> academicPreview(@RequestBody RowsRequest r) {
        return students.academicPreview(p().getCollegeId(), r.rows == null ? List.of() : r.rows);
    }

    @PostMapping("/academic-import")
    public Map<String, Object> academicImport(@RequestBody RowsRequest r) {
        return Map.of("updated", students.academicImport(p().getCollegeId(), r.rows == null ? List.of() : r.rows, p().getId()));
    }

    @GetMapping("/requests-queue")
    public List<Map<String, Object>> requestsQueue(@RequestParam(defaultValue = "false") boolean includeDecided,
                                                   @RequestParam(required = false) Integer decidedDays) {
        // decidedDays: 30 by default (the page's "Last 30 days"); 0 means everything decided (the page's full history).
        Integer days = decidedDays == null ? Integer.valueOf(30) : decidedDays <= 0 ? null : decidedDays;
        return students.requestsQueue(p().getCollegeId(), includeDecided, days, null);
    }

    /** Existing LMS courses the TPO can assign as prep (courses of the caller's organisation). */
    @GetMapping("/prep-courses")
    public List<Map<String, Object>> prepCourses() {
        return students.prepCourses(p().getOrganizationId());
    }
}
