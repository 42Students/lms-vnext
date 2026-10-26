# Recruiter — page-by-page three-source acceptance ledger

Reference: latest `42LMS pages prototype-png-recruiter.zip` (15 PNGs); screenshot 00 Companies Today belongs to TPO. **Current design authority: the PNG.** Behavior/data semantics reference: `42Students/lms2-fe@lms-dev-2026` and `42Students/lms@lms-dev-2026`. Implementation: `42Students/lms-vnext@main`.

For each screen: inspect prototype, old frontend page/components, old backend service/contract, vNext implementation; write adversarial differences; fix and add permission/data/error/keyboard tests; confirm CI and production browser with seeded PostgreSQL; then compare rendered screenshot to PNG (desktop and mobile). Do not certify from code presence. Preserve vNext improvements that improve privacy/security or functionality.

| PNG | Page | Audit | Implementation | Browser/DB | Visual |
|---|---|---|---|---|---|
| 01 | Recruiter Today | IN PROGRESS | IN PROGRESS | OPEN | OPEN |
| 02 | Drives | QUEUED | OPEN | OPEN | OPEN |
| 03 | Request a drive | QUEUED | OPEN | OPEN | OPEN |
| 04 | Drive overview | QUEUED | OPEN | OPEN | OPEN |
| 05 | Drive Applicants | QUEUED | OPEN | OPEN | OPEN |
| 06 | Drive Rounds/slots | QUEUED | OPEN | OPEN | OPEN |
| 07 | Drive Offers/joining | QUEUED | OPEN | OPEN | OPEN |
| 08 | Drive Talk | QUEUED | OPEN | OPEN | OPEN |
| 09 | Calendar | QUEUED | OPEN | OPEN | OPEN |
| 10 | Messages | QUEUED | OPEN | OPEN | OPEN |
| 11 | Company & Team | QUEUED | OPEN | OPEN | OPEN |
| 12 | Bell/search/profile/college picker | QUEUED | OPEN | OPEN | OPEN |
| 13 | Public recruiter invitation | QUEUED | OPEN | OPEN | OPEN |
| 14 | Public shared applicants | QUEUED | OPEN | OPEN | OPEN |

## 01 — Recruiter Today

**Prototype screenshot 01 inspected**: date and college, `Good evening, Meera. Three things need you.`, interview plan / unanswered CTC query / recently revised resumes as three `Later`-capable action cards; `This week` and `Waiting on the placement cell` panels.

**Old UI reviewed:** `lms2-fe/src/components/recruiter/RecruiterToday.jsx`, `src/pages/recruiter/home.js`. It includes `Later` until task changes, fold slots into a round, actionable vs waiting-only separation, first-drive onboarding and all-caught-up headlines, and partial-load recovery. **Old service reviewed:** `lms/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java`, one-recruiter/one-college task and week counts.

**vNext reviewed:** `src/app/(authenticated)/hr/home/page.tsx`, `src/components/hr/recruiter-today-prototype.tsx`, `hr-today-action-queue-model.ts`, `recruiter-today-later-model.ts`, `recruiter-today-week-events-model.ts`.

**First source fixes:** Restore conditional first-drive / all-caught-up hero while keeping unknown history unknown, and ensure an independent request-read failure cannot mask verified published job history. Pure tests assert the screenshot headline and all three empty/history outcomes.

**Safer existing differences retained:** verified active employer/college grant authorization, privacy-preserving counts, authorized multi-college chooser and Later fingerprints without saving task contents.

**Still open:** match actual desktop/mobile rendered screenshots; seed and exercise ASK, slots, revised resumes, week fold, waiting requests, Later persistence and task-change reappearance; verify one-time join welcome, error retries, and complete PostgreSQL actor scopes. No acceptance signoff yet.

Only the currently displayed prototype is the visual authority; legacy designs do not override it.
