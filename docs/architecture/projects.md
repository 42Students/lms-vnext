# Projects architecture

## Purpose

Projects vNext keeps the useful behavior of the legacy Projects module while removing the coupling that made template materialization, workspace state and user-facing pages fragile.

The legacy repositories were audited before implementation. Relevant behavior includes reusable templates, project workspaces, mentors/learners, releases, sprints, tasks/comments, resources, meetings, final delivery/review, readiness and activity history. The legacy module also accumulated JSON workspace snapshots beside normalized tables and later needed explicit template snapshots/version fixes. vNext does not carry that hybrid model forward.

## Locked vNext boundaries

Projects is split into bounded subdomains:

1. templates and immutable template versions
2. project instances
3. team membership and mentor assignment
4. workspace/read models
5. releases, sprints and tasks
6. task submissions and final project submission
7. mentor review
8. evaluation

Resources and meetings belong to a project instance. User-facing activity will use the platform activity/event model when that phase is built rather than storing a second generic activity JSON blob inside each project.

## Template contract

Reusable templates are platform-managed in the initial scope.

- only an unscoped SUPER_ADMIN can create, edit, publish or archive a reusable template
- a SUPER_ADMIN can explicitly assign a published template to a college, subject to the selected admin safety scope
- College Admin can read templates assigned to their college but cannot mutate the global reusable source
- college-local template authoring is deliberately deferred until a concrete workflow requires it

A template has a stable root identity and immutable numbered versions. The version owns the blueprint snapshot used for materialization. Updating a template creates a new version; it never rewrites an old version.

The template blueprint is bounded authoring data, so an immutable JSONB snapshot is acceptable at the version boundary. Runtime project state is not stored as a JSON snapshot.

Initial blueprint structure:

- overview
- releases
- sprints, each referencing a release
- tasks, each referencing a sprint
- resources

Keys and sibling sequence positions are unique. References are validated before persistence. Sprints cannot exist outside a release; this preserves the hardening learned in the legacy module.

## Materialization rule

Creating a project from a template is a one-time deterministic materialization operation.

The project instance stores the exact template-version ID it was created from. Materialization copies the version blueprint into normalized instance tables in one transaction.

After creation:

- editing or publishing a newer template version does not mutate existing projects
- project progress/state belongs only to the project instance
- no runtime read path merges live template data into an existing workspace
- no hidden fallback from normalized instance data to template JSON is allowed
- any future "apply template update" feature must be an explicit, reviewed operation with its own conflict rules

This rule is the main regression barrier for the legacy template -> materialization -> workspace failure class.

## Tenant and identity rules

Every project instance belongs to exactly one college.

Project team rows reference canonical college memberships, not raw user IDs. A person can participate through the correct membership when they belong to multiple colleges.

- learner membership must be ACTIVE and have LEARNER for learner participation
- mentor membership must be ACTIVE, belong to the same college and have MENTOR for mentor responsibility
- College Admin manages project instances only inside their college
- same-college members may read only projects they are explicitly authorized to participate in; the service layer must not equate tenant membership with project membership
- SUPER_ADMIN access remains constrained by the selected safety scope

The centralized platform policy provides the coarse tenant gate. Project services must additionally resolve exact project/team ownership server-side.

## Instance model direction

The normalized runtime model will include:

- project_instances
- project_members
- project_releases
- project_sprints
- project_tasks
- project_task_comments
- project_task_submissions
- project_resources
- project_meetings
- project_submissions
- project_submission_reviews
- project_evaluations

Exact table rollout happens in bounded batches rather than one oversized migration.

Project status/progress percentages are derived from lifecycle data where possible. Free-text blocker/next-action fields may exist as explicit operational fields, but they are never trusted as substitutes for task/submission state.

## Submission separation

Task review and final project delivery are different workflows.

A task may carry a learner submission/reference when it moves into review. The final project submission is its own versioned lifecycle with draft/submitted/changes-requested/approved semantics and review history.

Cloud Storage-backed attachments remain dependent on the shared signed upload/receipt workflow. Link/text metadata can be implemented before storage.

## Legacy behavior intentionally not copied

vNext does not copy:

- mutable workspace JSON snapshots as an operational source of truth
- live template fallback during workspace reads
- implicit propagation from template edits into existing projects
- pseudo-members keyed only by user ID
- activity JSON copied from templates
- silent cross-college template reuse
- soft client-only enforcement of lifecycle rules

There is no legacy production data migration for Projects. Legacy code and audits are behavior/regression references only.

## Initial implementation sequence

P1. template contract, validation, permissions and inventory
P2. template/version/college-assignment persistence + APIs + PostgreSQL tests
P3. project instance + deterministic materialization transaction
P4. team/mentor model
P5. releases/sprints/tasks
P6. submissions/reviews/evaluation
P7. resources/meetings/readiness
   - URL/text resources can be added by mentors/admins without pretending to come from a template
   - Cloud Storage-backed resources remain gated on the shared signed-upload workflow
   - readiness is derived from normalized release/sprint/task/final-submission/evaluation state; no manual override is copied from legacy
   - meetings use explicit request/schedule/complete/cancel state with optional sprint/task links
   - no automatic Calendar sync, copied attendee JSON or hidden external side effects are part of the P7 contract
P8. learner/mentor/admin UI and browser regression
