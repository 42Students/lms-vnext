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

## Interaction boundary

UI1 is the read/navigation surface. It intentionally does not fake unsupported interactions:

- RESOURCE completion
- Assignment TEXT/LINK submission
- Quiz taking
- video playback/resume
- Course authoring

Those actions are implemented in the existing APIs/domain services and will be wired into dedicated client interaction components in the next learner UI pass.

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
