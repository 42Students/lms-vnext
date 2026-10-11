# DB06 quiz lifecycle and result-publication audit contract

**Observed:** 2026-10-11 IST  
**Global phase:** DATABASE  
**Queue task:** DB-052 · **Worker:** Chat 1  
**Status:** source-only staging; not exported, not journaled, not PostgreSQL verified.

Artifacts:

- src/db/schema/db06-quiz-lifecycle-staged.ts
- docs/planning/sql/db06-quiz-lifecycle-history-candidate.sql
- tests/db06-quiz-lifecycle-staging.test.mjs

## Source gap

course_quizzes.status and course_quizzes.results_published are active persisted lifecycle state, but current vNext stores only the latest state. It does not preserve who published, closed, archived, unpublished, published results, or withdrew result visibility.

Pinned legacy QuizServiceImpl emits quiz audit actions including QUIZ_CREATE, QUIZ_UPDATE, QUIZ_UNPUBLISH, QUIZ_DELETE, QUIZ_GRADES_PUBLISHED, and QUIZ_GRADES_UNPUBLISHED. Legacy publishQuiz also performs an active lifecycle mutation even though that method did not consistently emit an audit row. The target follows active behavior, not historical logging gaps.

Current vNext adds stronger DRAFT / PUBLISHED / CLOSED / ARCHIVED states plus separate results_published visibility. DB-052 preserves those states while restoring immutable actor/history persistence.

## Legacy UNPUBLISH parity

Pinned legacy behavior actively exposes unpublishQuiz, changing PUBLISHED back to DRAFT. Current vNext quizTransitionSchema exposes only PUBLISH, CLOSE, and ARCHIVE.

DB-052 therefore treats PUBLISHED -> DRAFT as valid database action UNPUBLISH. This is source parity staging, not an API claim. The API phase must expose it or explicitly retire it with product approval.

If attempts already exist, DB-038 still freezes question/option authoring after UNPUBLISH. Unpublish changes learner visibility, not submitted-history meaning.

## Immutable lifecycle event

Staged table: course_quiz_lifecycle_events.

Each event records quiz, college snapshot, delivery audience snapshot, actor user, actor membership when tenant-bound, actor role snapshot, action, previous/new status, previous/new result visibility, lifecycle version before/after, and immutable event time.

Runtime actions are CREATE, PUBLISH, UNPUBLISH, CLOSE, ARCHIVE, RESULTS_PUBLISH, and RESULTS_UNPUBLISH.

BASELINE is reserved for migration-time representation of rows that existed before event history. It intentionally has no actor rather than inventing historical identity.

## Lifecycle version

Promotion adds course_quizzes.lifecycle_version integer NOT NULL DEFAULT 0 with a non-negative check.

Semantics:

- CREATE starts at version 0;
- metadata-only updates keep the version unchanged;
- every status/result-visibility mutation increments exactly once;
- version-only updates are rejected;
- status and result visibility cannot change in the same UPDATE;
- event (quiz_id, lifecycle_version_after) is unique.

## State machine

New rows start DRAFT + results_published=false + lifecycle_version=0.

Allowed status transitions:

- DRAFT -> PUBLISHED;
- DRAFT -> ARCHIVED;
- PUBLISHED -> DRAFT (UNPUBLISH);
- PUBLISHED -> CLOSED;
- PUBLISHED -> ARCHIVED;
- CLOSED -> ARCHIVED.

ARCHIVED has no outgoing status transition.

Publishing also requires the due time not already be past and at least one scored question. DB-038 separately stages full question/option shape and total-point coherence.

Result visibility rules:

- false -> true only while CLOSED;
- true -> false while CLOSED or ARCHIVED;
- results_published=true is valid only for CLOSED/ARCHIVED;
- result visibility and status transition separately so one event has one unambiguous action;
- ARCHIVE preserves the existing result-visibility value.

## Scope/creator identity

The live service does not expose updates to lesson, delivery audience, creator, or creation time. DB-052 freezes those fields after INSERT so direct SQL cannot silently reparent lifecycle history.

Cross-domain lesson/path/offering reparent rules still belong to DB02/DB05/registered DB06 parent guards and must be reconciled at integration; DB-052 does not copy those functions.

## Actor authorization snapshot

The database guard validates the claimed event actor against persisted coarse authorization:

- SUPER_ADMIN: active user + persisted SUPER_ADMIN system role, no tenant membership claimed;
- COLLEGE_ADMIN: ACTIVE same-college membership + persisted COLLEGE_ADMIN role;
- FACULTY: only for a delivery-specific quiz, ACTIVE same-college membership + FACULTY role + active teaching assignment on that exact delivery.

A generic quiz cannot use a FACULTY lifecycle actor because current generic mutation requires courses.manage, which is College Admin or scoped Super Admin rather than ordinary Faculty.

For CREATE, event actor must equal course_quizzes.created_by_user_id.

This does not replace request authorization. It prevents a same-college but ineligible membership from being persisted as lifecycle actor.

## Same-transaction event completeness

A DEFERRABLE INITIALLY DEFERRED trigger on course_quizzes requires the exact matching immutable event before COMMIT.

A second deferred trigger on the event requires its version/new state/result visibility/delivery to equal the final persisted quiz row.

Together they allow row-first or event-first producer order in one transaction while rejecting missing events, orphan events, future/stale events, wrong versions, wrong audience, and fabricated transition shape.

The target deliberately allows at most one lifecycle mutation per quiz per transaction. Current service operations already perform one lifecycle operation per request.

## Honest baseline

Existing rows receive one BASELINE event at version 0. Current status/result visibility and college/delivery are copied; actor fields remain null. occurred_at uses the existing creation time only as baseline timing. This does not claim who performed historical transitions.

## Retention

Lifecycle events reject UPDATE, DELETE, and TRUNCATE. Once events are live, quiz hard DELETE/TRUNCATE is rejected; ARCHIVED is the persisted retirement state.

## Producer cutover

Do not register this candidate by itself.

The compatible cutover must update:

1. createCourseQuiz: create version 0 row plus CREATE event in the same transaction.
2. transitionCourseQuiz: lock/read current row, update one status transition plus next lifecycle_version, insert matching event.
3. API validation: add UNPUBLISH unless product explicitly retires the pinned legacy operation.
4. setCourseQuizResults: update result visibility plus lifecycle_version and insert RESULTS_PUBLISH / RESULTS_UNPUBLISH using the actual actor.

No event may infer actor from created_by_user_id except CREATE.

## PostgreSQL acceptance before registration

Required witnesses include baseline coverage; CREATE event completeness; creator matching; valid/invalid PUBLISH, UNPUBLISH, CLOSE and ARCHIVE transitions; due-time and question requirements; result publish/unpublish rules; version skip/reuse denial; metadata-only version denial; scope/creator identity freeze; generic Faculty denial; assigned delivery Faculty success; College Admin and Super Admin success; forged actor denial; missing/orphan event denial; tenant/delivery mismatch denial; event and quiz retention guards; and concurrent stale-transition rejection.

Until those execute on disposable PostgreSQL replay, DB-052 is source-complete at most and must not be DONE_VERIFIED.
