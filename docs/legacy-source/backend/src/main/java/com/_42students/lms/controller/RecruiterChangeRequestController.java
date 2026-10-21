package com._42students.lms.controller;

import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.recruiter.RecruiterAccessService;
import com._42students.lms.service.recruiter.RecruiterCapability;
import com._42students.lms.service.tpo.DriveChangeRequestService;
import com._42students.lms.service.tpo.RecruiterDriveWorkService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * The recruiter's side of drive change requests (recruiter phase 1, N14): answer the college's institutional requests in
 * place (Accept, Reply, or type the detail asked for) and ask the college for a change (a company request). Only on the
 * recruiter's own drives at a college they hold drive work access to.
 */
@RestController
@RequestMapping("/api/v1/recruiter/colleges/{collegeId}")
@RequiredArgsConstructor
public class RecruiterChangeRequestController {

    private final DriveChangeRequestService changes;
    private final RecruiterAccessService accessService;
    private final RecruiterDriveWorkService work;
    private final SecurityContextUtil securityContextUtil;

    public static class TextBody {
        public String value;
    }

    private DriveChangeRequestService.Actor own(Integer collegeId, Integer jobId) {
        UserPrincipal p = securityContextUtil.getAuthenticatedUserPrincipal();
        accessService.requireCollege(p, collegeId, RecruiterCapability.DRIVE_WORK);
        work.requireOwn(p.getId(), collegeId, jobId);
        // The placement cell sees who asked (R2: the name was not kept).
        String name = accessService.findUsableRecruiter(p.getId())
                .map(r -> ((r.getFirstName() == null ? "" : r.getFirstName()) + " " + (r.getLastName() == null ? "" : r.getLastName())).trim()).orElse(null);
        return new DriveChangeRequestService.Actor("RECRUITER", p.getId(), name);
    }

    @GetMapping("/drives/{jobId}/change-requests")
    public List<Map<String, Object>> list(@PathVariable Integer collegeId, @PathVariable Integer jobId) {
        own(collegeId, jobId);
        return changes.list(jobId);
    }

    @PostMapping("/drives/{jobId}/change-requests")
    public Map<String, Object> create(@PathVariable Integer collegeId, @PathVariable Integer jobId, @RequestBody DriveChangeRequestService.NewRequest body) {
        return changes.create(jobId, body, own(collegeId, jobId));
    }

    @PostMapping("/change-requests/{id}/accept")
    public Map<String, Object> accept(@PathVariable Integer collegeId, @PathVariable Long id) {
        changes.accept(id, own(collegeId, changes.jobOf(id)));
        return Map.of("status", "ACCEPTED");
    }

    @PostMapping("/change-requests/{id}/answer")
    public Map<String, Object> answer(@PathVariable Integer collegeId, @PathVariable Long id, @RequestBody TextBody body) {
        changes.answer(id, body == null ? null : body.value, own(collegeId, changes.jobOf(id)));
        return Map.of("status", "ANSWERED");
    }

    @PostMapping("/change-requests/{id}/reply")
    public Map<String, Object> reply(@PathVariable Integer collegeId, @PathVariable Long id, @RequestBody TextBody body) {
        changes.reply(id, body == null ? null : body.value, own(collegeId, changes.jobOf(id)));
        return Map.of("status", "REPLIED");
    }

    @PostMapping("/change-requests/{id}/withdraw")
    public Map<String, Object> withdraw(@PathVariable Integer collegeId, @PathVariable Long id) {
        changes.withdraw(id, own(collegeId, changes.jobOf(id)));
        return Map.of("status", "WITHDRAWN");
    }

    /** "Already settled", "this drive is over", "access has ended": a conflict the screen shows in words, not a server error. */
    @org.springframework.web.bind.annotation.ExceptionHandler(IllegalStateException.class)
    public org.springframework.http.ResponseEntity<Map<String, Object>> conflict(IllegalStateException e) {
        return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.CONFLICT)
                .body(Map.of("status", "CONFLICT", "message", e.getMessage() == null ? "Conflict" : e.getMessage()));
    }
}
