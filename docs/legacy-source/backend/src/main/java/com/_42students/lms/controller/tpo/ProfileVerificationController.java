package com._42students.lms.controller.tpo;

import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.ProfileVerificationService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

/**
 * Profile verification (docs/tpo-ux/PROFILE-VERIFICATION-DESIGN.md).
 * Student: GET/POST /api/v1/profile/verification. Verifiers (college admin, super admin, TPO admins when allowed):
 * /api/v1/profile-verification/**. A super admin passes collegeId; everyone else works on their own college.
 */
@RestController
@RequiredArgsConstructor
public class ProfileVerificationController {

    private final ProfileVerificationService service;
    private final SecurityContextUtil securityContextUtil;

    private UserPrincipal p() { return securityContextUtil.getAuthenticatedUserPrincipal(); }

    private <T> T guarded(Supplier<T> body) {
        try { return body.get(); }
        catch (ProfileVerificationService.NotAllowed e) { throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage()); }
    }

    private Integer learner() {
        UserPrincipal p = p();
        if (p == null || !p.isLearner()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only students verify their own profile");
        return p.getId();
    }

    // ---------------------------------------------------------------- student
    @GetMapping("/api/v1/profile/verification")
    public Map<String, Object> mine() { return service.mine(learner()); }

    @PostMapping("/api/v1/profile/verification/{section}/submit")
    public Map<String, Object> submit(@PathVariable String section) { return service.submit(learner(), section); }

    // ---------------------------------------------------------------- verifiers
    /** Whether the caller can verify here, and the college it is for (the verifier page and the sidebar ask this first). */
    @GetMapping("/api/v1/profile-verification/access")
    public Map<String, Object> access(@RequestParam(required = false) Integer collegeId) {
        try {
            Integer c = service.verifierCollege(p(), collegeId);
            return Map.of("canVerify", true, "collegeId", c, "counts", service.counts(c));
        } catch (ProfileVerificationService.NotAllowed | IllegalArgumentException e) {
            return Map.of("canVerify", false, "reason", e.getMessage());
        }
    }

    @GetMapping("/api/v1/profile-verification/queue")
    public List<Map<String, Object>> queue(@RequestParam(required = false) Integer collegeId, @RequestParam(required = false) String status,
                                           @RequestParam(required = false) String section) {
        return guarded(() -> service.queue(service.verifierCollege(p(), collegeId), blankToNull(status), blankToNull(section)));
    }

    @GetMapping("/api/v1/profile-verification/students/{learnerId}")
    public Map<String, Object> student(@PathVariable Integer learnerId, @RequestParam(required = false) Integer collegeId) {
        return guarded(() -> service.student(service.verifierCollege(p(), collegeId), learnerId));
    }

    @PostMapping("/api/v1/profile-verification/students/{learnerId}/{section}/verify")
    public Map<String, Object> verify(@PathVariable Integer learnerId, @PathVariable String section, @RequestParam(required = false) Integer collegeId,
                                      @RequestParam(required = false) String seenSubmittedAt) {
        return guarded(() -> service.verify(p(), service.verifierCollege(p(), collegeId), learnerId, section, seenSubmittedAt));
    }

    public static class SendBackRequest { public String reason; }

    @PostMapping("/api/v1/profile-verification/students/{learnerId}/{section}/send-back")
    public Map<String, Object> sendBack(@PathVariable Integer learnerId, @PathVariable String section, @RequestParam(required = false) Integer collegeId,
                                        @RequestBody SendBackRequest body) {
        return guarded(() -> service.sendBack(p(), service.verifierCollege(p(), collegeId), learnerId, section, body == null ? null : body.reason));
    }

    public static class VerifyManyRequest { public List<Map<String, Object>> items; }

    @PostMapping("/api/v1/profile-verification/verify-many")
    public Map<String, Object> verifyMany(@RequestParam(required = false) Integer collegeId, @RequestBody VerifyManyRequest body) {
        return guarded(() -> service.verifyMany(p(), service.verifierCollege(p(), collegeId), body == null ? null : body.items));
    }

    @GetMapping("/api/v1/profile-verification/settings")
    public Map<String, Object> settings(@RequestParam(required = false) Integer collegeId) {
        return guarded(() -> service.settings(service.verifierCollegeOrAdmin(p(), collegeId)));
    }

    public static class SettingsRequest { public Boolean tpoCanVerify; }

    @PutMapping("/api/v1/profile-verification/settings")
    public Map<String, Object> saveSettings(@RequestParam(required = false) Integer collegeId, @RequestBody SettingsRequest body) {
        return guarded(() -> service.saveSettings(p(), service.verifierCollegeOrAdmin(p(), collegeId), body != null && Boolean.TRUE.equals(body.tpoCanVerify)));
    }

    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s.trim().toUpperCase(); }
}
