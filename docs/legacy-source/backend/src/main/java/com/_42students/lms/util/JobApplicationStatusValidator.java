package com._42students.lms.util;

import java.util.*;

/**
 * Utility class for validating job application status transitions.
 * Ensures status changes follow a valid state machine.
 */
public class JobApplicationStatusValidator {
    
    /**
     * Valid status transitions map
     * Key: current status, Value: list of valid next statuses
     */
    private static final Map<String, List<String>> VALID_TRANSITIONS = new HashMap<>();
    
    static {
        // APPLIED can transition to SHORTLISTED, REJECTED, or WITHDRAWN (learner withdraws)
        VALID_TRANSITIONS.put("APPLIED", Arrays.asList("SHORTLISTED", "REJECTED", "WITHDRAWN"));

        // SHORTLISTED can transition to ASSESSMENT, INTERVIEW, REJECTED, WITHDRAWN, or back to APPLIED
        // WAITLISTED is allowed from any round (TPO V1): a ranked waitlist can start after a test, not only after an interview.
        VALID_TRANSITIONS.put("SHORTLISTED", Arrays.asList("ASSESSMENT", "INTERVIEW", "REJECTED", "APPLIED", "WITHDRAWN", "WAITLISTED"));

        // ASSESSMENT can transition to INTERVIEW (passed), REJECTED (failed), or WITHDRAWN
        VALID_TRANSITIONS.put("ASSESSMENT", Arrays.asList("INTERVIEW", "REJECTED", "WITHDRAWN", "WAITLISTED"));

        // INTERVIEW can transition to SHORTLISTED, OFFERED, WAITLISTED, REJECTED, or WITHDRAWN.
        // ASSESSMENT is also allowed here (TPO V1, docs/recruiter-tpo-flows): multi-round drives can put
        // a test round after an interview round (e.g. GD -> Interview -> Coding test); the coarse
        // status bucket just needs to allow moving back to the ASSESSMENT bucket for that case.
        VALID_TRANSITIONS.put("INTERVIEW", Arrays.asList("SHORTLISTED", "ASSESSMENT", "OFFERED", "WAITLISTED", "REJECTED", "WITHDRAWN"));

        // OFFERED can transition to HIRED, REJECTED, WITHDRAWN, or back to INTERVIEW
        VALID_TRANSITIONS.put("OFFERED", Arrays.asList("HIRED", "REJECTED", "INTERVIEW", "WITHDRAWN"));

        // WAITLISTED: a strong candidate held pending offer capacity (e.g. company extended fewer
        // offers than qualified finalists). Moves to OFFERED when capacity frees up, or REJECTED
        // if it doesn't.
        VALID_TRANSITIONS.put("WAITLISTED", Arrays.asList("OFFERED", "REJECTED", "WITHDRAWN"));

        // REJECTED can transition back to APPLIED (reapplication)
        VALID_TRANSITIONS.put("REJECTED", Arrays.asList("APPLIED"));

        // JP-02: WITHDRAWN is a formal terminal state — learner-initiated; no further transitions
        // NOTE: JobServiceImpl.applyToJob's reactivation branch intentionally bypasses this
        // validator and re-applies its OWN gate (statusBeforeWithdrawal-based) for the
        // WITHDRAWN->APPLIED reapplication case — this is NOT an oversight, do not "fix" by
        // wiring this transition into the map without also auditing that gate.
        VALID_TRANSITIONS.put("WITHDRAWN", Collections.emptyList());

        // HIRED used to be a true dead end with zero correction path anywhere in the codebase —
        // a mis-click (single or via the 100-row bulk-update endpoint) could never be reversed
        // through the app, even though it had already fired a "you're hired" notification and
        // could carry an offer letter. Allowing a reversal back to OFFERED gives admins an
        // explicit, auditable way to undo a mistaken hire without a manual database fix.
        VALID_TRANSITIONS.put("HIRED", Arrays.asList("OFFERED"));
    }
    
    /**
     * Validates if a status transition is allowed.
     * 
     * @param currentStatus The current application status
     * @param newStatus The desired new status
     * @return true if transition is valid, false otherwise
     */
    public static boolean isValidTransition(String currentStatus, String newStatus) {
        if (currentStatus == null || newStatus == null) {
            return false;
        }
        
        // Same status is always valid (no-op)
        if (currentStatus.equals(newStatus)) {
            return true;
        }
        
        List<String> validNextStatuses = VALID_TRANSITIONS.get(currentStatus.toUpperCase());
        if (validNextStatuses == null) {
            return false;
        }
        
        return validNextStatuses.contains(newStatus.toUpperCase());
    }
    
    /**
     * Gets all valid next statuses for a given current status.
     * 
     * @param currentStatus The current application status
     * @return List of valid next statuses
     */
    public static List<String> getValidNextStatuses(String currentStatus) {
        if (currentStatus == null) {
            return Collections.emptyList();
        }
        
        return VALID_TRANSITIONS.getOrDefault(currentStatus.toUpperCase(), Collections.emptyList());
    }
    
    /**
     * Validates and throws exception if transition is invalid.
     * 
     * @param currentStatus The current application status
     * @param newStatus The desired new status
     * @throws IllegalArgumentException if transition is invalid
     */
    public static void validateTransition(String currentStatus, String newStatus) {
        if (!isValidTransition(currentStatus, newStatus)) {
            List<String> validNextStatuses = getValidNextStatuses(currentStatus);
            throw new IllegalArgumentException(
                String.format("Invalid status transition from %s to %s. Valid transitions from %s are: %s",
                    currentStatus, newStatus, currentStatus, validNextStatuses));
        }
    }
}



