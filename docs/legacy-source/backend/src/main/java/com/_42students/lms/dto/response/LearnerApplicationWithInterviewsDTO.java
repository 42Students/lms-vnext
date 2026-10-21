package com._42students.lms.dto.response;

import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.Interview;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Learner application with next upcoming interview attached (Gap #3, #9).
 * Enables My Applications to show "Next interview: ..." without extra API calls.
 * Uses LearnerInterviewView to expose only safe, learner-visible interview fields, and
 * LearnerApplicationView to expose only safe, learner-visible application fields.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LearnerApplicationWithInterviewsDTO {
    private LearnerApplicationView application;
    private LearnerInterviewView nextInterview;

    public LearnerApplicationWithInterviewsDTO(JobApplication application, LearnerInterviewView nextInterview) {
        this.application = LearnerApplicationView.from(application);
        this.nextInterview = nextInterview;
    }

    /**
     * Safe subset of JobApplication fields exposed to learners.
     * Excludes internal/admin-only signals: internalNotes (already @JsonIgnore on the entity),
     * screeningScore and isPartialScore (internal AI/automated screening signals never surfaced
     * to candidates, even for their own application), and statusUpdatedBy (internal admin/staff
     * user ID, an implementation detail not meant to round-trip to learners).
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LearnerApplicationView {
        private int id;
        private String applicationStatus;
        private Integer organizationId;
        private LocalDateTime appliedAt;
        private LocalDateTime statusUpdatedAt;
        private String source;
        private Boolean papRequested;
        private String resumeUrl;
        private Object resumeHistory;
        private String assessmentUrl;
        private String rejectionReason;
        private String statusBeforeWithdrawal;
        private String offerLetterUrl;
        private LocalDateTime offerLetterSentAt;
        // Student V1 §"Drives list/detail": "Applied by the placement cell · withdraw within
        // 48h" flag. Both fields already existed on the entity (the TPO round's apply-on-behalf
        // feature) but were never mapped to the learner-facing view.
        private Boolean appliedByCollege;
        private LocalDateTime appliedByCollegeOptOutUntil;
        // Student V1 §1's exact wording table: set by the caller (JobServiceImpl), which alone
        // has the bulk status-history lookup this needs. Null means "use the plain status label
        // you already show" — only REJECTED and a placed-elsewhere WITHDRAWN get a value.
        private String stageLabel;
        // Was missing entirely — the Applications and Assessments pages both read
        // application.job.{jobTitle,companyName,location,jobType,ctcRange,assessmentUrl,
        // assessmentDeadline} and got `undefined` for every field on every card: blank job
        // identity, "View job" never rendering, in-page search always empty, Withdraw silently
        // no-op'ing (its guard requires `record.job.id`), and the Assessments page permanently
        // showing "waiting on employer link" even when a real link was set.
        private LearnerJobView job;

        public static LearnerApplicationView from(JobApplication application) {
            if (application == null) return null;
            LearnerApplicationView view = new LearnerApplicationView();
            view.setId(application.getId());
            view.setApplicationStatus(application.getApplicationStatus());
            view.setOrganizationId(application.getOrganizationId());
            view.setAppliedAt(application.getAppliedAt());
            view.setStatusUpdatedAt(application.getStatusUpdatedAt());
            view.setSource(application.getSource());
            view.setPapRequested(application.getPapRequested());
            view.setResumeUrl(application.getResumeUrl());
            view.setResumeHistory(application.getResumeHistory());
            view.setAssessmentUrl(application.getAssessmentUrl());
            view.setRejectionReason(application.getRejectionReason());
            view.setStatusBeforeWithdrawal(application.getStatusBeforeWithdrawal());
            view.setOfferLetterUrl(application.getOfferLetterUrl());
            view.setOfferLetterSentAt(application.getOfferLetterSentAt());
            view.setAppliedByCollege(application.getAppliedByCollege());
            view.setAppliedByCollegeOptOutUntil(application.getAppliedByCollegeOptOutUntil());
            view.setJob(LearnerJobView.from(application.getJob()));
            return view;
        }
    }

    /**
     * Safe subset of Job fields exposed to the learner who applied to it — their own
     * application, so the job's own public/candidate-facing fields (including the
     * assessment link/deadline for this specific application's stage) are fine to expose,
     * unlike Interview.notes or JobApplication.screeningScore which stay excluded above.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LearnerJobView {
        private int id;
        private String jobTitle;
        private String companyName;
        private String companyLogo;
        private String location;
        private String jobType;
        private String ctcRange;
        private String assessmentUrl;
        private LocalDateTime assessmentDeadline;

        public static LearnerJobView from(Job job) {
            if (job == null) return null;
            LearnerJobView view = new LearnerJobView();
            view.setId(job.getId());
            view.setJobTitle(job.getJobTitle());
            view.setCompanyName(job.getCompanyName());
            view.setCompanyLogo(job.getCompanyLogo());
            view.setLocation(job.getLocation());
            view.setJobType(job.getJobType());
            view.setCtcRange(job.getCtcRange());
            view.setAssessmentUrl(job.getAssessmentUrl());
            view.setAssessmentDeadline(job.getAssessmentDeadline());
            return view;
        }
    }

    /**
     * Safe subset of Interview fields exposed to learners.
     * Excludes sensitive admin/internal fields: notes, internalFeedback, adminNotes,
     * feedbackRating, feedbackComments, feedbackRecommend, feedbackRecommendAction.
     * `notes` in particular is deliberately excluded despite the frontend having a "Notes from
     * the team" section that reads it — `notes` is set only via the admin-side update path and,
     * unlike roundDescription/location/interviewerName, is never run through TextSanitizer,
     * which is the signal that it was designed as an admin-internal field, not candidate-facing.
     * The corresponding frontend section was removed to match (see InterviewsContent.jsx).
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LearnerInterviewView {
        private int id;
        private LocalDateTime scheduledDate;
        private String interviewType;
        private String interviewMode;
        private String location;
        private String interviewStatus;
        private Integer durationMinutes;
        private Integer roundIndex;
        // Were missing from this view even though the two GET list endpoints that populate the
        // Interviews page (unlike the four action endpoints) previously skipped this DTO entirely
        // and serialized the raw entity instead — see InterviewController's list endpoints.
        private String interviewerName;
        private String roundDescription;
        private Integer jobId;
        private String jobTitle;
        private String companyName;
        private Integer jobApplicationId;
        // Student V1 §7 "Changed slot" badge: both null unless this interview was rescheduled
        // and the student hasn't re-confirmed the new slot yet.
        private LocalDateTime previousScheduledDate;
        private LocalDateTime scheduledDateChangedAt;

        public static LearnerInterviewView from(Interview interview) {
            if (interview == null) return null;
            LearnerInterviewView view = new LearnerInterviewView();
            view.setId(interview.getId());
            view.setScheduledDate(interview.getScheduledDate());
            view.setInterviewType(interview.getInterviewType());
            view.setInterviewMode(interview.getInterviewMode());
            view.setLocation(interview.getLocation());
            view.setInterviewStatus(interview.getInterviewStatus());
            view.setDurationMinutes(interview.getDurationMinutes());
            view.setRoundIndex(interview.getRoundIndex());
            view.setInterviewerName(interview.getInterviewerName());
            view.setRoundDescription(interview.getRoundDescription());
            view.setPreviousScheduledDate(interview.getPreviousScheduledDate());
            view.setScheduledDateChangedAt(interview.getScheduledDateChangedAt());
            if (interview.getJobApplication() != null) {
                view.setJobApplicationId(interview.getJobApplication().getId());
                Job job = interview.getJobApplication().getJob();
                if (job != null) {
                    view.setJobId(job.getId());
                    view.setJobTitle(job.getJobTitle());
                    view.setCompanyName(job.getCompanyName());
                }
            }
            return view;
        }
    }
}

