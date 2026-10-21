package com._42students.lms.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

/** State-machine invariants; service-level persistence and authorization require separate tests. */
class JobApplicationStatusValidatorRegressionTest {
    @Test void appliedCanAdvanceToShortlisted() {
        assertTrue(JobApplicationStatusValidator.isValidTransition("APPLIED", "SHORTLISTED"));
    }

    @Test void appliedCannotJumpDirectlyToHired() {
        assertFalse(JobApplicationStatusValidator.isValidTransition("APPLIED", "HIRED"));
    }

    @Test void shortlistedCanReturnToAppliedForCorrection() {
        assertTrue(JobApplicationStatusValidator.isValidTransition("SHORTLISTED", "APPLIED"));
    }

    @Test void shortlistedCanAdvanceToAssessment() {
        assertTrue(JobApplicationStatusValidator.isValidTransition("SHORTLISTED", "ASSESSMENT"));
    }

    @Test void assessmentCanAdvanceToInterview() {
        assertTrue(JobApplicationStatusValidator.isValidTransition("ASSESSMENT", "INTERVIEW"));
    }

    @Test void assessmentCannotSkipStraightToOffer() {
        assertFalse(JobApplicationStatusValidator.isValidTransition("ASSESSMENT", "OFFERED"));
    }

    @Test void interviewCanWaitlistCandidate() {
        assertTrue(JobApplicationStatusValidator.isValidTransition("INTERVIEW", "WAITLISTED"));
    }


    @Test void shortlistedCanMoveToWaitlist() {
        assertTrue(JobApplicationStatusValidator.isValidTransition("SHORTLISTED", "WAITLISTED"));
    }

    @Test void assessmentCanMoveToWaitlist() {
        assertTrue(JobApplicationStatusValidator.isValidTransition("ASSESSMENT", "WAITLISTED"));
    }

    @Test void waitlistedCandidateCanWithdrawBeforeAProtectedScheduledRound() {
        assertTrue(JobApplicationStatusValidator.isValidTransition("WAITLISTED", "WITHDRAWN"));
    }

    @Test void waitlistedCandidateCanReceiveOffer() {
        assertTrue(JobApplicationStatusValidator.isValidTransition("WAITLISTED", "OFFERED"));
    }

    @Test void waitlistedCandidateCannotBeHiredWithoutOffer() {
        assertFalse(JobApplicationStatusValidator.isValidTransition("WAITLISTED", "HIRED"));
    }

    @Test void offeredCandidateCanBeHired() {
        assertTrue(JobApplicationStatusValidator.isValidTransition("OFFERED", "HIRED"));
    }

    @Test void mistakenHireCanBeCorrectedToOffered() {
        assertTrue(JobApplicationStatusValidator.isValidTransition("HIRED", "OFFERED"));
    }

    @Test void hiredCandidateCannotBeSilentlyRejected() {
        assertFalse(JobApplicationStatusValidator.isValidTransition("HIRED", "REJECTED"));
    }

    @Test void withdrawnCandidateHasNoOrdinaryOutgoingTransitions() {
        assertEquals(List.of(), JobApplicationStatusValidator.getValidNextStatuses("WITHDRAWN"));
        assertFalse(JobApplicationStatusValidator.isValidTransition("WITHDRAWN", "APPLIED"));
    }

    @Test void rejectedCandidateCanReapply() {
        assertTrue(JobApplicationStatusValidator.isValidTransition("REJECTED", "APPLIED"));
    }

    @Test void unknownStatusCannotTransitionToApplied() {
        assertFalse(JobApplicationStatusValidator.isValidTransition("UNKNOWN", "APPLIED"));
        assertEquals(List.of(), JobApplicationStatusValidator.getValidNextStatuses("UNKNOWN"));
    }

    @Test void nullStatusesAreNeverAccepted() {
        assertFalse(JobApplicationStatusValidator.isValidTransition(null, "APPLIED"));
        assertFalse(JobApplicationStatusValidator.isValidTransition("APPLIED", null));
    }

    @Test void invalidTransitionThrowsWithSourceAndTarget() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> JobApplicationStatusValidator.validateTransition("APPLIED", "HIRED"));
        assertTrue(error.getMessage().contains("APPLIED"));
        assertTrue(error.getMessage().contains("HIRED"));
    }

    @Test void validTransitionDoesNotThrow() {
        JobApplicationStatusValidator.validateTransition("OFFERED", "HIRED");
    }

    @Test void currentStatusLookupIgnoresCase() {
        assertEquals(JobApplicationStatusValidator.getValidNextStatuses("APPLIED"),
                JobApplicationStatusValidator.getValidNextStatuses("applied"));
    }

    @Test void transitionAcceptsCaseInsensitiveStatusNames() {
        assertTrue(JobApplicationStatusValidator.isValidTransition("applied", "shortlisted"));
    }

    // TPO V1 (docs/recruiter-tpo-flows/TPO V1 - Locked.docx): a multi-round drive can put a test round
    // after an interview round (e.g. GD -> Interview -> coding test), so the coarse status
    // bucket must allow moving back to ASSESSMENT from INTERVIEW.
    @Test void interviewCanMoveBackToAssessmentForALaterTestRound() {
        assertTrue(JobApplicationStatusValidator.isValidTransition("INTERVIEW", "ASSESSMENT"));
    }
}
