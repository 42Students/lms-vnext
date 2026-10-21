# Work packet (wave 2): edit src/components/courses/resource-progress-control.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/legacy-resource-viewer.md, docs/audit/gap2/lane-18/syllabus-liveclass.md, docs/audit/gap2/lane-4/learner-content-progress-model.md

## G2-17-008-064  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:193 — Unavailable progress tooltip explains retry lesson state.
- vNext now: src/components/courses/resource-progress-control.tsx:76-79 — Disabled only on hydration/saving.
- Fix: Disable completion on unavailable progress and show reason.

## G2-18-008-039  [P2] GAP  facet F11  effort M
- Legacy: Old learner progress control disabled when `progressUnavailable`, with tooltip retry state (`syllabus/liveclass.js:221-225`; `MarkCompleteButton.jsx:13-18,44-47`).
- vNext now: New ResourceProgressControl gated by canMarkComplete/readOnly, no progressUnavailable tooltip (`learner-course-workspace.tsx:330-339`; `resource-progress-control.tsx:71-81`).
- Fix: Disable with legacy reason when progress cannot be verified, expose retry.

## G2-18-008-069  [P2] GAP  facet F22  effort M
- Legacy: Old progress per learner+content stores WATCHED or completedAt (`MarkCompleteButton.jsx:16-36`; `LearnerContentProgressServiceImpl.java:68-119`).
- vNext now: New learnerContentProgress per user/content/delivery and `COMPLETED` (`resource-progress-control.tsx:36-64`; `learner-course-service.ts:29-31`).
- Fix: Map old WATCHED/completedAt to new COMPLETED, handle duplicate attempt uniqueness and completion date.

## G2-4-019-009  [P2] MISSING  facet F03  effort M
- Legacy: Legacy manual rewatch completed false allows clearing completedAt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:86-87`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:176-187`)
- vNext now: New manual resource completion button has no mark-incomplete action. (`src/components/courses/resource-progress-control.tsx:71-90`)
- Fix: Restore intentional rewatch reset preserving firstCompletedAt.

## G2-17-008-005  [P3] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:190-195 — Completion footer hint precedes MarkCompleteButton.
- vNext now: src/components/courses/resource-progress-control.tsx:71-88 — Completion action and confirmation dialog, no visible footer hint.
- Fix: Restore footer hint at legacy position.

## G2-18-008-060  [P3] GAP  facet F18  effort S
- Legacy: Old `Attended this session?` hint always before complete control (`syllabus/liveclass.js:221-225`).
- vNext now: New hint exists inside ConfirmDialog only, footer just Mark as complete (`resource-progress-control.tsx:71-87`; `learner-course-workspace.tsx:330-339`).
- Fix: Show inline question alongside action, not solely dialog title.
