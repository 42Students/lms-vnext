package com._42students.lms.service.impl;

import com._42students.lms.dto.profile.SkillDTO;
import com._42students.lms.model.*;
import com._42students.lms.repository.*;
import com._42students.lms.service.ScreeningService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Screening Service Implementation (v1)
 * 
 * Screens applications based on:
 * - Skills matching
 * - Education matching
 * - Calculates overall score (0.0 to 1.0)
 * 
 * FAIRNESS RULE:
 * If a preference is NOT defined on the job OR learner profile data is missing,
 * that attribute is excluded from scoring, NOT scored as 0.
 * This prevents unfair penalties.
 * 
 * FUTURE: Can be enhanced with AI-based screening
 */
@Slf4j
@Service
public class ScreeningServiceImpl implements ScreeningService {

    @Autowired
    private ApplicationScreeningRepository screeningRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private LearnerRepository learnerRepository;

    @Autowired
    private QualificationRepository qualificationRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String DEFAULT_SCREENING_VERSION = "v1";

    /**
     * Screen an application
     * Runs after application is created
     * 
     * PREVENTS MIXED LOGIC SCORING:
     * - Uses job.screeningVersion to ensure all applications under a job share the same version
     * - Prevents sorting across different scoring logic versions
     */
    @Override
    @Transactional
    public ApplicationScreening screenApplication(JobApplication application) {
        log.info("Screening application {} for job {} (Status will be updated to COMPLETED or FAILED)", 
                application.getId(), application.getJob().getId());

        Job job = application.getJob();
        Learner learner = application.getLearner();

        // PREVENTS MIXED LOGIC SCORING: Get screening version from job
        // Ensures all applications under a job share the same screening version
        String jobScreeningVersion = job.getScreeningVersion();
        if (jobScreeningVersion == null || jobScreeningVersion.trim().isEmpty()) {
            // Fallback to default if job version not set (shouldn't happen after migration)
            jobScreeningVersion = DEFAULT_SCREENING_VERSION;
            log.warn("Job {} has no screening_version set, using default: {}", job.getId(), DEFAULT_SCREENING_VERSION);
        }

        try {
            // SCREENING STATE EXPLICIT: Get or create screening result
            // If created in applyToJob, status is already PENDING
            ApplicationScreening screening = screeningRepository.findByApplicationId(application.getId())
                    .orElseGet(() -> {
                        // Create new if doesn't exist (shouldn't happen if applyToJob called createPendingScreening)
                        ApplicationScreening newScreening = new ApplicationScreening();
                        newScreening.setApplication(application);
                        newScreening.setScreeningStatus("PENDING");
                        return newScreening;
                    });

            // Item 8 of the placements re-audit: screenedBy/screeningMethod are documented as
            // "NON-NEGOTIABLE AUDITABILITY" / "IMMUTABLE once set" but were never actually
            // populated anywhere. Set them once, on first screening, matching the doc comment's
            // own examples ("SYSTEM" for automated screening, "AUTOMATED_V1" as this class's
            // scoring approach — the v1 simple-average logic above). Guarded so a re-screen never
            // overwrites the original audit trail.
            if (screening.getScreenedBy() == null) {
                screening.setScreenedBy("SYSTEM");
            }
            if (screening.getScreeningMethod() == null) {
                screening.setScreeningMethod("AUTOMATED_V1");
            }
            
            // PREVENTS MIXED LOGIC SCORING: Use job's screening version
            // Ensures all applications under a job are scored with the same logic
            screening.setScreeningVersion(jobScreeningVersion);
            screening.setScreenedAt(LocalDateTime.now());
            // SCREENING STATE EXPLICIT: Status will be set to COMPLETED after successful screening

            // Calculate skill score
            double skillScore = calculateSkillScore(job, learner);
            screening.setSkillScore(skillScore);

            // Calculate education score. calculateEducationScore also reports how many of the
            // job's specific preference factors (preferredDegree/preferredSpecialization/
            // preferredGpa/preferredGraduationYear) actually had matching learner data to
            // evaluate — that count (not just "learner has some qualification row") is what
            // decides below whether this score is safe to include in the overall average.
            EducationScoreResult educationResult = calculateEducationScore(job, learner);
            double educationScore = educationResult.getScore();
            screening.setEducationScore(educationResult.getFactorsEvaluated() > 0 ? educationScore : null);

            // TRUST & FAIRNESS: Track excluded attributes and missing data
            Map<String, String> excludedAttributes = new HashMap<>();
            boolean isPartialScore = false;

            // Calculate overall score (weighted average)
            // FAIRNESS RULE: Only include scores for attributes that are defined
            // v1: Simple average of available scores
            // FUTURE: Use job.evaluationConfig for custom weights
            int scoreCount = 0;
            double totalScore = 0.0;
            
            // TRUST & FAIRNESS: Check skills preference and track exclusions
            List<String> preferredSkills = getPreferredSkills(job);
            boolean skillsIncluded = false;
            if (preferredSkills != null && !preferredSkills.isEmpty()) {
                // Check if learner has skills data
                List<SkillDTO> learnerSkills = learner.getSkills();
                if (learnerSkills != null && !learnerSkills.isEmpty()) {
                    // Skills preference defined AND learner has skills → include in scoring
                    totalScore += skillScore;
                    scoreCount++;
                    skillsIncluded = true;
                } else {
                    // Skills preference defined BUT learner has NO skills → exclude (missing data)
                    excludedAttributes.put("excludedSkills", "Learner profile has no skills data");
                    isPartialScore = true;
                }
            } else {
                // No skills preference defined → exclude (not defined)
                excludedAttributes.put("excludedSkills", "Job has no preferred skills defined");
            }
            
            // TRUST & FAIRNESS: Check education preferences and track exclusions
            Map<String, Object> preferences = getCandidatePreferences(job);
            boolean educationIncluded = false;
            if (preferences != null && !preferences.isEmpty() && hasEducationPreferences(preferences)) {
                // CRITICAL FIX: "learner has some qualification row" is not the same thing as
                // "the education score actually reflects evaluated data" — calculateEducationScore
                // can return its factors==0 sentinel (score 1.0, i.e. "nothing evaluated") even
                // when the learner has qualification rows, if none of them had data for THIS
                // job's specific preferredDegree/preferredSpecialization/preferredGpa/
                // preferredGraduationYear criteria (e.g. only a 12th-grade record with no program
                // set, or no GPA data, for a job that only asks about preferredDegree/preferredGpa).
                // Re-checking factorsEvaluated here (the actual evaluation outcome) instead of
                // just "has some qualification row" prevents crediting a learner with a perfect
                // 100% education match despite there being nothing to evaluate — the exact bug
                // the module's own FAIRNESS RULE comment says must not happen.
                if (educationResult.getFactorsEvaluated() > 0) {
                    // Education preference defined AND at least one factor was actually evaluated → include in scoring
                    totalScore += educationScore;
                    scoreCount++;
                    educationIncluded = true;
                } else {
                    // Education preference defined BUT learner has no data matching any of this
                    // job's specific education criteria → exclude (missing data)
                    excludedAttributes.put("excludedEducation", "Learner profile has no data matching this job's education criteria");
                    isPartialScore = true;
                }
            } else {
                // No education preferences defined → exclude (not defined)
                excludedAttributes.put("excludedEducation", "Job has no education preferences defined");
            }

            // TRUST & FAIRNESS: Track individual education attribute exclusions
            if (preferences != null && !preferences.isEmpty()) {
                List<Qualification> qualifications = qualificationRepository.findByLearnerId(learner.getId());
                boolean hasQualifications = qualifications != null && !qualifications.isEmpty();
                
                if (preferences.containsKey("preferredDegree") && (!hasQualifications || 
                        qualifications.stream().noneMatch(q -> q.getProgram() != null))) {
                    excludedAttributes.put("excludedDegree", "Learner profile has no degree/program data");
                    isPartialScore = true;
                }
                
                if (preferences.containsKey("preferredGpa")) {
                    boolean hasGpaData = hasQualifications && qualifications.stream()
                            .anyMatch(q -> q.getGrade() != null && q.getGradingType() != null &&
                                    ("CGPA".equalsIgnoreCase(q.getGradingType()) || "GPA".equalsIgnoreCase(q.getGradingType())));
                    if (!hasGpaData) {
                        excludedAttributes.put("excludedGpa", "Learner profile has no GPA/CGPA data");
                        isPartialScore = true;
                    }
                }
            }
            
            // Calculate overall score: average of included scores. A job with no candidate
            // preferences at all (a legitimate, common state) previously landed here with
            // scoreCount==0 and got overallScore=0.0 — indistinguishable from "evaluated and
            // failed every criterion", which silently made minScore filters return zero results
            // and score-sort ties every applicant at the bottom, for a job that never actually
            // defined what a good match looks like. null means "not evaluated", matching the
            // same fairness rule already applied per-attribute above.
            if (scoreCount > 0) {
                screening.setOverallScore(totalScore / scoreCount);
            } else {
                screening.setOverallScore(null);
                isPartialScore = true;
            }

            // TRUST & FAIRNESS: Mark score as partial if any exclusions exist
            screening.setIsPartialScore(isPartialScore);
            screening.setExcludedAttributes(excludedAttributes.isEmpty() ? null : excludedAttributes);

            // Store matched and missing skills
            List<String> matchedSkills = findMatchedSkills(job, learner);
            List<String> missingSkills = findMissingSkills(job, learner);
            screening.setMatchedSkills(matchedSkills);
            screening.setMissingSkills(missingSkills);

            // TRUST & FAIRNESS: Generate human-readable explanation with exclusion details
            String explanation = generateExplanation(screening, job, learner, excludedAttributes, isPartialScore);
            screening.setExplanation(explanation);

            // SCREENING STATE EXPLICIT: Update status to COMPLETED after successful screening
            screening.setScreeningStatus("COMPLETED");

            screening = screeningRepository.save(screening);
            log.info("Screening completed for application {}: Overall score = {}, Status = COMPLETED",
                    application.getId(), screening.getOverallScore());
            
            return screening;

        } catch (Exception e) {
            // SCREENING STATE EXPLICIT: Mark as FAILED if any exception occurs during screening
            log.error("Screening failed for application {}: {}", application.getId(), e.getMessage(), e);
            
            ApplicationScreening screening = screeningRepository.findByApplicationId(application.getId())
                    .orElseGet(() -> {
                        ApplicationScreening newScreening = new ApplicationScreening();
                        newScreening.setApplication(application);
                        return newScreening;
                    });
            
            screening.setScreeningStatus("FAILED");
            screening.setExplanation("Screening failed: " + e.getMessage());
            screening = screeningRepository.save(screening);
            
            throw new RuntimeException("Screening failed for application " + application.getId() + ": " + e.getMessage(), e);
        }
    }

    /**
     * Calculate skill match score (0.0 to 1.0)
     * 
     * FAIRNESS RULE: If no preferred skills defined, exclude from scoring (return null equivalent via 1.0)
     * If preferred skills defined but learner has no skills, score as 0.0
     */
    private double calculateSkillScore(Job job, Learner learner) {
        // Get preferred skills from job
        List<String> preferredSkills = getPreferredSkills(job);
        if (preferredSkills == null || preferredSkills.isEmpty()) {
            // No skills preference defined = exclude from scoring (return 1.0 to not affect average)
            return 1.0;
        }

        // Get learner skills
        List<SkillDTO> learnerSkills = learner.getSkills();
        if (learnerSkills == null || learnerSkills.isEmpty()) {
            // Preferred skills defined but learner has none = score 0.0
            return 0.0;
        }

        // Normalize skill names for comparison
        Set<String> learnerSkillNames = learnerSkills.stream()
                .map(skill -> skill.getSkill() != null ? skill.getSkill().toLowerCase().trim() : "")
                .filter(name -> !name.isEmpty())
                .collect(Collectors.toSet());

        Set<String> preferredSkillNames = preferredSkills.stream()
                .map(skill -> skill != null ? skill.toLowerCase().trim() : "")
                .filter(name -> !name.isEmpty())
                .collect(Collectors.toSet());

        // Count matches
        long matches = preferredSkillNames.stream()
                .filter(learnerSkillNames::contains)
                .count();

        // Score = matches / total preferred skills
        return preferredSkillNames.isEmpty() ? 0.0 : (double) matches / preferredSkillNames.size();
    }

    /**
     * Result of {@link #calculateEducationScore(Job, Learner)}: the raw 0.0-1.0 score AND how
     * many of the job's specific preference factors actually had learner data to evaluate.
     * Callers MUST check factorsEvaluated > 0 before trusting/including score — when it's 0,
     * score is the "nothing evaluated" sentinel (1.0) and must not be treated as a real match.
     */
    private static final class EducationScoreResult {
        private final double score;
        private final int factorsEvaluated;

        private EducationScoreResult(double score, int factorsEvaluated) {
            this.score = score;
            this.factorsEvaluated = factorsEvaluated;
        }

        private double getScore() {
            return score;
        }

        private int getFactorsEvaluated() {
            return factorsEvaluated;
        }
    }

    /**
     * Calculate education match score (0.0 to 1.0)
     *
     * FAIRNESS RULE: Only check preferences that are defined AND where learner has data
     * If a preference is defined but learner data is missing, exclude that factor (don't score as 0)
     *
     * Returns an EducationScoreResult rather than a bare double: the factorsEvaluated count is
     * how callers must distinguish "learner scored a perfect 1.0 on the job's actual criteria"
     * from "nothing was evaluable, so the sentinel 1.0 came out" — collapsing that distinction
     * into a bare double previously let the "nothing evaluated" case get silently averaged into
     * overallScore as if it were a real perfect match (CRITICAL fairness bug).
     */
    private EducationScoreResult calculateEducationScore(Job job, Learner learner) {
        double score = 0.0;
        int factors = 0;

        // Get candidate preferences
        Map<String, Object> preferences = getCandidatePreferences(job);
        if (preferences == null || preferences.isEmpty()) {
            // No education preferences = exclude from scoring
            return new EducationScoreResult(1.0, 0);
        }

        // Get learner qualifications
        List<Qualification> qualifications = qualificationRepository.findByLearnerId(learner.getId());
        boolean hasQualifications = qualifications != null && !qualifications.isEmpty();

        // Check degree match (only if preference defined AND learner has a qualification with a
        // program set). This used to increment factors whenever the learner had ANY qualification
        // row at all — a learner with only a 12th-grade record (program null) still counted as
        // "evaluated" and scored 0 for this factor, contradicting the documented fairness rule
        // that missing data should be excluded, not scored as 0.
        if (preferences.containsKey("preferredDegree")) {
            boolean hasProgramData = hasQualifications && qualifications.stream().anyMatch(q -> q.getProgram() != null);
            if (hasProgramData) {
                factors++;
                String preferredDegree = String.valueOf(preferences.get("preferredDegree")).trim();
                boolean hasDegree = qualifications.stream()
                        .anyMatch(q -> q.getProgram() != null && preferredDegree.equalsIgnoreCase(q.getProgram()));
                if (hasDegree) {
                    score += 1.0;
                }
            }
            // If no program data, exclude this factor (don't count as 0)
        }

        // Check specialization match (only if preference defined AND learner has qualifications)
        if (preferences.containsKey("preferredSpecialization")) {
            if (hasQualifications) {
                factors++;
                String preferredSpecialization = String.valueOf(preferences.get("preferredSpecialization")).trim();
                boolean hasSpecialization = qualifications.stream()
                        .anyMatch(q -> q.getSpecialization() != null && preferredSpecialization.equalsIgnoreCase(q.getSpecialization()));
                if (hasSpecialization) {
                    score += 1.0;
                }
            }
            // If no qualifications, exclude this factor (don't count as 0)
        }

        // Check GPA match (only if preference defined AND learner has GPA data)
        if (preferences.containsKey("preferredGpa")) {
            if (hasQualifications) {
                boolean hasGpaData = qualifications.stream()
                        .anyMatch(q -> q.getGrade() != null && q.getGradingType() != null &&
                                ("CGPA".equalsIgnoreCase(q.getGradingType()) || "GPA".equalsIgnoreCase(q.getGradingType())));
                if (hasGpaData) {
                    factors++;
                    try {
                        double preferredGpa = Double.parseDouble(String.valueOf(preferences.get("preferredGpa")));
                        boolean meetsGpa = qualifications.stream()
                                .filter(q -> q.getGrade() != null && q.getGradingType() != null)
                                .anyMatch(q -> {
                                    try {
                                        if ("CGPA".equalsIgnoreCase(q.getGradingType()) || "GPA".equalsIgnoreCase(q.getGradingType())) {
                                            double gpa = Double.parseDouble(q.getGrade());
                                            return gpa >= preferredGpa;
                                        }
                                    } catch (NumberFormatException e) {
                                        // Ignore
                                    }
                                    return false;
                                });
                        if (meetsGpa) {
                            score += 1.0;
                        }
                    } catch (NumberFormatException e) {
                        // Ignore
                    }
                }
                // If no GPA data, exclude this factor (don't count as 0)
            }
        }

        // Check graduation year match (only if preference defined AND learner has a
        // qualification with an endYear set) — same missing-data-vs-scored-as-0 fix as degree above.
        if (preferences.containsKey("preferredGraduationYear")) {
            boolean hasEndYearData = hasQualifications && qualifications.stream().anyMatch(q -> q.getEndYear() != null);
            if (hasEndYearData) {
                factors++;
                String preferredYear = String.valueOf(preferences.get("preferredGraduationYear")).trim();
                boolean matchesYear = qualifications.stream()
                        .anyMatch(q -> q.getEndYear() != null && preferredYear.equals(q.getEndYear()));
                if (matchesYear) {
                    score += 1.0;
                }
            }
            // If no endYear data, exclude this factor (don't count as 0)
        }

        // Return average score (sentinel 1.0 if no factors were evaluable) PLUS the actual
        // factors-evaluated count, so the caller can tell the sentinel apart from a real
        // perfect match instead of silently averaging "nothing evaluated" into overallScore.
        return factors == 0 ? new EducationScoreResult(1.0, 0) : new EducationScoreResult(score / factors, factors);
    }
    
    /**
     * Check if preferences contain education-related preferences
     */
    private boolean hasEducationPreferences(Map<String, Object> preferences) {
        return preferences.containsKey("preferredDegree") ||
               preferences.containsKey("preferredSpecialization") ||
               preferences.containsKey("preferredGpa") ||
               preferences.containsKey("preferredGraduationYear");
    }

    /**
     * Find matched skills (skills learner has that job requires)
     */
    private List<String> findMatchedSkills(Job job, Learner learner) {
        List<String> preferredSkills = getPreferredSkills(job);
        if (preferredSkills == null || preferredSkills.isEmpty()) {
            return Collections.emptyList();
        }

        List<SkillDTO> learnerSkills = learner.getSkills();
        if (learnerSkills == null || learnerSkills.isEmpty()) {
            return Collections.emptyList();
        }

        Set<String> learnerSkillNames = learnerSkills.stream()
                .map(skill -> skill.getSkill() != null ? skill.getSkill().toLowerCase().trim() : "")
                .filter(name -> !name.isEmpty())
                .collect(Collectors.toSet());

        return preferredSkills.stream()
                .filter(skill -> {
                    String normalized = skill != null ? skill.toLowerCase().trim() : "";
                    return !normalized.isEmpty() && learnerSkillNames.contains(normalized);
                })
                .collect(Collectors.toList());
    }

    /**
     * Find missing skills (skills job requires that learner doesn't have)
     */
    private List<String> findMissingSkills(Job job, Learner learner) {
        List<String> preferredSkills = getPreferredSkills(job);
        if (preferredSkills == null || preferredSkills.isEmpty()) {
            return Collections.emptyList();
        }

        List<SkillDTO> learnerSkills = learner.getSkills();
        if (learnerSkills == null || learnerSkills.isEmpty()) {
            return preferredSkills;
        }

        Set<String> learnerSkillNames = learnerSkills.stream()
                .map(skill -> skill.getSkill() != null ? skill.getSkill().toLowerCase().trim() : "")
                .filter(name -> !name.isEmpty())
                .collect(Collectors.toSet());

        return preferredSkills.stream()
                .filter(skill -> {
                    String normalized = skill != null ? skill.toLowerCase().trim() : "";
                    return !normalized.isEmpty() && !learnerSkillNames.contains(normalized);
                })
                .collect(Collectors.toList());
    }

    /**
     * Generate human-readable explanation with exclusion details
     * TRUST & FAIRNESS: Clearly states what was excluded and why
     */
    private String generateExplanation(ApplicationScreening screening, Job job, Learner learner, 
                                      Map<String, String> excludedAttributes, boolean isPartialScore) {
        StringBuilder explanation = new StringBuilder();

        if (screening.getOverallScore() != null) {
            explanation.append(String.format("Overall Match Score: %.1f%%", screening.getOverallScore() * 100));
        } else {
            explanation.append("Not scored — this job has no matching criteria defined");
        }
        
        // TRUST & FAIRNESS: Mark partial scores explicitly
        if (isPartialScore) {
            explanation.append(" (PARTIAL SCORE)");
        }
        explanation.append("\n");

        // Show skill score if it was included in overall score calculation
        // (excludedAttributes does not contain "excludedSkills" OR skillScore was calculated)
        boolean skillsExcluded = excludedAttributes != null && excludedAttributes.containsKey("excludedSkills");
        if (screening.getSkillScore() != null && !skillsExcluded) {
            explanation.append(String.format("Skill Match: %.1f%%\n", screening.getSkillScore() * 100));
        }

        // Show education score if it was included in overall score calculation
        // (excludedAttributes does not contain "excludedEducation" OR educationScore was calculated)
        boolean educationExcluded = excludedAttributes != null && excludedAttributes.containsKey("excludedEducation");
        if (screening.getEducationScore() != null && !educationExcluded) {
            explanation.append(String.format("Education Match: %.1f%%\n", screening.getEducationScore() * 100));
        }

        @SuppressWarnings("unchecked")
        List<String> matchedSkills = (List<String>) screening.getMatchedSkills();
        @SuppressWarnings("unchecked")
        List<String> missingSkills = (List<String>) screening.getMissingSkills();

        if (matchedSkills != null && !matchedSkills.isEmpty()) {
            explanation.append("\nMatched Skills: ").append(String.join(", ", matchedSkills));
        }

        if (missingSkills != null && !missingSkills.isEmpty()) {
            explanation.append("\nMissing Skills: ").append(String.join(", ", missingSkills));
        }

        // TRUST & FAIRNESS: Clearly state excluded attributes and reasons
        if (excludedAttributes != null && !excludedAttributes.isEmpty()) {
            explanation.append("\n\nExcluded from Scoring (FAIRNESS):\n");
            excludedAttributes.forEach((attribute, reason) -> {
                explanation.append(String.format("- %s: %s\n", attribute.replace("excluded", ""), reason));
            });
            explanation.append("\nNote: These attributes were excluded to prevent unfair penalties. ");
            explanation.append("Score is based only on available data.");
        }

        return explanation.toString();
    }

    /**
     * Get preferred skills from job candidate preferences
     */
    @SuppressWarnings("unchecked")
    private List<String> getPreferredSkills(Job job) {
        Map<String, Object> preferences = getCandidatePreferences(job);
        if (preferences == null) {
            return Collections.emptyList();
        }

        if (preferences.containsKey("preferredSkills")) {
            Object skillsObj = preferences.get("preferredSkills");
            if (skillsObj instanceof List) {
                return (List<String>) skillsObj;
            }
        }

        return Collections.emptyList();
    }

    /**
     * Get candidate preferences from job
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> getCandidatePreferences(Job job) {
        if (job.getCandidatePreferences() != null) {
            try {
                return objectMapper.convertValue(job.getCandidatePreferences(), Map.class);
            } catch (Exception e) {
                log.warn("Error parsing candidatePreferences: {}", e.getMessage());
            }
        }

        return Collections.emptyMap();
    }

    @Override
    @Transactional
    public ApplicationScreening rescreenApplication(Integer applicationId, Integer organizationId) {
        JobApplication application = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));
        // 4.3: not-found and org-mismatch intentionally share the same exception/message, matching
        // the established convention elsewhere in the placements module (see
        // PlacementJobServiceImpl's comment on the same pattern) so a caller can't distinguish
        // "doesn't exist" from "exists but isn't yours".
        if (organizationId != null && !organizationId.equals(application.getOrganizationId())) {
            throw new IllegalArgumentException("Application not found: " + applicationId);
        }
        return screenApplication(application);
    }

    @Override
    public ApplicationScreening getScreening(Integer applicationId, Integer organizationId) {
        ApplicationScreening screening = screeningRepository.findByApplicationId(applicationId)
                .orElse(null);
        if (screening == null) {
            return null;
        }
        if (organizationId != null) {
            JobApplication application = jobApplicationRepository.findById(applicationId).orElse(null);
            if (application == null || !organizationId.equals(application.getOrganizationId())) {
                return null;
            }
        }
        return screening;
    }
}


