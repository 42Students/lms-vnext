# Orchestrator default decisions (owner away, 2026-10-14/15)

Taken by Claude under the owner's delegated ownership. Reversible; the owner may override any of them.

1. **Private contact visibility:** learner phone/email are visible only to roles in the learner's own college that already need them (college admin, TPO, the learner's assigned faculty/mentor, super admin in scope). Recruiters see contact details only for applicants to their own company's drives after shortlisting. Everyone else sees masked values. Never in list CSV exports unless the exporter role is college admin/TPO.
2. **Timezone:** store UTC, display and compute date boundaries in Asia/Kolkata (IST) for every college until a per-college timezone is requested. Date-only fields are IST calendar dates.
3. **Mentor team membership writes:** college admin and super admin may add/remove project team members (audited); mentors stay read-only on membership but can edit tasks/sprints/reviews of their own projects.
4. **File storage:** no file-backed features are built until the private R2 bucket exists. Text/link submissions stay the only supported kind. Rows depending on files stay BLOCKED.
5. **External sending (email/SMS/WhatsApp):** only through existing OTP/notification paths; chats build in-app notification records and copy-to-clipboard summaries, never new external sends.
6. **Parity DONE:** only the orchestrator flips rows to DONE after browser verification (desktop + mobile, no console errors, no horizontal scroll). Chats write PARTIAL only.

## Owner confirmations (2026-10-14 ~21:45)
Owner confirmed items 1 (contact visibility default), 2 (IST), 3 (mentor membership writes) as written, and approved creating the private R2 bucket `lms-vnext-private` (item 4 becomes: file features may be built once the bucket exists and the storage module (owned by the orchestrator, not chats) exposes signed upload/download helpers).

## Owner decisions 2026-10-15 (supersede earlier items 4 and 5 where they conflict)
7. **Legacy dev-only features are in scope.** Everything on the legacy `lms-dev-2026` branch (see docs/planning/legacy-delta-audit-2026-10-15.md, matrix section 8) is part of the target alongside prod-2026.
8. **Messaging works like the old LMS.** Email, SMS and other outbound messages (announcement reminders, batch invites and reminders, email campaigns, recruiter invites, verification notifications, WhatsApp prepared messages as in legacy) are real flows, not stubs. Implement them through a single outbound-delivery module with provider adapters over the existing integrations (ZeptoMail email, Exotel SMS; keep legacy semantics: preview audience, sent history, per-recipient status, unsubscribe link and suppression list, rate limits, audit). Safety rule for non-production: when APP_ENV is not production, deliver ONLY to recipients on the configured test allowlist (AUTH test email/phone lists); everything else is recorded as 'suppressed-nonprod' with the reason. Never send to a real address from dev/test data.
