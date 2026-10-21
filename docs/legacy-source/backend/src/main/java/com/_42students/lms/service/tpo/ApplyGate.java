package com._42students.lms.service.tpo;

import com._42students.lms.model.Job;
import com._42students.lms.model.Learner;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Whether a student may apply to a drive, and if not, why, in words the student can act on (night audit 13 Oct 2026).
 *
 * The older apply endpoint checked only the deadline and the drive's targeting, so a student who had not registered for
 * placements, failed the drive's own rules (CGPA, branch, batch...) or held an offer the college's rules count against them
 * could still apply. The drive page now asks this same gate first, so the button and the server always agree.
 *
 * In order: the drive is open; the student is in placements (where the college uses the placements module); they registered
 * for Placements (only where the college uses registration: it has invited at least one batch, so colleges that never did keep
 * working as before; an application from before registration existed counts as registered, RegistrationRule); their batch hasn't finished; the
 * drive's rules; the college's held-offer rules.
 */
@Service
@RequiredArgsConstructor
public class ApplyGate {

    public static final String OPEN = "OPEN";

    private final NamedParameterJdbcTemplate jdbc;
    private final PlacementEligibilityService placementEligibility;
    private final BatchRegistrationService registration;
    private final EligibilityService eligibility;
    private final PlacementCascadePolicy offers;

    /** code: OPEN, or why not (DRIVE_CLOSED, NOT_IN_PLACEMENTS, REGISTER_FIRST, REGISTRATION_NOT_OPEN, CHOSE_OTHER, BATCH_FINISHED, RULES, HELD_OFFER). */
    public record Answer(String code, String reason, String action) {
        public boolean open() { return OPEN.equals(code); }

        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("canApply", open());
            m.put("code", code);
            m.put("reason", reason);
            m.put("action", action);
            return m;
        }
    }

    private static Answer no(String code, String reason, String action) {
        return new Answer(code, reason, action);
    }

    public Answer check(Job job, Learner learner) {
        Integer learnerId = learner.getId();
        if (!"PUBLISHED".equals(job.getLifecycleStatus())) return no("DRIVE_CLOSED", "This drive isn't taking applications.", null);
        Integer collegeId = job.getCollegeId() != null ? job.getCollegeId() : learner.getCollegeId();

        if (collegeId != null && placementEligibility.collegeHasPlacements(collegeId) && !placementEligibility.learnerInPlacements(learnerId, collegeId)) {
            return no("NOT_IN_PLACEMENTS", "You aren't in placements yet. Your placement cell decides who takes part; ask them if you think you should be.", null);
        }

        if (collegeId != null && collegeUsesRegistration(collegeId)) {
            String choice = latestChoice(learnerId);
            BatchRegistrationService.Window w = registration.windowFor(learnerId);
            if (w.finished) return no("BATCH_FINISHED", "Your batch has finished placements.", null);
            // An explicit choice always counts, even for a student who applied before (they may have switched to higher studies).
            if (choice != null && !"PLACEMENTS".equals(choice)) {
                return no("CHOSE_OTHER", "You told the placement cell you're not taking part in placements. Change that in Placement cell to apply.", "REGISTER");
            }
            // No choice yet: an application from before registration existed counts as having chosen Placements (RegistrationRule).
            if (choice == null && !appliedBeforeRegistration(learnerId)) {
                return w.open
                        ? no("REGISTER_FIRST", "Register for placements first. It takes a minute, and then you can apply.", "REGISTER")
                        : no("REGISTRATION_NOT_OPEN", "Registration for placements hasn't opened for your batch yet. You can apply once the placement cell invites your batch and you register.", null);
            }
        }

        EligibilityService.EligibilityResult rules = eligibility.evaluate(job, learnerId, learner.getDepartment());
        if (!rules.eligible) {
            String failing = rules.checks == null ? null : rules.checks.stream().filter(c -> !c.pass).findFirst()
                    .map(c -> c.rule + (c.detail == null || c.detail.isBlank() ? "" : ": " + c.detail)).orElse(null);
            return no("RULES", "You don't meet this drive's rules" + (failing == null ? "." : " (" + failing + ")."), null);
        }

        String held = offers.applyBlockedReason(learnerId, job);
        if (held != null) return no("HELD_OFFER", held, "RULES");
        return new Answer(OPEN, null, null);
    }

    /** The college has invited at least one batch to register: it runs registration, so it applies to everyone. */
    boolean collegeUsesRegistration(Integer collegeId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM placement_batch pb JOIN batch b ON b.id = pb.batch_id JOIN new_program p ON p.id = b.program_id " +
                "JOIN department d ON d.id = p.dept_id WHERE d.college_id = :c AND pb.invited_at IS NOT NULL", new MapSqlParameterSource("c", collegeId), Integer.class);
        return n != null && n > 0;
    }

    /** RegistrationRule: an application of theirs predates their college's first registration invite. */
    private boolean appliedBeforeRegistration(Integer learnerId) {
        List<String> c = jdbc.queryForList("SELECT " + RegistrationRule.APPLIED_EARLIER + " FROM learner l WHERE l.id = :l",
                new MapSqlParameterSource("l", learnerId), String.class);
        return !c.isEmpty() && "PLACEMENTS".equals(c.get(0));
    }

    private String latestChoice(Integer learnerId) {
        List<String> c = jdbc.queryForList("SELECT choice FROM placement_registration WHERE learner_id = :l ORDER BY id DESC LIMIT 1",
                new MapSqlParameterSource("l", learnerId), String.class);
        return c.isEmpty() ? null : c.get(0);
    }
}
