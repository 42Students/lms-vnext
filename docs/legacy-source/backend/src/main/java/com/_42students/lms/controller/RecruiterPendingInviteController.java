package com._42students.lms.controller;

import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.RecruiterInviteService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * A recruiter who already has a 42LMS account is never given a college silently (TPO V1 - Locked.docx §3 Invite): the college's invitation waits
 * here until they sign in and say yes. Under /api/v1/recruiter/**, so the recruiter fence lets it through. The recruiter only ever sees and answers their own.
 */
@RestController
@RequestMapping("/api/v1/recruiter/pending-invites")
@RequiredArgsConstructor
public class RecruiterPendingInviteController {

    private final RecruiterInviteService inviteService;
    private final SecurityContextUtil securityContextUtil;

    private UserPrincipal p() { return securityContextUtil.getAuthenticatedUserPrincipal(); }

    @GetMapping
    public List<Map<String, Object>> list() { return inviteService.pendingFor(p().getId()); }

    @PostMapping("/{collegeId}/accept")
    public Map<String, Object> accept(@PathVariable Integer collegeId) { inviteService.acceptPending(p().getId(), collegeId); return Map.of("ok", true); }

    @PostMapping("/{collegeId}/decline")
    public Map<String, Object> decline(@PathVariable Integer collegeId) { inviteService.declinePending(p().getId(), collegeId); return Map.of("ok", true); }
}
