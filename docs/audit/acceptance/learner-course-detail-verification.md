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

| LEARNER-course-detail-17 | DONE (authored, not executed) | `tests/unit/chat15-missed-quiz-release.test.ts` missed quiz read-only released answer key. |


## Chat-11 deadline, submitted-work and empty-state source verification

| LEARNER-course-detail-01 | DONE | src/modules/courses/assignment-submission-service.ts, assignment-submission-deadline-policy.ts, learner-course-workspace.tsx; tests/unit/chat11-learner-course-deadline-empty.test.ts — `it("LEARNER-course-detail-01 rejects missing and elapsed deadlines on the server and closes the learner card")` |
| LEARNER-course-detail-06 | DONE | src/components/courses/learner-course-workspace.tsx; tests/unit/chat11-learner-course-deadline-empty.test.ts — `it("LEARNER-course-detail-06 shows both written and link submissions and safe read-only links")` |
| LEARNER-course-detail-20 | DONE | src/modules/courses/learner-roadmap-empty-state-model.ts, learner-course-workspace.tsx; tests/unit/learner-roadmap-empty-state-model.test.ts and tests/unit/chat11-learner-course-deadline-empty.test.ts — `it("LEARNER-course-detail-20 restores no-roadmap, no-content and filtered lesson copy")` |
