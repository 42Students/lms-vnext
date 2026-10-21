package com._42students.lms.service.tpo;

import com._42students.lms.service.SchedulerLockService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * The placement cell's timed jobs, each run on exactly one replica (SchedulerLockService, Doc 20). They were plain
 * {@code @Scheduled} methods on the services, so with two backend pods every student got "deadline today", "offer expiring",
 * "offer expired" and the shortlist reminder twice, and every overdue offer was expired twice. The services keep the work
 * (and its transaction); this class only says when, and makes sure only one pod does it.
 *
 * The notification outbox dispatcher is not here: it claims rows with FOR UPDATE SKIP LOCKED, so several pods share it safely.
 */
@Component
@RequiredArgsConstructor
public class TpoScheduledJobs {

    private final TpoAnnouncementService announcements;
    private final TpoRequestService requests;
    private final TpoOfferService offers;
    private final TpoRecruiterLeadService recruiterLeads;
    private final InterviewReminderService interviewReminders;
    private final RecruiterMessageEmailService recruiterMessageEmails;

    @Autowired(required = false)
    private SchedulerLockService schedulerLock;

    private void once(String name, Duration lease, Runnable job) {
        if (schedulerLock == null) { job.run(); return; }
        schedulerLock.runExclusively(name, lease, job);
    }

    // Daily jobs run on India time. Without a zone they ran on the server's UTC clock: "deadline today" and the shortlist
    // reminder reached people at 1:30 pm, recruiter invite reminders at 2:30 pm (19 Oct 2026).
    static final String INDIA = "Asia/Kolkata";

    @Scheduled(cron = "0 0 8 * * *", zone = INDIA)
    public void deadlineToday() { once("tpo.deadlineToday", Duration.ofMinutes(30), announcements::deadlineToday); }

    @Scheduled(fixedDelay = 60 * 60 * 1000)
    public void offersExpiringSoon() { once("tpo.offersExpiringSoon", Duration.ofMinutes(50), announcements::offersExpiringSoon); }

    @Scheduled(cron = "0 0 8 * * *", zone = INDIA)
    public void shortlistDueTomorrow() { once("tpo.shortlistDueTomorrow", Duration.ofMinutes(30), announcements::shortlistDueTomorrow); }

    @Scheduled(fixedDelay = 15 * 60 * 1000)
    public void escalateUndecidedWithdrawals() { once("tpo.escalateWithdrawals", Duration.ofMinutes(12), requests::escalateUndecidedWithdrawals); }

    @Scheduled(fixedDelay = 30 * 60 * 1000)
    public void finalizeExternalAcceptances() { once("tpo.finalizeExternalAcceptances", Duration.ofMinutes(25), offers::finalizeExternalAcceptances); }

    @Scheduled(cron = "0 0 9 * * *", zone = INDIA)
    public void recruiterInviteReminders() { once("tpo.recruiterInviteReminders", Duration.ofMinutes(30), recruiterLeads::sendInviteReminders); }

    /** The evening before an interview, India time: one reminder per student (in the app and by email). */
    @Scheduled(cron = "0 0 19 * * *", zone = INDIA)
    public void interviewReminders() { once("tpo.interviewReminders", Duration.ofMinutes(30), interviewReminders::remindTomorrow); }

    /** The morning of an interview, India time: one more nudge in the app only (students get email only for sign-in and interviews). */
    @Scheduled(cron = "0 0 8 * * *", zone = INDIA)
    public void interviewMorningReminders() { once("tpo.interviewMorningReminders", Duration.ofMinutes(30), interviewReminders::remindToday); }

    /** The placement cell's messages a recruiter has left unread: one email per conversation, at most every 6 hours. */
    @Scheduled(fixedDelay = 5 * 60 * 1000, initialDelay = 90 * 1000)
    public void recruiterMessageEmails() { once("tpo.recruiterMessageEmails", Duration.ofMinutes(4), recruiterMessageEmails::emailUnread); }

    @Scheduled(fixedDelay = 15 * 60 * 1000)
    public void expireOverdueOffers() { once("tpo.expireOverdueOffers", Duration.ofMinutes(12), offers::expireOverdue); }
}
