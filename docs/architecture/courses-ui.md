# Courses UI architecture

## UI1 learner Course workspace

The first Course UI batch is deliberately learner-first because the C1-C4C backend already provides one exact-delivery read model for the learner experience.

Routes:

- `/learn/courses` — current Section Course overview
- `/learn/courses/[deliveryId]` — one exact Course Delivery workspace

The `/learn` route group requires an active LEARNER membership. The shared shell exposes My Courses only for learner memberships; College Admin and Super Admin keep their existing structural navigation, while Faculty/Mentor navigation remains unchanged until the teaching UI batch.

## Course overview

The overview uses the learner's active Section deliveries and the composed Course workspace to show:

- Course name/code/description
- Academic Period
- Section
- credits
- Learning Path readiness
- overall progress
- the next cross-item learning action

The overview is intentionally card-based rather than an admin table because the learner's primary task is continuation rather than record management.

## Course workspace

The detail page renders the C4C domain output directly:

- Course + Learning Path heading
- Continue Learning CTA
- overall progress
- lesson/assessment summary metrics
- Lessons in canonical sequence
- unified Content / Assignment / Quiz order inside each Lesson
- content progress
- Assignment submission/grade state
- Quiz attempt/result state
- missed assessments

The UI does not reimplement progress rules. Completion, missed state, grade privacy, exact Section targeting and Continue Learning ordering come from the server domain service.

The legacy-compatible `nextContent` output remains available to other callers; the learner UI uses `nextItem`.

## UI1b learner interactions

UI1b turns the read-only workspace into a usable learner workflow without moving domain rules into React.

Implemented interactions:

- externally accessible RESOURCE items can be marked complete through the C3 progress API
- Assignments accept one final TEXT or HTTPS LINK submission
- published Assignment grades include feedback only after grade publication
- open Quizzes can be attempted/retaken while attempts remain
- SINGLE_CHOICE and MULTIPLE_CHOICE inputs are rendered from the learner-safe Quiz payload
- unanswered Quiz questions are explicitly warned before final submission
- Quiz scores and answer correctness are never shown while the Quiz is open
- CLOSED + results-published Quizzes render immutable submitted-attempt snapshots rather than the live answer key
- every successful mutation refreshes the canonical server workspace so progress and Continue Learning remain server-derived

Client interaction state is centralized in a small pure model and covered by unit tests so visual refactors cannot accidentally reopen a submitted Assignment, CLOSED Quiz, exhausted Quiz, or unsupported media-completion action.

Still intentionally deferred:

- VIDEO/YOUTUBE playback and resume controls
- storage-backed RESOURCE/video delivery
- Assignment FILE uploads
- Course authoring/teaching operations

Cloud Storage-backed video/file delivery remains deferred until the canonical signed-upload/signed-read workflow exists. The UI does not expose raw storage keys.

## Design system

Course UI reuses the vNext system:

- existing AppShell
- canonical teal/neutral tokens
- PageHeader
- StatusBadge
- EmptyState
- existing focus-ring/accessibility conventions

No separate Course theme or legacy page CSS is introduced.
