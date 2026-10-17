# Gap-closure queue chat-15 (reassigned rebalance)

Follow docs/orchestrator/briefs/gap-closure-lane.md exactly. These OPEN gaps are yours now (page groups: learner/learning-misc, learner/placements, learner/course-detail). Look each ID up in docs/audit/gap-register.md for the legacy behaviour, implement with exact legacy wording, add tests named with the gap ID and an acceptance note in docs/audit/acceptance/<account>-<page>-verification.md. Push to chatgpt/chat-15-b.

- LEARNER-course-detail-03 (S2) 
- LEARNER-course-detail-05 (S3) 
- LEARNER-course-detail-08 (S3) 
- LEARNER-course-detail-09 (S3) 
- LEARNER-course-detail-12 (S4) 
- LEARNER-course-detail-13 (S4) 
- LEARNER-course-detail-14 (S3) 
- LEARNER-course-detail-15 (S3) 
- LEARNER-course-detail-16 (S3) 
- LEARNER-course-detail-17 (S3) 
- LEARNER-course-detail-19 (S3) 
- LEARNER-course-detail-20 (S4) 
- LEARNER-learning-misc-01 (S1) Mentioned in docs/audit/acceptance/learner-learning-misc-verification.md but not cited by a commit on main; not marked VERIFIED.
- LEARNER-learning-misc-02 (S2) 
- LEARNER-learning-misc-04 (S2) 
- LEARNER-learning-misc-07 (S2) 
- LEARNER-learning-misc-11 (S3) 
- LEARNER-learning-misc-12 (S4) 
- LEARNER-learning-misc-13 (S4) 
- LEARNER-learning-misc-15 (S3) 
- LEARNER-learning-misc-16 (S3) 
- LEARNER-learning-misc-19 (S3) 
- LEARNER-learning-misc-24 (S3) 
- LEARNER-learning-misc-27 (S3) 
- LEARNER-learning-misc-28 (S4) 
- LEARNER-learning-misc-29 (S4) 
- LEARNER-learning-misc-34 (S3) 
- LEARNER-placements-01 (S3) Mentioned in docs/audit/acceptance/learner-placements-verification.md but not cited by a commit on main; not marked VERIFIED.
- LEARNER-placements-03 (S3) 
- LEARNER-placements-05 (S3) 
- LEARNER-placements-09 (S3) 
- LEARNER-placements-28 (S2) 
- LEARNER-placements-30 (S3) 
- LEARNER-placements-33 (S4) 
- LEARNER-placements-41 (S3) 
- LEARNER-placements-43 (S3) 
- LEARNER-placements-51 (S2) 
- LEARNER-placements-52 (S2) 
- LEARNER-placements-R03 (S2) 
- LEARNER-placements-R04 (S2) 
- LEARNER-placements-R08 (S4) 

## Chat-15 verified closure group A

LEARNER-course-detail-08, LEARNER-course-detail-09, LEARNER-course-detail-13, LEARNER-course-detail-14, LEARNER-course-detail-15, LEARNER-course-detail-16, LEARNER-course-detail-20, LEARNER-placements-03, LEARNER-placements-05 — source completed, ID-named tests added; not run by builder.

## Chat-15 reassigned closure B1

- DONE (source): LEARNER-learning-misc-13, LEARNER-learning-misc-29. Legacy assignment date labels and quiz submitted popover. Test: tests/unit/chat15-assessment-legacy-copy.test.ts (not run).

## Chat-15 closure group B2

- DONE source: LEARNER-placements-09, LEARNER-placements-33. PARTIAL LEARNER-course-detail-12 (six playback rates; platform-tunable save cadence still outstanding). `tests/unit/chat15-player-and-placement-copy.test.ts` (authored, not run).

## Chat-15 missed quiz closure group C

- SOURCE DONE: LEARNER-learning-misc-24, LEARNER-course-detail-17, LEARNER-learning-misc-27, LEARNER-learning-misc-28. Missed learners may review only after CLOSED, results published, and due date elapsed; standalone read-only answer key, no submission; progress per question desktop and mobile. `tests/unit/chat15-missed-quiz-release.test.ts` names each ID (tests not run).

## Chat-15 placement group D

SOURCE DONE: LEARNER-placements-R03 (policy-aware acceptance cascade already built, independently test-named). PARTIAL: LEARNER-placements-30 (origin banner without opt-out request type); LEARNER-placements-52 (absence escalation without registered dispute request type); LEARNER-placements-41 (safe test link, no verified deadline); LEARNER-placements-28 (company privacy footer, no dedicated company-preview data source). Tests authored but not run.

## Chat-15 learner quiz table group E

- SOURCE DONE LEARNER-learning-misc-16: seven-column accessible desktop table, mobile card alternative, grade withheld pending result publication, real quiz links. `tests/unit/chat15-quiz-table-legacy.test.ts` names the ID; authored not executed.

## Chat-15 learner alerts group F

- SOURCE DONE LEARNER-placements-01: personal placement alert open now uses recipient-scoped POST /api/notifications/[notificationId]/read before navigating, with an explicit mark-read button when no action link and a retryable friendly failure message. `tests/unit/chat15-personal-placement-alert-read.test.ts`, not executed. The separate global badge refreshes after mutation; college broadcast notices are NOT silently acknowledged by a GET.
