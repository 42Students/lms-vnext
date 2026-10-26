# Recruiter — page-by-page three-source acceptance ledger

Reference: latest `42LMS pages prototype-png-recruiter.zip` (15 PNGs); screenshot 00 Companies Today belongs to TPO. **Current design authority: the PNG.** Behavior/data semantics reference: `42Students/lms2-fe@lms-dev-2026` and `42Students/lms@lms-dev-2026`. Implementation: `42Students/lms-vnext@main`.

For each screen: inspect prototype, old frontend page/components, old backend service/contract, vNext implementation; write adversarial differences; fix and add permission/data/error/keyboard tests; confirm CI and production browser with seeded PostgreSQL; then compare rendered screenshot to PNG (desktop and mobile). Do not certify from code presence. Preserve vNext improvements that improve privacy/security or functionality.

| PNG | Page | Audit | Implementation | Browser/DB | Visual |
|---|---|---|---|---|---|
| 01 | Recruiter Today | IN PROGRESS | IN PROGRESS | OPEN | OPEN |
| 02 | Drives | IN PROGRESS | IN PROGRESS | OPEN | OPEN |
| 03 | Request a drive | IN PROGRESS | IN PROGRESS | OPEN | OPEN |
| 04 | Drive overview | IN PROGRESS | IN PROGRESS | OPEN | OPEN |
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

## Current audited Page 02: Drives

Reviewed exact uploaded prototype PNG 02 against old `lms2-fe/src/pages/recruiter/drives/index.js`, old `lms/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java`, and vNext `/hr/drives` plus database drive search. Latest prototype shows open and waiting on the same landing canvas. Repaired the mixed landing which previously silently redirected to a waiting-only filter and hid live interviews. Added the verified college name and live/waiting/completed summary in the page heading. Corrected an employer-visible shared-shortlist count mislabeled "applied". Added seeded browser lifecycle and search isolation tests. Deep visual rows/progress parity and cross-role acceptance remain open; no premature closure.

## Page 03 — Request a drive

Inspected PNG 03 and legacy `lms2-fe/src/pages/recruiter/drives/new.js` plus legacy `RecruiterPlanDriveService.java`. Retained verified employer/college limits, audited multi-round presets, safe JD upload, exact authorization, saved drafts and placement-cell-only publication. Reordered vNext screen to latest prototype 1 The role → 2 Pay → 3 Who can apply → 4 Rounds, and added truthful "What happens next" review sidebar. Added pure regression and seeded Playwright tests for invalid forms and actual submitted request, which must pass before signoff.

## Page 04 — Drive overview

Compared PNG 04, legacy `RecruiterDriveOverview.jsx` / `RecruiterWorkspaceService.java` and vNext `hr/placements/jobs/[jobId]`, `recruiter-drive-progress-model`, `hr-drive-overview-model`. Latest prototype has Requested → Approved → Applications → Rounds → Offers → Completed, with the last step only after recorded closure. Changed vNext to show **Completed** rather than **Joining**; explicitly distinguishes accepted offers from formally CLOSED drives and never marks a cancelled draft complete. Maintained explicit placement-cell-only changes and employer-visible funnel scopes. Unit and seeded browser tests for six stages, pending Closed state and student preview were added; visual/funnel comparisons, real cross-role changes and provider acceptance remain open.