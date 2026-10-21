package com._42students.lms.controller;

import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.recruiter.RecruiterAccessService;
import com._42students.lms.service.recruiter.RecruiterCapability;
import com._42students.lms.service.tpo.RecruiterDriveWorkService;
import com._42students.lms.service.tpo.TpoMessagesService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * A recruiter working on their own drives at one college (Recruiter V1 - Locked.docx): applicants as shared, shortlists and results, interview slots,
 * the company's selection list, and messages with the placement cell. Under /api/v1/recruiter/**, so the recruiter fence lets it through; every method checks
 * the DRIVE_WORK capability for that college and that the drive is theirs. A bad id answers 404 like a missing one.
 */
@RestController
@RequestMapping("/api/v1/recruiter/colleges/{collegeId}")
@RequiredArgsConstructor
public class RecruiterDriveController {

    private final RecruiterAccessService accessService;
    private final RecruiterDriveWorkService work;
    private final TpoMessagesService messages;
    private final com._42students.lms.service.tpo.TpoShareService shareService;
    private final com._42students.lms.service.recruiter.RecruiterTodayService todayService;
    private final com._42students.lms.service.recruiter.RecruiterWorkspaceService workspaceService;
    private final SecurityContextUtil securityContextUtil;

    private UserPrincipal p() { return securityContextUtil.getAuthenticatedUserPrincipal(); }

    private long me(Integer collegeId) {
        UserPrincipal p = p();
        accessService.requireCollege(p, collegeId, RecruiterCapability.DRIVE_WORK);
        return p.getId().longValue();
    }

    public static class ResultsRequest { public List<Map<String, Object>> rows; }
    public static class SlotsRequest { public List<Map<String, Object>> slots; }
    public static class SelectionRequest { public List<String> applicantIds; public String roleOption; public BigDecimal ctcLpa; public String kind; }
    public static class MessageRequest { public Integer jobId; public String body; public Long changeRequestId; }

    /** recruiter V2 Today: what needs the recruiter now at this college, what is coming this week, and their busiest live drive. */
    @GetMapping("/today")
    public Map<String, Object> today(@PathVariable Integer collegeId) {
        UserPrincipal p = p();
        accessService.requireCollege(p, collegeId, null);
        return todayService.today(p.getId().longValue(), collegeId);
    }

    /** recruiter V2 Calendar: rounds, slots, deadlines and result due dates in [from, to). Defaults to the next 30 days. */
    @GetMapping("/calendar")
    public List<Map<String, Object>> calendar(@PathVariable Integer collegeId,
                                              @RequestParam(required = false) String from,
                                              @RequestParam(required = false) String to) {
        UserPrincipal p = p();
        accessService.requireCollege(p, collegeId, null);
        // Instants (with a Z or offset) are converted to the UTC wall-clock the data is stored in; an unreadable value is a bad request.
        java.time.LocalDateTime parsedFrom = com._42students.lms.util.PlacementDateTimeUtils.parseUtcDateTime(from);
        java.time.LocalDateTime parsedTo = com._42students.lms.util.PlacementDateTimeUtils.parseUtcDateTime(to);
        if ((from != null && !from.isBlank() && parsedFrom == null) || (to != null && !to.isBlank() && parsedTo == null)) throw new IllegalArgumentException("Dates must be ISO date-times");
        java.time.LocalDateTime start = parsedFrom != null ? parsedFrom : com._42students.lms.util.PlacementDateTimeUtils.todayUtc().atStartOfDay();
        java.time.LocalDateTime end = parsedTo != null ? parsedTo : start.plusDays(30);
        if (!end.isAfter(start) || end.isAfter(start.plusDays(120))) throw new IllegalArgumentException("Choose a range of up to 120 days");
        return todayService.calendar(p.getId().longValue(), collegeId, start, end);
    }

    /** Offers on one of the recruiter's drives. */
    @GetMapping("/drives/{jobId}/offers")
    public List<Map<String, Object>> offers(@PathVariable Integer collegeId, @PathVariable Integer jobId) {
        return workspaceService.offers(me(collegeId), collegeId, jobId);
    }

    public static class NoteRequest { public Integer rating; public String note; }

    /** The recruiter's own private ratings and notes on this drive's applicants. */
    @GetMapping("/drives/{jobId}/notes")
    public List<Map<String, Object>> notes(@PathVariable Integer collegeId, @PathVariable Integer jobId) {
        return workspaceService.notes(me(collegeId), collegeId, jobId);
    }

    @PutMapping("/drives/{jobId}/notes/{applicantId}")
    public Map<String, Object> saveNote(@PathVariable Integer collegeId, @PathVariable Integer jobId, @PathVariable String applicantId, @RequestBody NoteRequest r) {
        workspaceService.saveNote(me(collegeId), collegeId, jobId, applicantId, r.rating, r.note);
        return Map.of("ok", true);
    }

    /** The company as students see it (read-only: managed centrally). */
    @GetMapping("/company")
    public Map<String, Object> company(@PathVariable Integer collegeId) {
        UserPrincipal p = p();
        accessService.requireCollege(p, collegeId, null);
        Map<String, Object> c = workspaceService.company(p.getId().longValue());
        return c == null ? Map.of() : c;
    }

    /** Colleagues of the same company who can work with this college. */
    @GetMapping("/team")
    public List<Map<String, Object>> team(@PathVariable Integer collegeId) {
        UserPrincipal p = p();
        accessService.requireCollege(p, collegeId, null);
        return workspaceService.team(p.getId().longValue(), collegeId);
    }

    /** Funnel and offer outcomes for the recruiter's drives at this college. */
    @GetMapping("/reports")
    public Map<String, Object> reports(@PathVariable Integer collegeId) {
        return workspaceService.reports(me(collegeId), collegeId);
    }

    @GetMapping("/drives")
    public List<Map<String, Object>> drives(@PathVariable Integer collegeId) { return work.drives(me(collegeId), collegeId); }

    @GetMapping("/drives/{jobId}/rounds")
    public List<Map<String, Object>> rounds(@PathVariable Integer collegeId, @PathVariable Integer jobId) { return work.rounds(me(collegeId), collegeId, jobId); }

    @GetMapping("/drives/{jobId}/applicants")
    public Map<String, Object> applicants(@PathVariable Integer collegeId, @PathVariable Integer jobId) { return work.applicants(me(collegeId), collegeId, jobId); }

    /** Placements UX pass: the drive pipeline funnel, same shape as the TPO's own drive dashboard. */
    @GetMapping("/drives/{jobId}/pipeline")
    public List<Map<String, Object>> pipeline(@PathVariable Integer collegeId, @PathVariable Integer jobId) { return work.pipeline(me(collegeId), collegeId, jobId); }

    /** recruiter V1 §7 "Resumes (ZIP)": every shared applicant's resume, named ROLL_Name.pdf, with the same README the public share link gives. */
    @PostMapping("/drives/{jobId}/resumes")
    public org.springframework.http.ResponseEntity<?> resumes(@PathVariable Integer collegeId, @PathVariable Integer jobId) {
        work.requireOwn(me(collegeId), collegeId, jobId);
        try {
            java.io.ByteArrayOutputStream buf = new java.io.ByteArrayOutputStream();
            shareService.writeResumeZipForRecruiter(jobId, collegeId, work.directColumnsFor(jobId), buf);
            return ResponseEntity.ok().header("Content-Disposition", "attachment; filename=\"resumes.zip\"")
                    .contentType(org.springframework.http.MediaType.parseMediaType("application/zip")).body(buf.toByteArray());
        } catch (java.io.IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Could not build the ZIP."));
        }
    }

    public static class RoundRequest { public String kind; public String name; public String mode; }

    /** Add a round at the end of the recruiter's own drive. */
    @PostMapping("/drives/{jobId}/rounds")
    public Map<String, Object> addRound(@PathVariable Integer collegeId, @PathVariable Integer jobId, @RequestBody RoundRequest r) {
        return work.addRound(me(collegeId), collegeId, jobId, r.kind, r.name, r.mode);
    }

    @PutMapping("/drives/{jobId}/rounds/{roundId}")
    public Map<String, Object> updateRound(@PathVariable Integer collegeId, @PathVariable Integer jobId, @PathVariable Long roundId, @RequestBody RoundRequest r) {
        return work.updateRound(me(collegeId), collegeId, jobId, roundId, r.kind, r.name, r.mode);
    }

    @DeleteMapping("/drives/{jobId}/rounds/{roundId}")
    public Map<String, Object> deleteRound(@PathVariable Integer collegeId, @PathVariable Integer jobId, @PathVariable Long roundId) {
        work.deleteRound(me(collegeId), collegeId, jobId, roundId);
        return Map.of("deleted", true);
    }

    @PostMapping("/drives/{jobId}/rounds/{roundId}/results")
    public Map<String, Object> results(@PathVariable Integer collegeId, @PathVariable Integer jobId, @PathVariable Long roundId, @RequestBody ResultsRequest r) {
        return work.submitResults(me(collegeId), collegeId, jobId, roundId, r.rows);
    }

    @GetMapping("/drives/{jobId}/rounds/{roundId}/slots")
    public List<Map<String, Object>> slots(@PathVariable Integer collegeId, @PathVariable Integer jobId, @PathVariable Long roundId) {
        return work.slots(me(collegeId), collegeId, jobId, roundId);
    }

    @PostMapping("/drives/{jobId}/rounds/{roundId}/slots")
    public Map<String, Object> proposeSlots(@PathVariable Integer collegeId, @PathVariable Integer jobId, @PathVariable Long roundId, @RequestBody SlotsRequest r) {
        return Map.of("added", work.proposeSlots(me(collegeId), collegeId, jobId, roundId, r.slots));
    }

    @PostMapping("/drives/{jobId}/selections")
    public Map<String, Object> selections(@PathVariable Integer collegeId, @PathVariable Integer jobId, @RequestBody SelectionRequest r) {
        return Map.of("recorded", work.submitSelections(me(collegeId), collegeId, jobId, r.applicantIds, r.roleOption, r.ctcLpa, r.kind));
    }

    // ---------------------------------------------------------------- messages
    @GetMapping("/messages/threads")
    public List<Map<String, Object>> threads(@PathVariable Integer collegeId) { return messages.threadsForRecruiter(collegeId, me(collegeId)); }

    /** Changes whenever this recruiter's conversations with the college change; their screens poll it while open. */
    @GetMapping("/messages/pulse")
    public Map<String, Object> pulse(@PathVariable Integer collegeId) { return Map.of("version", messages.pulse(collegeId, me(collegeId))); }

    @GetMapping("/messages/threads/{threadId}")
    public List<Map<String, Object>> thread(@PathVariable Integer collegeId, @PathVariable Long threadId) {
        long recruiter = me(collegeId);
        if (!messages.threadBelongsToRecruiter(threadId, collegeId, recruiter)) throw new IllegalArgumentException("Not found");
        return messages.messages(collegeId, threadId, "RECRUITER");
    }

    @PostMapping("/messages")
    public ResponseEntity<Map<String, Object>> send(@PathVariable Integer collegeId, @RequestBody MessageRequest r) {
        long recruiter = me(collegeId);
        if (r.jobId != null) work.requireOwn(recruiter, collegeId, r.jobId);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("threadId", messages.send(collegeId, recruiter, r.jobId, "RECRUITER", (int) recruiter, r.body, r.changeRequestId)));
    }

    /** "Already settled", "this drive is over", "access has ended": a conflict the screen shows in words, not a server error. */
    @org.springframework.web.bind.annotation.ExceptionHandler(IllegalStateException.class)
    public org.springframework.http.ResponseEntity<Map<String, Object>> conflict(IllegalStateException e) {
        return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.CONFLICT)
                .body(Map.of("status", "CONFLICT", "message", e.getMessage() == null ? "Conflict" : e.getMessage()));
    }
}
