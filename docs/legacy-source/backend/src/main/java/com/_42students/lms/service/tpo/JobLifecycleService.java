package com._42students.lms.service.tpo;

import com._42students.lms.model.Job;
import com._42students.lms.model.tpo.JobLifecycleStatus;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

/**
 * The only writer of Job.lifecycleStatus. Keeps the legacy isDraft/isActive flags in lockstep so
 * every existing learner-visibility query (which still reads isDraft/isActive, not
 * lifecycleStatus) keeps working unchanged. See TPO V1 - Locked.docx §4.
 */
@Service
public class JobLifecycleService {

    private static final Map<String, Set<String>> ALLOWED = Map.of(
            JobLifecycleStatus.REQUEST, Set.of(
                    JobLifecycleStatus.DRAFT,
                    JobLifecycleStatus.SENT_BACK,
                    JobLifecycleStatus.REJECTED,
                    JobLifecycleStatus.CANCELLED),
            JobLifecycleStatus.SENT_BACK, Set.of(
                    JobLifecycleStatus.REQUEST,
                    JobLifecycleStatus.CANCELLED),
            JobLifecycleStatus.DRAFT, Set.of(
                    JobLifecycleStatus.PUBLISHED,
                    JobLifecycleStatus.CANCELLED),
            JobLifecycleStatus.PUBLISHED, Set.of(
                    JobLifecycleStatus.CLOSED,
                    JobLifecycleStatus.CANCELLED),
            JobLifecycleStatus.REJECTED, Set.of(),
            JobLifecycleStatus.CLOSED, Set.of(),
            JobLifecycleStatus.CANCELLED, Set.of()
    );

    /** Moves a job to a legal lifecycle status and updates isDraft/isActive to match. */
    public void transition(Job job, String newStatus) {
        // A never-saved Job carries the entity's column default ("PUBLISHED"), which is not a real
        // starting state: treat it as new, otherwise createDraft/createRequest always fail with a 500.
        String current = job.getId() == 0 ? null : job.getLifecycleStatus();
        if (current == null) {
            if (!Set.of(JobLifecycleStatus.DRAFT, JobLifecycleStatus.REQUEST).contains(newStatus)) {
                throw new IllegalStateException("New drive must start as DRAFT or REQUEST");
            }
        } else if (!current.equals(newStatus)
                && !ALLOWED.getOrDefault(current, Set.of()).contains(newStatus)) {
            throw new IllegalStateException("Invalid drive lifecycle transition: " + current + " -> " + newStatus);
        }

        job.setLifecycleStatus(newStatus);
        job.setIsDraft(JobLifecycleStatus.DRAFT_LIKE.contains(newStatus));
        job.setIsActive(!JobLifecycleStatus.INACTIVE.contains(newStatus));
    }

    public boolean isOpenForApplications(Job job) {
        return JobLifecycleStatus.PUBLISHED.equals(job.getLifecycleStatus());
    }
}
