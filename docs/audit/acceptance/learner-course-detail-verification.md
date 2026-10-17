# Learner Course Detail — chat-11 round five source acceptance

These are source-level checks and ID-named tests; orchestration must execute unit, integration and browser checks.

| ID | Status | Evidence |
|---|---|---|
| LEARNER-course-detail-08 | DONE | src/components/courses/resource-progress-control.tsx, learner-interaction-model.ts, src/modules/courses/progress-service.ts; tests/unit/learner-course-detail-round5.test.ts — `it("LEARNER-course-detail-08 allows manual Resource and Live session completion with legacy confirmation copy")` |
| LEARNER-course-detail-14 | DONE | src/components/courses/learner-roadmap-item-dialog.tsx, learner-course-workspace.tsx; tests/unit/learner-course-detail-round5.test.ts — `it("LEARNER-course-detail-14 displays content kind, progress and due labels on learning items")` |
| LEARNER-course-detail-15 | DONE | src/components/courses/learner-course-workspace.tsx; tests/unit/learner-course-detail-round5.test.ts — `it("LEARNER-course-detail-15 defaults to next unfinished lesson and shows legacy status and numbering")` |
| LEARNER-course-detail-16 | DONE | src/components/courses/learner-course-workspace.tsx; tests/unit/learner-course-detail-round5.test.ts — `it("LEARNER-course-detail-16 gives lesson-focused previous next and back navigation")` |

| LEARNER-course-detail-09 | DONE | src/components/courses/learner-live-session-status.tsx, learner-course-workspace.tsx, learner-live-class-link.tsx; tests/unit/learner-course-detail-live-round5.test.ts — `it("LEARNER-course-detail-09 displays live countdown, time range, safe join and copy link recovery")` |
| LEARNER-course-detail-13 | DONE | src/components/courses/learner-course-workspace.tsx; tests/unit/learner-course-detail-live-round5.test.ts — `it("LEARNER-course-detail-13 shows recorded percentage watched alongside playback bar and status")` |

## Partial
- LEARNER-course-detail-18: stale lesson and item deep links now show a safe visible warning. Explicit per-item locked flags and reasons require corresponding content persistence. Test: `it("LEARNER-course-detail-18 warns when a requested lesson or content is not published")`.

## Remaining
LEARNER-course-detail-03/04/05/10/11/12/17/18 and other audit entries are not claimed by this batch.

## Chat-15 group A — tests authored, not executed

| LEARNER-course-detail-08 | DONE (source authored; execution pending) | `tests/unit/chat15-reassigned-learner-parity.test.ts` — `LEARNER-course-detail-08` test; existing implementation reviewed. |
| LEARNER-course-detail-09 | DONE (source authored; execution pending) | `tests/unit/chat15-reassigned-learner-parity.test.ts` — `LEARNER-course-detail-09` test; existing implementation reviewed. |
| LEARNER-course-detail-13 | DONE (source authored; execution pending) | `tests/unit/chat15-reassigned-learner-parity.test.ts` — `LEARNER-course-detail-13` test; existing implementation reviewed. |
| LEARNER-course-detail-14 | DONE (source authored; execution pending) | `tests/unit/chat15-reassigned-learner-parity.test.ts` — `LEARNER-course-detail-14` test; existing implementation reviewed. |
| LEARNER-course-detail-15 | DONE (source authored; execution pending) | `tests/unit/chat15-reassigned-learner-parity.test.ts` — `LEARNER-course-detail-15` test; existing implementation reviewed. |
| LEARNER-course-detail-16 | DONE (source authored; execution pending) | `tests/unit/chat15-reassigned-learner-parity.test.ts` — `LEARNER-course-detail-16` test; existing implementation reviewed. |
| LEARNER-course-detail-20 | DONE (source authored; execution pending) | `tests/unit/chat15-reassigned-learner-parity.test.ts` — `LEARNER-course-detail-20` test; existing implementation reviewed, corrected roadmap copy. |

| LEARNER-course-detail-12 | PARTIAL | `tests/unit/chat15-player-and-placement-copy.test.ts`, playback-rate selector present; server tunables for progress cadence and threshold remain. |

## Chat-15 follow-on from registered 0134 (source authored; not tested)

| LEARNER-course-detail-12 | SOURCE-DONE (unverified) | `src/modules/courses/learner-playback-settings.ts` validates GLOBAL/current-college overrides `ui.progressSaveIntervalMs` (1000–60000) and `course.watchedThresholdPercent` (1–100); `progress-service.ts` enforces authoritative threshold; native/YouTube players receive interval from learner workspace; YouTube embed uses `youtube-nocookie.com` host. `tests/unit/chat15-learner-playback-settings.test.ts` names the ID. No focused test run. |
| LEARNER-course-detail-19 | SOURCE-DONE (unverified) | `src/modules/courses/learner-course-service.ts` catches optional assignments, quizzes and quiz-attempt state reads separately while keeping lessons; `learner-course-workspace.tsx` presents `Some course state could not be loaded` and `Retry state`; segment fallback says `Could not load course lessons` / `Retry`. `tests/unit/chat15-course-state-and-staff-optout.test.ts` names the ID. No focused test run. |
| LEARNER-course-detail-05 | PARTIAL | `src/components/courses/assignment-submission-control.tsx` includes the `Discard this submission?` / `Keep editing` / `Discard` modal and unload/anchor-navigation guards; a safer formatted text editor now handles bold/italic/lists but is not a legacy HTML WYSIWYG editor, and Google Drive import/teacher attachment read path remain unresolved. `tests/unit/chat15-learner-rich-response.test.ts`. |
