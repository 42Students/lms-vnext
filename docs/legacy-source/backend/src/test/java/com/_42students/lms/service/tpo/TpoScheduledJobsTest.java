package com._42students.lms.service.tpo;

import com._42students.lms.service.SchedulerLockService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/** Each placement-cell job runs under the one-replica lock (two pods used to send every reminder twice). */
class TpoScheduledJobsTest {

    @Test
    void everyJobGoesThroughTheLockAndRunsTheServiceWork() {
        TpoAnnouncementService announcements = mock(TpoAnnouncementService.class);
        TpoRequestService requests = mock(TpoRequestService.class);
        TpoOfferService offers = mock(TpoOfferService.class);
        SchedulerLockService lock = mock(SchedulerLockService.class);
        doAnswer(inv -> { ((Runnable) inv.getArgument(2)).run(); return null; }).when(lock).runExclusively(any(), any(), any());
        TpoRecruiterLeadService leads = mock(TpoRecruiterLeadService.class);
        InterviewReminderService interviews = mock(InterviewReminderService.class);
        TpoScheduledJobs jobs = new TpoScheduledJobs(announcements, requests, offers, leads, interviews,
                mock(RecruiterMessageEmailService.class));
        ReflectionTestUtils.setField(jobs, "schedulerLock", lock);

        jobs.deadlineToday(); jobs.offersExpiringSoon(); jobs.shortlistDueTomorrow();
        jobs.escalateUndecidedWithdrawals(); jobs.finalizeExternalAcceptances(); jobs.expireOverdueOffers(); jobs.recruiterInviteReminders();
        jobs.interviewMorningReminders();

        verify(lock).runExclusively(eq("tpo.expireOverdueOffers"), any(Duration.class), any());
        verify(lock).runExclusively(eq("tpo.interviewMorningReminders"), any(Duration.class), any());
        verify(lock, times(8)).runExclusively(any(), any(), any());
        verify(interviews).remindToday();
        verify(offers).expireOverdue();
        verify(offers).finalizeExternalAcceptances();
        verify(announcements).deadlineToday();
        verify(requests).escalateUndecidedWithdrawals();
        verify(leads).sendInviteReminders();
    }
}
