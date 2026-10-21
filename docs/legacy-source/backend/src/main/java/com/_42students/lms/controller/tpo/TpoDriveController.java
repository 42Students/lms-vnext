package com._42students.lms.controller.tpo;

import com._42students.lms.dto.tpo.DriveForm;
import com._42students.lms.model.Job;
import com._42students.lms.model.tpo.JobRound;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.TpoAccessGuard;
import com._42students.lms.service.tpo.TpoAuditService;
import com._42students.lms.service.tpo.TpoDriveService;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Drives (create/publish/close/cancel), the primary V1 path: a TPO can run every drive alone.
 * See TPO V1 - Locked.docx §4-5. hasAnyRole('TPO','ADMIN') in WebSecurityConfig — a college with
 * no TPO account still works because its college admin holds ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/v1/tpo/drives")
public class TpoDriveController {

    private final TpoDriveService driveService;
    private final JobRepository jobRepository;
    private final SecurityContextUtil securityContextUtil;
    private final TpoAccessGuard guard;
    private final TpoAuditService audit;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.repository.FacultyRepository facultyRepository;

    public TpoDriveController(TpoDriveService driveService, JobRepository jobRepository, SecurityContextUtil securityContextUtil, TpoAccessGuard guard, TpoAuditService audit) {
        this.guard = guard;
        this.audit = audit;
        this.driveService = driveService;
        this.jobRepository = jobRepository;
        this.securityContextUtil = securityContextUtil;
    }

    private UserPrincipal principal() {
        return securityContextUtil.getAuthenticatedUserPrincipal();
    }

    /** Confirms the drive belongs to the caller's college; refuses cross-college access. */
    private Job requireOwnedJob(Integer jobId) {
        guard.requireJob(principal(), jobId);
        return jobRepository.findById(jobId).orElseThrow(() -> new IllegalArgumentException("Not found"));
    }

    /** "Everything logs itself": the drive's own lifecycle (create, publish, cancel...) used to be the one thing that did not. */
    private void logDrive(String action, Job job, String extra) {
        UserPrincipal p = principal();
        String who = ((job.getCompanyName() == null ? "" : job.getCompanyName()) + " · " + (job.getJobTitle() == null ? "" : job.getJobTitle())).trim();
        audit.log(p.getCollegeId(), "TPO", p.getId(), action, "DRIVE", (long) job.getId(),
                extra == null || extra.isBlank() ? who : who + " — " + extra.trim());
    }

    /** Every drive belonging to the caller's college. No filter/pagination yet — see BUILD-LOG.md. */
    @GetMapping
    public ResponseEntity<List<Job>> list() {
        UserPrincipal p = principal();
        if (p.getCollegeId() == null) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(jobRepository.findByCollegeIdAndIsDeletedFalse(p.getCollegeId()));
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<Job> get(@PathVariable Integer jobId) {
        return ResponseEntity.ok(withSaver(requireOwnedJob(jobId)));
    }

    /** Records who saved the form and when, and names them for "Last saved by" (recruiter phase 1, N10). */
    private Job savedBy(Job job, UserPrincipal p) {
        job.setLastSavedByFacultyId(p.getId());
        job.setLastSavedAt(LocalDateTime.now());
        jobRepository.save(job);
        return withSaver(job);
    }

    private Job withSaver(Job job) {
        if (job.getLastSavedByFacultyId() != null && facultyRepository != null) {
            facultyRepository.findById(job.getLastSavedByFacultyId())
                    .ifPresent(f -> job.setLastSavedByName(((f.getFirstName() == null ? "" : f.getFirstName()) + " " + (f.getLastName() == null ? "" : f.getLastName())).trim()));
        }
        return job;
    }

    @PostMapping
    public ResponseEntity<Job> create(@RequestBody DriveForm form) {
        UserPrincipal p = principal();
        Job job = savedBy(driveService.createDraft(form, p.getOrganizationId(), p.getCollegeId(), p.getId()), p);
        logDrive("DRIVE_CREATED", job, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(job);
    }

    @PutMapping("/{jobId}")
    public ResponseEntity<Job> update(@PathVariable Integer jobId, @RequestBody DriveForm form) {
        requireOwnedJob(jobId);
        Job saved = savedBy(driveService.updateDraft(jobId, form), principal());
        // BE-0056: ordinary edits show in the Audit Log too. The editor autosaves, so one entry per person and drive every
        // 10 minutes (a stretch of editing), not one per keystroke save.
        UserPrincipal p = principal();
        String who = ((saved.getCompanyName() == null ? "" : saved.getCompanyName()) + " · " + (saved.getJobTitle() == null ? "" : saved.getJobTitle())).trim();
        audit.logAtMostEvery(10, p.getCollegeId(), "TPO", p.getId(), "DRIVE_EDITED", "DRIVE", (long) saved.getId(), who);
        return ResponseEntity.ok(saved);
    }

    /** Delete a draft: only while it is a draft and nobody has applied. A published drive is cancelled or closed instead. */
    @DeleteMapping("/{jobId}")
    public ResponseEntity<Map<String, Object>> deleteDraft(@PathVariable Integer jobId) {
        Job job = requireOwnedJob(jobId);
        driveService.deleteDraft(jobId);
        logDrive("DRIVE_DRAFT_DELETED", job, null);
        return ResponseEntity.ok(Map.of("deleted", true));
    }

    @GetMapping("/{jobId}/rounds")
    public ResponseEntity<List<JobRound>> rounds(@PathVariable Integer jobId) {
        requireOwnedJob(jobId);
        return ResponseEntity.ok(driveService.rounds(jobId));
    }

    @PostMapping("/{jobId}/publish")
    public ResponseEntity<Job> publish(@PathVariable Integer jobId, @RequestParam(defaultValue = "true") boolean notifyByEmail) {
        requireOwnedJob(jobId);
        Job job = driveService.publish(jobId, principal().getId(), notifyByEmail);
        logDrive("DRIVE_PUBLISHED", job, notifyByEmail ? "students emailed" : "no email sent");
        return ResponseEntity.ok(job);
    }

    @PostMapping("/{jobId}/send-back")
    public ResponseEntity<Job> sendBack(@PathVariable Integer jobId, @RequestBody Map<String, String> body) {
        requireOwnedJob(jobId);
        Job job = driveService.sendBack(jobId, body.get("note"));
        logDrive("DRIVE_SENT_BACK", job, body.get("note"));
        return ResponseEntity.ok(job);
    }

    /** Accept a recruiter's request: it becomes a draft the caller owns. */
    @PostMapping("/{jobId}/approve")
    public ResponseEntity<Job> approve(@PathVariable Integer jobId) {
        requireOwnedJob(jobId);
        Job job = driveService.approveRequest(jobId, principal().getId());
        logDrive("REQUEST_APPROVED", job, null);
        return ResponseEntity.ok(job);
    }

    @PostMapping("/{jobId}/reject")
    public ResponseEntity<Job> reject(@PathVariable Integer jobId, @RequestBody Map<String, String> body) {
        requireOwnedJob(jobId);
        Job job = driveService.rejectRequest(jobId, body.get("reason"));
        logDrive("REQUEST_REJECTED", job, body.get("reason"));
        return ResponseEntity.ok(job);
    }

    @PostMapping("/{jobId}/cancel")
    public ResponseEntity<Job> cancel(@PathVariable Integer jobId, @RequestBody Map<String, String> body) {
        requireOwnedJob(jobId);
        Job job = driveService.cancel(jobId, body.get("reason"), principal().getId());
        logDrive("DRIVE_CANCELLED", job, body.get("reason"));
        return ResponseEntity.ok(job);
    }

    @PostMapping("/{jobId}/close")
    public ResponseEntity<Job> close(@PathVariable Integer jobId) {
        requireOwnedJob(jobId);
        Job job = driveService.close(jobId, principal().getId());
        logDrive("DRIVE_CLOSED", job, null);
        return ResponseEntity.ok(job);
    }

    @PostMapping("/{jobId}/extend-deadline")
    public ResponseEntity<Job> extendDeadline(@PathVariable Integer jobId, @RequestBody Map<String, String> body) {
        requireOwnedJob(jobId);
        Job job = driveService.extendDeadline(jobId, LocalDateTime.parse(body.get("newDeadline")));
        logDrive("DEADLINE_EXTENDED", job, "new deadline " + body.get("newDeadline"));
        return ResponseEntity.ok(job);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleConflict(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
    }
}
