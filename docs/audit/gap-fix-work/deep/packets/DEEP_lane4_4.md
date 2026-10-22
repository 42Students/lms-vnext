# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-13-012-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-13-012-007  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-13-030-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-2-001-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-2-003-027  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-20-010-008  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-20-010-015  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-20-010-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-20-010-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-20-010-052  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)

## Results

- G2-13-012-006: OK — vNext src/modules/placements/company-mail-domain-resolver.ts:10 defines MailDomainAnswer ACCEPTS_MAIL/NO_MAIL/UNKNOWN, :57-79 lookupCompanyMailDomain caches only non-UNKNOWN for 24h (max 5,000), :80-87 companyDomainAcceptsMail is the call-site policy; used at src/modules/placements/public-join/send-code-service.ts:99; matches docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:34-43
- G2-13-012-007: OK — src/modules/placements/public-join/send-code-service.ts:94 resolves the registrable work domain (registrableWorkDomain, src/modules/placements/public-join/domain-model.ts:23) before the DNS gate, matching docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:94-102
- G2-13-030-001: OK — src/components/placements/college-interview-appointments.tsx:389 and :444 show an "Interview feedback" button for COMPLETED interviews, opening the Dialog at :584 (rating, recommendation, comments, already-submitted view :603, discard confirm) backed by src/app/api/placements/college/jobs/[jobId]/interviews/[interviewId]/feedback/route.ts; matches docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:8-80
- G2-2-001-028: OK — src/modules/bug-tracker/independent-finding-actions-model.ts:5 comment schema is trim().min(1,"Write a comment").max(4000) and src/components/tracker/independent-finding-actions.tsx:45,127 returns "Write a comment" for whitespace-only with maxLength 4000; matches docs/legacy-source/backend/src/main/java/com/_42students/lms/auditfindings/AuditFindingService.java:176-179
- G2-2-003-027: OK — src/modules/messaging/legacy-notification-channel-policy.ts:4-24 is the reviewed registry of all 19 legacy events with their channels (six email-enabled events: JOB_INTERVIEW_SCHEDULED, INTERVIEW_REMINDER, INTERVIEW_CONFIRMED, SYSTEM_EMAIL_VERIFICATION, SYSTEM_APPLICATION_APPROVED, SYSTEM_APPLICATION_REJECTED), enforced fail-closed by legacyChannelIsAllowed (:33); template keys in src/modules/notifications/zeptomail-email.ts:16-39; matches docs/legacy-source/backend/src/main/java/com/_42students/lms/enums/NotificationEvent.java:10-36 and util/NotificationEventRegistry.java:50-59
- G2-20-010-008: OK — src/modules/placements/recruiter-message-email-dispatch-service.ts:51-53,145 selects legacy first name (fallback first word of display name, then "there") and the provider sanitises it via safeRecruiterEmailAddressName (src/modules/placements/recruiter-message-email-provider.ts:159); matches docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:63-65,106-109
- G2-20-010-015: OK — src/modules/placements/recruiter-message-email-dispatch-service.ts:74-76 admits only unread TPO messages newer than the last notified message (notified.created_at/id) and :127-136 re-scopes the excerpts/counts the same way; matches RecruiterMessageEmailService.java:65-71
- G2-20-010-019: OK — src/modules/placements/recruiter-message-email-dispatch-service.ts:30-37 returns enabled:false with readinessReason and operatorAlert when the template/provider is missing (no exception, no send), and src/app/api/internal/placements/recruiter-message-reminders/route.ts:47-48 returns that summary to the scheduler so operations see it; matches RecruiterMessageEmailService.java:77-79
- G2-20-010-034: OK — src/modules/placements/recruiter-message-email-dispatch-service.ts:74-76 and :127-136 restrict the unread window to messages after state.lastNotifiedMessageId, advanced at :160-163; matches RecruiterMessageEmailService.java:66-70
- G2-20-010-052: OK — src/modules/placements/recruiter-message-email-dispatch-service.ts:29-37 and src/modules/placements/recruiter-message-email-provider.ts:49-74 (recruiterDigestReadiness: BRIDGE_DISABLED/PROVIDER_NOT_CONFIGURED/TEMPLATE_NOT_CONFIGURED/REPLY_DOMAIN_INVALID/READY) mail only when the template is configured and active grants exist (grant joins :60-68, rechecked :111-125), surfacing operatorAlert; matches RecruiterMessageEmailService.java:72-79
