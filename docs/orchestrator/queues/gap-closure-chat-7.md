# Gap closure queue: chat-7

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md` (read it first, every round). Branch: `chatgpt/chat-7-b`. 224 gaps on 4 pages. Work page by page in the order below; inside a page go S1, S2, S3, S4. Record every gap in `docs/audit/acceptance/<account>-<page>-verification.md`. One line per blocker under "Notes" at the bottom, then move on.

## learner/placements (65: FIXED-ON-MAIN 28, DONE 30, UNCONFIRMED 6, WRONG 1)

Audit: `docs/audit/pages/learner/placements.md` (and `placements-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/learner-placements-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| LEARNER-placements-04 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-placements-06 | S2 | STATE | FIXED-ON-MAIN |
| LEARNER-placements-07 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-placements-13 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| LEARNER-placements-20 | S2 | MISSING-FIELD | DONE |
| LEARNER-placements-21 | S2 | MISSING-MODAL | FIXED-ON-MAIN |
| LEARNER-placements-24 | S2 | STATE | FIXED-ON-MAIN |
| LEARNER-placements-27 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-placements-28 | S2 | MISSING-MODAL | DONE |
| LEARNER-placements-29 | S2 | VALIDATION | FIXED-ON-MAIN |
| LEARNER-placements-31 | S2 | STATE | FIXED-ON-MAIN |
| LEARNER-placements-35 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| LEARNER-placements-37 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-placements-45 | S2 | MISSING-FIELD | UNCONFIRMED |
| LEARNER-placements-47 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-placements-49 | S2 | SIDE-EFFECT | UNCONFIRMED |
| LEARNER-placements-51 | S2 | MISSING-FIELD | OPEN |
| LEARNER-placements-52 | S2 | MISSING-ACTION | OPEN |
| LEARNER-placements-53 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-placements-R01 | S2 | STATE | FIXED-ON-MAIN |
| LEARNER-placements-R02 | S2 | MISSING-MODAL | FIXED-ON-MAIN |
| LEARNER-placements-R03 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| LEARNER-placements-R04 | S2 | SIDE-EFFECT | OPEN |
| LEARNER-placements-R05 | S2 | VALIDATION | FIXED-ON-MAIN |
| LEARNER-placements-01 | S3 | MISSING-FIELD | OPEN |
| LEARNER-placements-03 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-05 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-08 | S3 | MISSING-FIELD | UNCONFIRMED |
| LEARNER-placements-09 | S3 | STATE | FIXED-ON-MAIN |
| LEARNER-placements-11 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-12 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-14 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-15 | S3 | STATE | FIXED-ON-MAIN |
| LEARNER-placements-17 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-22 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-25 | S3 | MISSING-FIELD | UNCONFIRMED |
| LEARNER-placements-26 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-30 | S3 | STATE | OPEN |
| LEARNER-placements-32 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-34 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-36 | S3 | MISSING-MODAL | FIXED-ON-MAIN |
| LEARNER-placements-38 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-39 | S3 | MISSING-FIELD | UNCONFIRMED |
| LEARNER-placements-40 | S3 | STATE | FIXED-ON-MAIN |
| LEARNER-placements-41 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-placements-42 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-43 | S3 | STATE | OPEN |
| LEARNER-placements-44 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-placements-46 | S3 | MISSING-TAB | OPEN |
| LEARNER-placements-48 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-54 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-55 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-R06 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-placements-R07 | S3 | STATE | FIXED-ON-MAIN |
| LEARNER-placements-02 | S4 | RESPONSIVE | FIXED-ON-MAIN |
| LEARNER-placements-10 | S4 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-16 | S4 | MISSING-FIELD | UNCONFIRMED |
| LEARNER-placements-18 | S4 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-19 | S4 | PERFORMANCE | WRONG |
| LEARNER-placements-23 | S4 | VALIDATION | FIXED-ON-MAIN |
| LEARNER-placements-33 | S4 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-56 | S4 | VALIDATION | FIXED-ON-MAIN |
| LEARNER-placements-57 | S4 | MISSING-PAGE | FIXED-ON-MAIN |
| LEARNER-placements-58 | S4 | MISSING-PAGE | FIXED-ON-MAIN |
| LEARNER-placements-R08 | S4 | STATE | FIXED-ON-MAIN |

## mentor/projects-meetings (58: FIXED-ON-MAIN 49, DONE 8, OPEN 1)

Audit: `docs/audit/pages/mentor/projects-meetings.md` (and `projects-meetings-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/mentor-projects-meetings-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| MEN-projects-meetings-11 | S2 | PERMISSION | FIXED-ON-MAIN |
| MEN-projects-meetings-12 | S2 | MISSING-TAB | FIXED-ON-MAIN |
| MEN-projects-meetings-31 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| MEN-projects-meetings-32 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| MEN-projects-meetings-34 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-36 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-39 | S2 | MISSING-TAB | FIXED-ON-MAIN |
| MEN-projects-meetings-42 | S2 | MISSING-MODAL | FIXED-ON-MAIN |
| MEN-projects-meetings-50 | S2 | MISSING-TAB | FIXED-ON-MAIN |
| MEN-projects-meetings-01 | S3 | STATE | FIXED-ON-MAIN |
| MEN-projects-meetings-03 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-04 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-05 | S3 | COPY | FIXED-ON-MAIN |
| MEN-projects-meetings-06 | S3 | COPY | FIXED-ON-MAIN |
| MEN-projects-meetings-08 | S3 | STATE | FIXED-ON-MAIN |
| MEN-projects-meetings-14 | S3 | COPY | FIXED-ON-MAIN |
| MEN-projects-meetings-15 | S3 | COPY | FIXED-ON-MAIN |
| MEN-projects-meetings-18 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-19 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-20 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| MEN-projects-meetings-21 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-23 | S3 | COPY | FIXED-ON-MAIN |
| MEN-projects-meetings-26 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-27 | S3 | MISSING-FIELD | OPEN |
| MEN-projects-meetings-28 | S3 | COPY | DONE |
| MEN-projects-meetings-30 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| MEN-projects-meetings-33 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-35 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| MEN-projects-meetings-37 | S3 | COPY | FIXED-ON-MAIN |
| MEN-projects-meetings-38 | S3 | COPY | FIXED-ON-MAIN |
| MEN-projects-meetings-40 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| MEN-projects-meetings-43 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-44 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-45 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-46 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| MEN-projects-meetings-47 | S3 | STATE | FIXED-ON-MAIN |
| MEN-projects-meetings-48 | S3 | COPY | FIXED-ON-MAIN |
| MEN-projects-meetings-49 | S3 | SIDE-EFFECT | FIXED-ON-MAIN |
| MEN-projects-meetings-51 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| MEN-projects-meetings-52 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-R02 | S3 | VALIDATION | DONE |
| MEN-projects-meetings-R03 | S3 | VALIDATION | FIXED-ON-MAIN |
| MEN-projects-meetings-R04 | S3 | STATE | FIXED-ON-MAIN |
| MEN-projects-meetings-R05 | S3 | STATE | FIXED-ON-MAIN |
| MEN-projects-meetings-R06 | S3 | STATE | DONE |
| MEN-projects-meetings-R07 | S3 | VALIDATION | DONE |
| MEN-projects-meetings-R08 | S3 | VALIDATION | FIXED-ON-MAIN |
| MEN-projects-meetings-02 | S4 | COPY | FIXED-ON-MAIN |
| MEN-projects-meetings-07 | S4 | COPY | FIXED-ON-MAIN |
| MEN-projects-meetings-09 | S4 | STATE | FIXED-ON-MAIN |
| MEN-projects-meetings-10 | S4 | PERFORMANCE | DONE |
| MEN-projects-meetings-13 | S4 | STATE | FIXED-ON-MAIN |
| MEN-projects-meetings-24 | S4 | COPY | FIXED-ON-MAIN |
| MEN-projects-meetings-25 | S4 | MISSING-FIELD | DONE |
| MEN-projects-meetings-29 | S4 | VALIDATION | DONE |
| MEN-projects-meetings-R09 | S4 | MISSING-FIELD | DONE |
| MEN-projects-meetings-R10 | S4 | STATE | FIXED-ON-MAIN |
| MEN-projects-meetings-R11 | S4 | STATE | FIXED-ON-MAIN |

## recruiter/home-drives (58: OPEN 22, FIXED-ON-MAIN 32, UNCONFIRMED 4)

Audit: `docs/audit/pages/recruiter/home-drives.md` (and `home-drives-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/recruiter-home-drives-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| REC-home-drives-38 | S1 | MISSING-COLUMN | OPEN |
| REC-home-drives-14 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-24 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-25 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-26 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-33 | S2 | SIDE-EFFECT | OPEN |
| REC-home-drives-35 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-39 | S2 | MISSING-TAB | FIXED-ON-MAIN |
| REC-home-drives-42 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| REC-home-drives-43 | S2 | MISSING-EXPORT | OPEN |
| REC-home-drives-48 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-49 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| REC-home-drives-R01 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| REC-home-drives-02 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-03 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-04 | S3 | COPY | FIXED-ON-MAIN |
| REC-home-drives-05 | S3 | STATE | FIXED-ON-MAIN |
| REC-home-drives-06 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-07 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-08 | S3 | STATE | FIXED-ON-MAIN |
| REC-home-drives-10 | S3 | STATE | FIXED-ON-MAIN |
| REC-home-drives-15 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| REC-home-drives-16 | S3 | MISSING-FIELD | OPEN |
| REC-home-drives-17 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| REC-home-drives-18 | S3 | COPY | FIXED-ON-MAIN |
| REC-home-drives-20 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| REC-home-drives-23 | S3 | MISSING-FIELD | OPEN |
| REC-home-drives-27 | S3 | VALIDATION | FIXED-ON-MAIN |
| REC-home-drives-28 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-29 | S3 | STATE | FIXED-ON-MAIN |
| REC-home-drives-30 | S3 | STATE | FIXED-ON-MAIN |
| REC-home-drives-31 | S3 | COPY | FIXED-ON-MAIN |
| REC-home-drives-34 | S3 | COPY | FIXED-ON-MAIN |
| REC-home-drives-36 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-37 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-40 | S3 | MISSING-TAB | FIXED-ON-MAIN |
| REC-home-drives-41 | S3 | PERMISSION | OPEN |
| REC-home-drives-44 | S3 | MISSING-EXPORT | UNCONFIRMED |
| REC-home-drives-45 | S3 | STATE | OPEN |
| REC-home-drives-46 | S3 | COPY | OPEN |
| REC-home-drives-47 | S3 | STATE | OPEN |
| REC-home-drives-50 | S3 | COPY | FIXED-ON-MAIN |
| REC-home-drives-55 | S3 | COPY | FIXED-ON-MAIN |
| REC-home-drives-R02 | S3 | SIDE-EFFECT | UNCONFIRMED |
| REC-home-drives-R03 | S3 | PERMISSION | OPEN |
| REC-home-drives-R04 | S3 | STATE | FIXED-ON-MAIN |
| REC-home-drives-R05 | S3 | A11Y | FIXED-ON-MAIN |
| REC-home-drives-R06 | S3 | STATE | FIXED-ON-MAIN |
| REC-home-drives-09 | S4 | MISSING-ACTION | UNCONFIRMED |
| REC-home-drives-11 | S4 | COPY | FIXED-ON-MAIN |
| REC-home-drives-19 | S4 | PERMISSION | UNCONFIRMED |
| REC-home-drives-32 | S4 | STATE | FIXED-ON-MAIN |
| REC-home-drives-52 | S4 | MISSING-COLUMN | OPEN |
| REC-home-drives-53 | S4 | STATE | OPEN |
| REC-home-drives-54 | S4 | COPY | FIXED-ON-MAIN |
| REC-home-drives-56 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| REC-home-drives-R07 | S4 | COPY | FIXED-ON-MAIN |
| REC-home-drives-R08 | S4 | PERFORMANCE | FIXED-ON-MAIN |

## faculty/courses (43: FIXED-ON-MAIN 38, DONE 3, OPEN 0, WRONG 2)

Audit: `docs/audit/pages/faculty/courses.md` (and `courses-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/faculty-courses-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| FAC-courses-14 | S1 | MISSING-FIELD | FIXED-ON-MAIN |
| FAC-courses-10 | S2 | STATE | FIXED-ON-MAIN |
| FAC-courses-13 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| FAC-courses-16 | S2 | VALIDATION | FIXED-ON-MAIN |
| FAC-courses-18 | S2 | STATE | FIXED-ON-MAIN |
| FAC-courses-01 | S3 | COPY | FIXED-ON-MAIN |
| FAC-courses-02 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| FAC-courses-03 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| FAC-courses-04 | S3 | COPY | FIXED-ON-MAIN |
| FAC-courses-05 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| FAC-courses-08 | S3 | COPY | FIXED-ON-MAIN |
| FAC-courses-09 | S3 | PERFORMANCE | DONE |
| FAC-courses-11 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| FAC-courses-12 | S3 | MISSING-PAGE | FIXED-ON-MAIN |
| FAC-courses-15 | S3 | VALIDATION | FIXED-ON-MAIN |
| FAC-courses-20 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| FAC-courses-22 | S3 | COPY | FIXED-ON-MAIN |
| FAC-courses-23 | S3 | COPY | FIXED-ON-MAIN |
| FAC-courses-24 | S3 | STATE | FIXED-ON-MAIN |
| FAC-courses-25 | S3 | STATE | FIXED-ON-MAIN |
| FAC-courses-26 | S3 | COPY | FIXED-ON-MAIN |
| FAC-courses-27 | S3 | STATE | DONE |
| FAC-courses-31 | S3 | COPY | FIXED-ON-MAIN |
| FAC-courses-34 | S3 | RESPONSIVE | FIXED-ON-MAIN |
| FAC-courses-R01 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| FAC-courses-R02 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| FAC-courses-R03 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| FAC-courses-R04 | S3 | COPY | FIXED-ON-MAIN |
| FAC-courses-R07 | S3 | VALIDATION | FIXED-ON-MAIN |
| FAC-courses-R08 | S3 | VALIDATION | FIXED-ON-MAIN |
| FAC-courses-06 | S4 | MISSING-FILTER | FIXED-ON-MAIN |
| FAC-courses-07 | S4 | COPY | FIXED-ON-MAIN |
| FAC-courses-17 | S4 | COPY | WRONG |
| FAC-courses-19 | S4 | MISSING-FIELD | DONE |
| FAC-courses-21 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| FAC-courses-28 | S4 | MISSING-FIELD | WRONG |
| FAC-courses-29 | S4 | COPY | FIXED-ON-MAIN |
| FAC-courses-30 | S4 | COPY | FIXED-ON-MAIN |
| FAC-courses-32 | S4 | MISSING-PAGE | FIXED-ON-MAIN |
| FAC-courses-33 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| FAC-courses-35 | S4 | A11Y | FIXED-ON-MAIN |
| FAC-courses-R05 | S4 | STATE | FIXED-ON-MAIN |
| FAC-courses-R06 | S4 | STATE | FIXED-ON-MAIN |

## Notes (blockers, one line each)
- LEARNER-placements-20 BLOCKED: secure resume upload, preview and attachment receipts await private bucket and malware scanning.
- REC-home-drives-23 BLOCKED: secure PDF/Word job-description upload requires private storage and malware scanning.
- REC-home-drives-43 BLOCKED: resume ZIP with protected source documents requires the private scanned object store.
- FAC-courses-14 BLOCKED: lesson material uploads depend on a private object-store bucket and malware-scanning pipeline.
- GR-30/GR-70 adoption pending: shared friendly error and guarded-action helpers were not yet on main at the start of round 3; revisit all four pages after chat-14 merges.

- LEARNER-placements-20 BLOCKED: profile resume attachment and preview require an authenticated private object-storage bucket and malware-scanning service.

## Needs shell (chat-9 only)


## Chat-7 ownership check, 2026-10-17
- Reassignment policy: skip OPEN recruiter/home-drives (chat-14), learner/placements (chat-15) and mentor/projects-meetings-part2 (chat-16). Mentor part 1 and faculty/courses remain chat-7.
- Addressed the two failing `tests/unit/learner-projects-round2-gap-closure.test.ts` source contracts `LEARNER-projects-09` and `LEARNER-projects-34` in shared `project-workspace.tsx` (Projects heading and Resource counts). Tests not run. Learner contact/course/notification and recruiter-drive failures touch chat-15/chat-14 reassigned pages, so their owners retain those failures.

## Chat-7 final mentor status note
- MEN-projects-meetings-27: structured meeting notes, action items, retrospective, outcome, follow-up/status saved with an unnumbered migration proposal. Legacy Draft and Rescheduled meeting lifecycle statuses remain OPEN: chat-16 owns mentor/calendar and moved meeting pages; do not add incompatible state transitions without updating that lane's consumers. Need orchestrator to register the meeting facilitation proposal before deploying.
- MEN-projects-meetings-10: DB paging is active for ordinary search/status/assignment with recent/title order; advanced attention/task-work and computed progress sorts remain full-scope rollups. Unit tests authored, not run.

## Chat-7 round 2 (35 gap-ID source verifications)
- The `docs/orchestrator/queues/unconfirmed-decisions.md` owner list has no chat-7 section. Legacy queue UNCONFIRMED items LEARNER-placements-08/-16/-25/-39/-45/-49 are reassigned to chat-15; REC-home-drives-09/-19/-44/R02 to chat-14. Do not issue competing decisions or edit their acceptance files.
- Verified 30 FIXED-ON-MAIN mentor gap IDs in six five-gap batches, plus 5 faculty gaps, with one named assertion test per ID and acceptance evidence. Tests authored, not run; this is source verification, not end-to-end runtime certification.
- Typecheck report (2026-10-17 23:15) is stale for chat-7: mentor facilitation fields are in the schedule form, sprint estimationUnit is accepted, and all six createLessonContent calls in courses-c2-learning.test.ts include points. A fresh CI typecheck remains required.
- MEN-projects-meetings-27 remains OPEN: project_meetings facilitation/status SQL is proposed under docs/proposed-migrations/chat7-mentor-meeting-facilitation.sql and is not registered in 0133/0134; test, journal replay and lifecycle acceptance must precede closure.

## Chat-7 round 3 — 2026-10-18 (31 distinct owned IDs addressed)
- Synced latest origin/main before editing. No UI/UX redesign was performed; the owner has not signed off UX-PLAYBOOK.md.
- MEN-projects-meetings-27 is still OPEN pending registration/replay of `docs/proposed-migrations/chat7-mentor-meeting-facilitation.sql` and real database lifecycle acceptance. Added a private draft cancellation path for mentor and admin, with no learner/team notifications for a previously private draft, and hid DRAFT from OBSERVER/LEARNER reads. New gap-named lifecycle unit tests authored, not executed.
- MEN-projects-meetings-R10 now ignores unknown legacy URL keys while preserving recognized status/page/pageSize validation and first-page `page=0` alias. Unit test authored, not executed.
- Source/model verification added for 29 further distinct FIXED-ON-MAIN IDs on owned mentor/projects-meetings and faculty/courses pages. Evidence in `tests/unit/chat7-round3-*.test.ts` and both page acceptance files; this does NOT mean full CI, database or visual verification.
- Updated stale `MEN-projects-meetings-R02` source test to require overlap checks for both SCHEDULED and RESCHEDULED (current implemented behaviour). The 2026-10-17 typecheck/failure inventories are stale; fresh CI is still required.
- UNCONFIRMED ownership: no chat-7 section in `docs/orchestrator/queues/unconfirmed-decisions.md`. Items still shown under learner/placements and recruiter/home-drives are assigned exclusively to chat-15 and chat-14 by reassignments.md. No competing decisions made.
- Remaining chat-7 OPEN count in queue: 1 (MEN-projects-meetings-27; migration and runtime gate). Other listed OPEN gaps belong to reassigned lanes. Page UI/UX excellence pass has not begun.

## Chat-7 round 4 — source-level final queue triage
- Pulled latest main (fast-forward). The queue still has exactly one owned OPEN ID: `MEN-projects-meetings-27`, not 30; all other OPEN/UNCONFIRMED lines are recruiter/learner work formally reassigned to chat-14/chat-15.
- Closed two real MEN27 privacy defects: cancelled unsent drafts could leak to learners, and structured mentor-only facilitation was returned in learner/observer payloads despite hidden UI. These are now filtered/redacted server-side.
- Mentor decision service now fails closed for COMPLETED/ARCHIVED projects and disabled Projects module. Source/unit regressions expanded. Added `tests/integration/chat7-mentor-meeting-facilitation.test.ts` for tenant-scoped draft, cancel and completion lifecycle on PostgreSQL.
- Registration of `docs/proposed-migrations/chat7-mentor-meeting-facilitation.sql` in numbered Drizzle migrations remains exclusively with orchestrator per `docs/orchestrator/briefs/gap-closure-lane.md`. The integration test skips when the column is absent, and must be rerun **without a skip** once registered.
- Neither the current TypeScript report nor the unit-failures-r1 inventory has fresh run output. Previous chat-7 source errors were repaired in earlier rounds; do not claim green CI without orchestrator execution.
- UNCONFIRMED decisions file has no chat-7-owned section. No page UI/UX restyling occurred.

## Chat-7 round 5 — 2026-10-18 (one owned OPEN gap; no chat-7 UNCONFIRMED)
- Pulled `origin/main` first. Latest `docs/orchestrator/typecheck-errors.md` (cloud CI 01:15) has **no chat-7 errors**: remaining TypeScript errors belong to chat-17, chat-14, chat-11, or chat-4/11. Do not edit their files.
- Remediated stale `unit-failures-r1.md` assertions: `MEN-projects-meetings-R06` zero-release copy in `tests/unit/mentor-projects-chat7-round6-workflows.test.ts`; `LEARNER-placements-33` old inline summary in chat-7's `tests/unit/learner-placements-chat7-queue-review.test.ts` (test only; learner placement production code belongs to chat-15). Other old chat-7 failures must be rerun against current main.
- `MEN-projects-meetings-27`: corrected organizer persistence and organizer-wide overlap locks when another admin edits a meeting; preserved linked task/sprint and ceremony for omitted fields; avoided repeat learner notifications on notes-only changes; preserved outcome on completing without replacement. Added PostgreSQL lifecycle assertions and separate SQL/Drizzle contract tests, plus the `project_meetings_facilitation_object_ck` Drizzle check.
- Remaining owned OPEN: **MEN-projects-meetings-27**. Its unnumbered `docs/proposed-migrations/chat7-mentor-meeting-facilitation.sql` is not in `drizzle/meta/_journal.json` (last registration: 0134); per lane brief only orchestrator may register numbered migrations. Real DB tests skip when the column is absent. Needs registration, replay and unskipped integration green before DONE.
- `docs/orchestrator/queues/unconfirmed-decisions.md` contains no chat-7 section; learner/placements belongs to chat-15, recruiter/home-drives belongs to chat-14, mentor/projects-meetings-part2 belongs to chat-16. No other owned OPEN gap exists to make a truthful 30+ gap closure round.
- No page UI/UX restyling; UX playbook still being audited. Tests authored and pushed, **not executed locally**.

## Chat-7 FINAL SPRINT — docs/orchestrator/queues/final-sprint.md, 11 assigned IDs

- Synced `origin/main` first. New ownership supersedes the older chat-7 queue: 8 Super Admin Courses/Content gaps and 3 TPO calendar/report FIXED-ON-MAIN rechecks. No UI restyling.
- **SA-academics-people-50** PARTIAL: new catalogue short display name/optional official code/card colour source, new unnumbered migration proposal; private image upload remains BLOCKED pending object-storage and malware-scanner infrastructure. See `tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts` and acceptance.
- **SA-academics-people-52** DONE source, CI pending: selected-course Show/Hide, confirmation, fail report and retry using scoped lesson-content visibility updates. See `tests/unit/chat7-final-sprint-superadmin-course-visibility.test.ts`.
- **SA-academics-people-53** PARTIAL: SA acting-college permission to toggle existing course's published lesson content; no independent persisted whole-course visibility state, test/source acceptance in two chat7 final sprint test files.
- **SA-academics-people-56** PARTIAL: direct lesson edit/archive/keyboard reorder; offering route provides create/drag/authoring. Standalone create modal/course picker not duplicated into directory. Test in `chat7-final-sprint-superadmin-courses-content.test.ts`.
- **SA-academics-people-60** BLOCKED: remote URL-to-private-video import requires SSRF-hardened ingestion plus private storage/scanner; no unsafe remote fetch shipped. Test records fail-closed behavior.
- **SA-academics-people-64** PARTIAL: assignments direct publish/archive plus offering builder/submission link and CSV; per-student grading drawer and Publish all graded remain OPEN.
- **SA-academics-people-65** PARTIAL: quizzes direct publish/close/archive and results release plus offering builder link and CSV; direct metadata edit/submission modal remain OPEN.
- **SA-academics-people-67** DONE source, CI/DB pending: selected offering per-student persisted completion, CSV and safe zero-item percentage policy; large roster cap disclosed. Test `SA-academics-people-67` in `chat7-final-sprint-superadmin-courses-content.test.ts`.
- **TPO-calendar-reports-45** FIXED-ON-MAIN VERIFIED source, CI pending: six honest issued-offer current states (selections separate), test `chat7-final-sprint-tpo-calendar-reports.test.ts`.
- **TPO-calendar-reports-52** FIXED-ON-MAIN VERIFIED CSV source, CI pending: per-kind CSV/BOM/CRLF/formula escaping; native Excel of shown rows still outside this verification, test `chat7-final-sprint-tpo-calendar-reports.test.ts`.
- **TPO-calendar-reports-R07** FIXED-ON-MAIN VERIFIED source, CI pending: no full `listTpoLeads` search on calendar rendering, test `chat7-final-sprint-tpo-calendar-reports.test.ts`.
- Exact acceptance rows: `docs/audit/acceptance/superadmin-academics-people-2-courses-content-verification.md` and `docs/audit/acceptance/tpo-calendar-reports-verification.md`. Tests were authored but **not run**. Do NOT mark the 8 OPEN gaps all fully closed until partials and migration dependencies above are resolved.

## Chat-7 FINAL SPRINT addendum — typecheck and remaining scope
- Latest cloud typecheck inventory (2026-10-18 02:00) identified `MEN-projects-meetings-27` nullable SQLWrapper (now explicit nonnullable OR predicate) and test fixture IST literal (now `as const`) in chat-7 files. See commits tagged `MEN-projects-meetings-27`. No fresh TypeScript rerun performed.
- `SA-academics-people-50`: separated bounded optional takeaways from description in schema/service/forms/catalogue/SQL proposal; still awaiting migration registration and private image upload infra.
- `SA-academics-people-53`: direct Super Admin lesson visibility toggle now exposed in Lessons directory, using audited acting-college CAS service. Whole-course independent visibility state still partial.
- `SA-academics-people-56`: Lessons directory now has direct scoped Add Lesson with a selected offering path, plus edit, archive, ordering, and offering authoring links. First lesson for a new path is created from the offering; broad picker only includes currently loaded lesson paths.
- `SA-academics-people-60` cannot be safely called DONE: untrusted video URL import requires private upload/scanner plus SSRF-hardening; intentionally no arbitrary server fetch. `SA-academics-people-64` and `-65` still lack in-list builder and per-student submissions/grading editing; current source supplies actions, CSV, and offering builder entry.
- `TPO-calendar-reports-45`, `-52`, `-R07`: gap-ID named tests and acceptance are recorded; tests authored, not executed. Native Excel export for visible rows is not implemented, so `TPO-calendar-reports-52` is specifically a CSV evidence verification, not native-XLSX parity.
- No page restyling. Do not mark all 11 fully closed without registering the new migration and running CI/integration tests.
