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


## UI2A Faculty teaching workspace

Faculty Course discovery starts from the authenticated active Membership and active `course_teaching_assignments`. The browser never supplies a faculty id or chooses an arbitrary Section.

Routes:

- `/teach/courses` — active exact Section deliveries assigned to the Faculty membership
- `/teach/courses/[deliveryId]` — one exact teaching workspace

The `/teach` route group requires the FACULTY membership role. The service independently revalidates the exact Teaching Assignment so direct URL tampering to a sibling Section fails closed.

The Faculty workspace shows:

- Course, Section, Academic Period and teaching role
- current non-archived Learning Path and lifecycle state
- active Lessons
- shared Offering content versus exact Section content
- Assignment and Quiz definitions visible to the Section
- DRAFT/PUBLISHED/CLOSED assessment states
- a compact draft/published item inventory

Structural Course / Learning Path / Lesson ownership remains College Admin / scoped Super Admin. Shared Offering items are read-only to ordinary Faculty. Exact-delivery Content, Assignments and Quizzes use the existing teaching-scope mutation rules; their authoring controls are intentionally the next UI2B batch.

Ordinary multi-role memberships keep every applicable Course entry point in the shell. A membership with both LEARNER and FACULTY roles can navigate to both My Courses and Teaching Courses without receiving admin navigation.


## UI2B1 Faculty exact-delivery authoring

UI2B1 adds authoring controls only inside the Faculty member's exact active Section Delivery.

Supported draft creation:

- RESOURCE with notes and/or HTTPS URL
- YOUTUBE with validated YouTube URL and authored duration
- LIVE_CLASS with HTTPS meeting URL and start/end timestamps
- Assignment with description, deadline and points
- Quiz with dynamic SINGLE_CHOICE / MULTIPLE_CHOICE questions, options, correctness, points and attempt limit

VIDEO and file-backed RESOURCE creation remain hidden until the signed Cloud Storage upload-receipt workflow exists. The UI never accepts or invents raw storage keys.

All Faculty-created items include the exact Delivery id in the request. Existing domain services re-check the active Teaching Assignment server-side, so changing client payload ids cannot grant access to a sibling Section.

Lifecycle controls are derived from a pure client state model but remain advisory only; server services are authoritative:

- exact DRAFT content/assignment/quiz -> publish or archive
- exact PUBLISHED content/assignment -> archive
- exact PUBLISHED quiz -> close or archive
- exact CLOSED quiz -> archive
- shared Offering items -> no Faculty mutation actions

New items are deliberately created as DRAFT so a teacher can review the generated learner-facing shape before publication.


## UI2B2 Faculty assessment review and grading

UI2B2 completes the Faculty assessment operations loop inside the exact teaching workspace.

Assignment review:

- PUBLISHED shared-Offering and exact-delivery Assignments can be reviewed for the Faculty member's exact Section Delivery
- submission review payloads include learner display name/email from the Membership -> User identity graph
- TEXT responses render inline and HTTPS LINK responses open explicitly
- points + optional feedback use the existing expected-version optimistic concurrency contract
- stale grade writes fail rather than overwriting another grader
- grade publication is explicit and separate from grading
- regrading a published grade automatically returns it to unpublished state until republished
- learner feedback remains private until publication

Quiz review:

- PUBLISHED/CLOSED Quiz attempts can be reviewed for the exact Section Delivery
- learner identity, score and immutable submitted question/option snapshots are presented together
- correctness review never depends on the mutable live Quiz key
- exact-delivery CLOSED Quizzes allow Faculty to publish or hide results
- shared-Offering Quiz result publication stays College Admin / scoped Super Admin owned because it affects every Section using that shared Quiz
- Faculty may still review their own Section's attempts for a shared Quiz

The UI action model is covered independently from rendering so future styling changes cannot accidentally grant shared-Offering result control or publish an ungraded Assignment.


## UI3A College / Super Admin structural Course operations

UI3A exposes the C1 structural graph through the existing admin design system for both College Admin and college-scoped Super Admin.

Routes:

- /college/courses — the active membership's college
- /admin/courses — the Super Admin's selected college safety scope

Both routes use the same server-composed Course workspace. Super Admin never receives an unscoped global Course management surface.

The structural workspace provides:

- active Department-owned Course catalog
- Cohort + Academic Period Course Offerings
- exact Offering -> Section Deliveries
- exact Delivery -> Faculty Teaching Assignments
- active Faculty Membership choices from the People domain
- compact counts for Courses, Offerings, Deliveries and Teaching Assignments

Mutations reuse the existing server services and dependency guards:

- Course create/edit/archive
- Offering create/edit/archive
- Section Delivery create/end
- PRIMARY / CO_TEACHER / TA Teaching Assignment create/end

The client filters Section choices to the selected Offering's exact Cohort + Academic Period, while the server remains authoritative and rejects invalid scope, closed Periods, incompatible Sections, duplicate primary teachers and cross-college Faculty.

Archive/end controls preserve history and surface dependency conflicts instead of cascading deletion.

Shared Learning Path / Lesson / Offering-wide content authoring is intentionally separated into UI3B so the structural administration page does not become a single overloaded form.


## UI3B Admin shared learning authoring

UI3B adds an Offering-level shared-learning workspace for College Admin and college-scoped Super Admin.

Entry points:

- Course Offerings expose an Open learning action
- /college/courses/offerings/[offeringId]
- /admin/courses/offerings/[offeringId]

The server resolves the Offering's Course, Cohort and Academic Period, then requires courses.manage for that exact college. A Super Admin still requires the selected college safety scope.

Shared structure operations:

- create/edit/publish/archive the current Learning Path
- create/edit/reorder/archive Lessons
- create Offering-wide RESOURCE, YouTube, live-class, Assignment and Quiz drafts
- publish/archive shared content and Assignments
- publish/close/archive shared Quizzes
- publish or hide shared Quiz results only after CLOSE

The existing Faculty lesson-item builder now accepts an explicit audience mode. Faculty continues to pass an exact Section Delivery; Admin passes null for Offering-wide items. This keeps one validation-aware authoring implementation without weakening server authorization.

The Offering workspace intentionally returns only generic shared items. Section-specific items stay in the exact Faculty teaching workspace, so Admin shared authoring does not accidentally become a cross-Section content editor.

File/video upload authoring remains hidden until the signed Cloud Storage upload-receipt workflow exists.
