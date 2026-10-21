package com._42students.lms.service;

/**
 * Service to increment JWT token version for a user, invalidating all existing tokens.
 * Call this on password change, role/tenant change, or "revoke all sessions".
 */
public interface TokenVersionService {

    /**
     * Increment token version for the given learner. All existing JWTs for this learner will be rejected.
     * @return new token version, or null if learner not found
     */
    Integer incrementTokenVersionForLearner(int learnerId);

    /**
     * Increment token version for the given faculty. All existing JWTs for this faculty will be rejected.
     * @return new token version, or null if faculty not found
     */
    Integer incrementTokenVersionForFaculty(int facultyId);

    /**
     * Increment token version for the given recruiter (industry) identity. All its JWTs will be rejected.
     * @return new token version, or null if the recruiter identity is not found
     */
    Integer incrementTokenVersionForRecruiter(int recruiterId);

    /**
     * Increment token version for the user by id and type.
     * @param userId   learner, faculty or recruiter id
     * @param userType "LEARNER", "FACULTY" or "recruiter"; anything else returns null
     * @return new token version, or null if user not found or the type is unknown
     */
    Integer incrementTokenVersion(int userId, String userType);
}

