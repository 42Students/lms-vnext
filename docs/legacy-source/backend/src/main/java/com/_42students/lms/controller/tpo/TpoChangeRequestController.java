package com._42students.lms.controller.tpo;

import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.DriveChangeRequestService;
import com._42students.lms.service.tpo.TpoTeamThreadService;
import com._42students.lms.service.tpo.DriveReviewInviteService;
import com._42students.lms.service.tpo.TpoAccessGuard;
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
 * The placement cell's side of drive change requests (recruiter phase 1, N14): ask the company for a change (an institutional
 * request) and answer the company's own requests (company requests). Under /api/v1/tpo, so the TPO access filter applies.
 */
@RestController
@RequestMapping("/api/v1/tpo")
@RequiredArgsConstructor
public class TpoChangeRequestController {

    private final DriveChangeRequestService changes;
    private final TpoAccessGuard guard;
    private final SecurityContextUtil securityContextUtil;
    private final DriveReviewInviteService reviewInvites;
    private final TpoTeamThreadService teamThreads;

    public static class TextBody {
        public String value;
    }

    private UserPrincipal p() {
        return securityContextUtil.getAuthenticatedUserPrincipal();
    }

    private DriveChangeRequestService.Actor actor() {
        UserPrincipal me = p();
        return new DriveChangeRequestService.Actor("FACULTY", me.getId(), null);
    }

    @GetMapping("/drives/{jobId}/change-requests")
    public List<Map<String, Object>> list(@PathVariable Integer jobId) {
        guard.requireJob(p(), jobId);
        return changes.list(jobId);
    }

    @PostMapping("/drives/{jobId}/change-requests")
    public Map<String, Object> create(@PathVariable Integer jobId, @RequestBody DriveChangeRequestService.NewRequest body) {
        guard.requireJob(p(), jobId);
        return changes.create(jobId, body, actor());
    }

    @PostMapping("/change-requests/{id}/accept")
    public Map<String, Object> accept(@PathVariable Long id) {
        guard.requireJob(p(), changes.jobOf(id));
        changes.accept(id, actor());
        return Map.of("status", "ACCEPTED");
    }

    @PostMapping("/change-requests/{id}/answer")
    public Map<String, Object> answer(@PathVariable Long id, @RequestBody TextBody body) {
        guard.requireJob(p(), changes.jobOf(id));
        changes.answer(id, body == null ? null : body.value, actor());
        return Map.of("status", "ANSWERED");
    }

    @PostMapping("/change-requests/{id}/reply")
    public Map<String, Object> reply(@PathVariable Long id, @RequestBody TextBody body) {
        guard.requireJob(p(), changes.jobOf(id));
        changes.reply(id, body == null ? null : body.value, actor());
        return Map.of("status", "REPLIED");
    }

    @PostMapping("/change-requests/{id}/withdraw")
    public Map<String, Object> withdraw(@PathVariable Long id) {
        guard.requireJob(p(), changes.jobOf(id));
        changes.withdraw(id, actor());
        return Map.of("status", "WITHDRAWN");
    }

    public static class ReviewInvite {
        public String name;
        public String email;
        public String note;
        /** Add the college's public link, for the recruiter to pass to colleagues. */
        public Boolean includePublicLink;
    }

    /** The placement cell posted the drive; the company's recruiter reviews it and answers with change requests (N5 c). */
    @PostMapping("/drives/{jobId}/invite-recruiter")
    public Map<String, Object> inviteRecruiter(@PathVariable Integer jobId, @RequestBody ReviewInvite body, javax.servlet.http.HttpServletRequest http) {
        UserPrincipal me = p();
        guard.requireJob(me, jobId);
        return reviewInvites.invite(me.getCollegeId(), jobId, body == null ? null : body.name, body == null ? null : body.email,
                body == null ? null : body.note, me.getId(), http.getHeader("Origin"), body != null && Boolean.TRUE.equals(body.includePublicLink));
    }

    /**
     * The drive's internal discussion (N7) is the drive's Team conversation now (Team module V1: one store, the drive page is a second
     * door). These two keep working for a screen opened before the change: they read and write that conversation.
     */
    @GetMapping("/drives/{jobId}/internal-notes")
    public List<Map<String, Object>> internalNotes(@PathVariable Integer jobId) {
        UserPrincipal me = p();
        guard.requireJob(me, jobId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> messages = (List<Map<String, Object>>) teamThreads.about(me.getCollegeId(), me.getId(), "DRIVE", String.valueOf(jobId)).get("messages");
        return messages.stream().filter(m -> "MESSAGE".equals(m.get("kind")) && !Boolean.TRUE.equals(m.get("deleted")))
                .map(m -> Map.<String, Object>of("id", m.get("id"), "body", TpoTeamThreadService.preview(String.valueOf(m.get("body")), TpoTeamThreadService.MAX_BODY), "createdAt", m.get("createdAt"),
                        "authorId", m.get("authorId"), "authorName", String.valueOf(m.get("authorName")))).toList();
    }

    @PostMapping("/drives/{jobId}/internal-notes")
    public Map<String, Object> addInternalNote(@PathVariable Integer jobId, @RequestBody TextBody body) {
        UserPrincipal me = p();
        guard.requireJob(me, jobId);
        TpoTeamThreadService.Send send = new TpoTeamThreadService.Send();
        send.body = body == null ? null : body.value;
        teamThreads.sendAbout(me.getCollegeId(), me.getId(), "DRIVE", String.valueOf(jobId), send);
        return Map.of("status", "ADDED");
    }
}
