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

## chat-15 UNCONFIRMED decisions and test reconciliation (2026-10-18)

| ID | Disposition | Evidence / rationale |
|---|---|---|
| LEARNER-course-detail-10 | NOT-A-GAP (intentional secure-vNext video policy) | Arbitrary private object paths must not bypass authenticated signed playback; registered video assets play inline and independently safe external resources retain an open-link path. `src/components/courses/learner-course-workspace.tsx`, `src/modules/courses/learner-storage-ui-model.ts`; `tests/unit/chat15-unconfirmed-decisions.test.ts` test `LEARNER-course-detail-10 keeps unregistered video references behind safe external or signed access`. If legacy data is later migrated, ingest/register assets rather than relaxing storage authorization. |
| LEARNER-course-detail-18 | NOT-A-GAP for non-existent authored lock flags; DONE for stale-focus recovery | vNext has no persisted explicit prerequisite lock state to invent. It must never turn an unknown lesson/content query into an authorized item. Existing source warnings and exact lesson/content guard: `learner-course-workspace.tsx`, `learner-roadmap-item-focus-model.ts`; `tests/unit/chat15-unconfirmed-decisions.test.ts` test `LEARNER-course-detail-18 refuses mismatched or stale lesson-content deep links`. Reopen when real author-set prerequisites are introduced. |
| LEARNER-course-detail-20 | DONE (safe learner-facing copy; reconciled conflicting source tests) | Published path with no lessons now says `No lessons published yet`; published lessons with no items say `No learning items published yet`. Do not tell a learner to create faculty content. `src/modules/courses/learner-roadmap-empty-state-model.ts`; `tests/unit/chat15-reassigned-learner-parity.test.ts` and `tests/unit/learner-roadmap-empty-state-model.test.ts`, both `LEARNER-course-detail-20`. Tests authored, not executed. |

## chat-15 2026-10-18 assignment material links

| ID | Source status | Evidence |
|---|---|---|
| LEARNER-course-detail-03 | PARTIAL — instructor LINKS implemented; FILE handouts await verified storage, and new table is unregistered | `src/db/schema/course-assignment-materials.ts`, `docs/proposed-migrations/chat15-course-assignment-material-links.sql`, `src/modules/courses/learner-assignment-materials-service.ts`, `src/app/api/courses/deliveries/[deliveryId]/assignments/[assignmentId]/materials/route.ts`, `src/components/courses/faculty-assignment-material-links.tsx`; `tests/unit/chat15-assignment-material-links.test.ts` `LEARNER-course-detail-03 enforces learner Section membership before returning published materials` and `tests/unit/chat15-faculty-assignment-material-authoring.test.ts` `LEARNER-course-detail-03 makes saved assignment links editable without a new page design`. No signed file downloads are claimed. Tests authored, not executed. |

| LEARNER-course-detail-07 | DONE for multiple authorized LINK materials; FILE download gated | Learner resource can list independently ordered title, notes and HTTPS links through scoped reader; private FILE download does not expose storage keys or invent a signed grant. Scanner/provider-backed download remains blocked until registered storage readiness. Test `tests/unit/chat9-final-LEARNER-course-detail-07.test.ts` case `LEARNER-course-detail-07 preserves verified functionality and safe failure states`. Execution pending orchestrator. |

| LEARNER-course-detail-18 | NOT-A-GAP for authored prerequisite locks; DONE for stale deep links | Do not invent a persisted per-item lock flag absent from content schema. A stale or unauthorized focused lesson/content displays a warning and never auto-opens a different item; add explicit locks only after authorable state is registered. Test `tests/unit/chat9-final-LEARNER-course-detail-18.test.ts` case `LEARNER-course-detail-18 preserves verified functionality and safe failure states`. Execution pending orchestrator. |
