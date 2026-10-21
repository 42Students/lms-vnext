package com._42students.lms.service.tpo;

import com._42students.lms.model.Job;
import com._42students.lms.model.Learner;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Night audit 13 Oct 2026: a student applies only when registration, the drive's rules and the held-offer rules allow it. */
class ApplyGateTest {

    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final PlacementEligibilityService placements = mock(PlacementEligibilityService.class);
    private final BatchRegistrationService registration = mock(BatchRegistrationService.class);
    private final EligibilityService eligibility = mock(EligibilityService.class);
    private final PlacementCascadePolicy offers = mock(PlacementCascadePolicy.class);
    private final ApplyGate gate = new ApplyGate(jdbc, placements, registration, eligibility, offers);

    private Job job;
    private Learner learner;
    private final BatchRegistrationService.Window window = new BatchRegistrationService.Window();

    @BeforeEach
    void setUp() {
        job = new Job();
        job.setId(46);
        job.setCollegeId(6);
        job.setLifecycleStatus("PUBLISHED");
        learner = new Learner();
        learner.setId(159);
        learner.setCollegeId(6);
        learner.setDepartment("CSE");
        when(placements.collegeHasPlacements(6)).thenReturn(true);
        when(placements.learnerInPlacements(159, 6)).thenReturn(true);
        usesRegistration(true);
        applied(0);
        choice(null);
        when(registration.windowFor(159)).thenReturn(window);
        when(eligibility.evaluate(any(), anyInt(), any())).thenReturn(new EligibilityService.EligibilityResult(true, List.of(), false));
    }

    private void usesRegistration(boolean yes) {
        when(jdbc.queryForObject(contains("FROM placement_batch"), any(MapSqlParameterSource.class), eq(Integer.class))).thenReturn(yes ? 1 : 0);
    }

    /** n > 0: the student has an application from before their college first invited a batch (RegistrationRule). */
    private void applied(int n) {
        when(jdbc.queryForList(contains("FROM learner l"), any(MapSqlParameterSource.class), eq(String.class)))
                .thenReturn(n > 0 ? List.of("PLACEMENTS") : java.util.Collections.singletonList(null));
    }

    private void choice(String c) {
        when(jdbc.queryForList(contains("FROM placement_registration"), any(MapSqlParameterSource.class), eq(String.class))).thenReturn(c == null ? List.of() : List.of(c));
    }

    @Test
    void aRegisteredEligibleStudentMayApply() {
        choice("PLACEMENTS");
        assertTrue(gate.check(job, learner).open());
    }

    @Test
    void aDriveThatIsNotLiveTakesNoApplications() {
        job.setLifecycleStatus("DRAFT");
        assertEquals("DRIVE_CLOSED", gate.check(job, learner).code());
    }

    @Test
    void aStudentTheCollegeHasNotPutInPlacementsCannotApply() {
        when(placements.learnerInPlacements(159, 6)).thenReturn(false);
        assertEquals("NOT_IN_PLACEMENTS", gate.check(job, learner).code());
    }

    @Test
    void notRegisteredWhileRegistrationIsOpenSaysRegisterFirst() {
        window.invited = true;
        window.open = true;
        ApplyGate.Answer a = gate.check(job, learner);
        assertEquals("REGISTER_FIRST", a.code());
        assertEquals("REGISTER", a.action());
    }

    @Test
    void notRegisteredBeforeTheBatchIsInvitedSaysItHasNotOpened() {
        assertEquals("REGISTRATION_NOT_OPEN", gate.check(job, learner).code());
    }

    @Test
    void choosingHigherStudiesMeansNoApplications() {
        choice("HIGHER_STUDIES");
        assertEquals("CHOSE_OTHER", gate.check(job, learner).code());
    }

    @Test
    void aFinishedBatchCannotApply() {
        window.finished = true;
        assertEquals("BATCH_FINISHED", gate.check(job, learner).code());
    }

    @Test
    void aCollegeThatNeverUsedRegistrationWorksAsBefore() {
        usesRegistration(false);
        assertTrue(gate.check(job, learner).open());
    }

    @Test
    void aStudentWhoAlreadyAppliedCountsAsRegistered() {
        applied(1);
        assertTrue(gate.check(job, learner).open());
    }

    @Test
    void onlyAnApplicationFromBeforeRegistrationStartedCounts() {
        // owner, 19 Oct 2026: applying (or being applied for) after the college's first invite registers nobody
        assertTrue(RegistrationRule.APPLIED_EARLIER.contains("ax.applied_at < COALESCE((SELECT MIN(pbx.invited_at)"));
        assertTrue(RegistrationRule.APPLIED_EARLIER.contains("ax.applied_at IS NULL"), "old rows without a time count as before");
        window.invited = true;
        window.open = true;
        applied(0); // the student's only application is from after the first invite
        assertEquals("REGISTER_FIRST", gate.check(job, learner).code());
    }

    @Test
    void theDrivesOwnRulesAreChecked() {
        choice("PLACEMENTS");
        when(eligibility.evaluate(any(), anyInt(), any())).thenReturn(new EligibilityService.EligibilityResult(false,
                List.of(new EligibilityService.RuleCheck("Branch", true, "Eligible"), new EligibilityService.RuleCheck("CGPA", false, "6.8 (min 7)")), false));
        ApplyGate.Answer a = gate.check(job, learner);
        assertEquals("RULES", a.code());
        assertEquals("You don't meet this drive's rules (CGPA: 6.8 (min 7)).", a.reason());
    }

    @Test
    void heldOffersFollowTheCollegesRules() {
        choice("PLACEMENTS");
        when(offers.applyBlockedReason(159, job)).thenReturn("You already hold an offer.");
        assertEquals("HELD_OFFER", gate.check(job, learner).code());
    }

    @Test
    void aCollegeWithoutThePlacementsModuleIsNotGatedByIt() {
        when(placements.collegeHasPlacements(6)).thenReturn(false);
        when(placements.learnerInPlacements(159, 6)).thenReturn(false);
        choice("PLACEMENTS");
        assertTrue(gate.check(job, learner).open());
    }

    @Test
    void aStudentWhoAppliedAndThenChoseHigherStudiesCannotApplyAgain() {
        applied(1);
        choice("HIGHER_STUDIES");
        assertEquals("CHOSE_OTHER", gate.check(job, learner).code());
    }

    @Test
    void aFinishedBatchIsClosedEvenForSomeoneWhoAppliedBefore() {
        applied(1);
        window.finished = true;
        assertEquals("BATCH_FINISHED", gate.check(job, learner).code());
    }
}
