package com._42students.lms.service;

import com._42students.lms.model.ApplicationScreening;
import com._42students.lms.model.JobApplication;

/**
 * Service for screening job applications
 * Runs AFTER application is created
 * 
 * PHILOSOPHY:
 * - Screening decides who looks STRONG
 * - Humans decide who gets HIRED
 * - Screening is informational, not blocking
 */
public interface ScreeningService {

    /**
     * Screen an application
     * Runs after application is created
     * Compares learner profile against job requirements
     * 
     * @param application Application to screen
     * @return Screening result
     */
    ApplicationScreening screenApplication(JobApplication application);

    /**
     * Re-screen an application
     * Useful when screening logic changes
     *
     * 4.3: takes organizationId so this is scoped by construction rather than by the current
     * absence of any controller exposing it -- both this and getScreening previously took a bare
     * applicationId with no scope check at all, which would be an IDOR the day someone adds an
     * admin endpoint for either. Mirrors the scoping pattern PlacementJobServiceImpl already uses.
     *
     * @param applicationId Application ID to re-screen
     * @param organizationId Caller's organization -- the application must belong to it
     * @return Updated screening result
     */
    ApplicationScreening rescreenApplication(Integer applicationId, Integer organizationId);

    /**
     * Get screening result for an application
     *
     * 4.3: same scoping as rescreenApplication.
     *
     * @param applicationId Application ID
     * @param organizationId Caller's organization -- the application must belong to it
     * @return Screening result or null if not screened yet
     */
    ApplicationScreening getScreening(Integer applicationId, Integer organizationId);
}


