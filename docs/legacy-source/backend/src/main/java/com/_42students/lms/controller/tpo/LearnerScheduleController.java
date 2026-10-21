package com._42students.lms.controller.tpo;

import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.TpoScheduleService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** The student's view of their own round schedule: see it, confirm a changed slot, ask to reschedule. */
@RestController
@RequestMapping("/api/v1/learner/schedule")
@RequiredArgsConstructor
public class LearnerScheduleController {

    private final TpoScheduleService schedule;
    private final SecurityContextUtil securityContextUtil;

    /**
     * Learners only. Every query below treats the caller's id as a learner id, and learner and faculty
     * ids come from separate tables, so a faculty/admin token whose id equals some learner's id would
     * otherwise read, confirm and reschedule that learner's rounds.
     */
    private UserPrincipal p() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null || !principal.isLearner()) {
            throw new org.springframework.security.access.AccessDeniedException("Only students have a placement schedule");
        }
        return principal;
    }

    @GetMapping
    public List<Map<String, Object>> mine() { return schedule.assignmentsForLearner(p().getId()); }

    @PostMapping("/rounds/{roundId}/confirm")
    public Map<String, Object> confirm(@PathVariable Long roundId) { schedule.studentConfirm(p().getId(), roundId); return Map.of("ok", true); }

    @PostMapping("/rounds/{roundId}/reschedule-request")
    public Map<String, Object> reschedule(@PathVariable Long roundId, @RequestBody Map<String, String> body) {
        schedule.requestReschedule(p().getId(), roundId, body.get("reason"), body.get("preferredTimes"));
        return Map.of("ok", true);
    }
}
