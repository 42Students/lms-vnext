# Mentor — Detailed Page Parity Spec

Legacy primary navigation: Projects, Meetings, Notifications.

## Page: Mentor landing

**Source-only implementation update:** Mentor-only navigation now exposes Projects, Meetings, and Notifications in legacy order. The Mentor landing and Meetings calendar already exist in vNext; full browser, upstream and tenant-policy verification remains.

**Legacy:** `/mentor`

Legacy behavior:
- if Projects is enabled, route into Projects;
- if Projects is unavailable, render a clear unavailable state rather than a 404;
- retain access to Notifications.

- [ ] Feature/module-availability decision is authoritative.
- [ ] Projects-enabled path lands correctly.
- [ ] Projects-disabled state explains unavailability.
- [ ] Notifications remains reachable from unavailable state.
- [ ] Non-Mentor access is fenced.

## Page: Projects list
- [ ] Only projects assigned to the Mentor are shown.
- [ ] Project title/status/team/progress/last-activity signals match.
- [ ] Attention/stalled/review-needed indicators match where legacy exposes them.
- [ ] Archived projects are visually/read-only differentiated.
- [ ] Search/filter/sort behavior is matched if present.
- [ ] Loading/empty/error states.
- [ ] Project click opens correct workspace.

## Page family: Project detail

### Overview
- [ ] Project narrative/status/goals match.
- [ ] Learner final submission/review status is visible.
- [ ] Review/approve/reopen/request-revision actions match.
- [ ] Review history/feedback state is preserved.
- [ ] Archived/read-only behavior is enforced.

### Team
- [ ] Team members and roles match.
- [ ] Mentor/team-management actions allowed in legacy are matched.
- [ ] Meeting-request attention is visible where legacy places it.
- [ ] Team/contact context does not expose unrelated learners.

### Sprints
- [ ] Sprint list/current state matches.
- [ ] Sprint create/edit/status/date actions allowed to Mentor match.
- [ ] Sprint goals/acceptance criteria/release linkage match.
- [ ] Empty/error states.

### Tasks / Board
- [ ] Board/list lanes and statuses match.
- [ ] Task create/edit/assign/prioritize/estimate actions match Mentor permissions.
- [ ] Task detail and learner submission/review actions match.
- [ ] Sprint linkage is preserved.
- [ ] Empty/loading/error states.

### Resources
- [ ] Link/file/resource fields match.
- [ ] Pinned/required state matches.
- [ ] Add/edit/remove actions match.
- [ ] Storage-backed uploads remain explicit BLOCKED work until provider is live.

### Meetings
- [ ] Meeting list and lifecycle match.
- [ ] Schedule/confirm/reschedule/decline/cancel/complete actions match.
- [ ] Requested meetings remain actionable even after requested date passes.
- [ ] Date/time/timezone behavior matches.
- [ ] Agenda/notes/link fields match.

### Delivery
- [ ] Final delivery/submission state matches.
- [ ] Review/approve/reopen/request-revision behavior matches.
- [ ] Feedback and audit timestamps match.
- [ ] Archived behavior.

### Activity
- [ ] Activity feed event types match.
- [ ] Chronological ordering/timezone matches.
- [ ] Stale-project signal uses real activity signal and does not false-positive.
- [ ] Empty/loading/error states.

## Page: Meetings

**2026-10-13 implementation improvement:** viewer-time initialization is
deferred until the browser is mounted, retaining server-safe initial state
and a minute refresh without synchronous cascading React state updates.
Browser verification is still required.

**Legacy:** `/mentor/calendar`

Audited behavior:
- aggregates meetings across assigned projects;
- Upcoming vs Past & Cancelled;
- REQUESTED remains Upcoming/actionable even if its requested time is in the past;
- timezone-aware viewer instant;
- rows deep-link to the project;
- past preview with Show all/fewer;
- skeleton, retry error, empty states.

- [ ] Cross-project aggregation is implemented.
- [ ] Upcoming/Past & Cancelled partition matches.
- [ ] REQUESTED special case matches.
- [ ] Timezone conversion matches.
- [ ] Meeting row project deep links work.
- [ ] Past preview/show-all behavior is accounted for.
- [ ] Loading/error/empty states match.

## Page: Mentor Notifications
**Legacy:** `/mentor/notifications`

Audited notification kinds:
- broad announcements;
- personal notifications;
- submission waiting for review;
- stalled project;
- requested meeting;
- upcoming meeting within 48h;
- archived projects excluded;
- reopened delivery must not falsely re-notify as fresh learner submission.

- [ ] Announcement feed is included.
- [ ] Personal notification feed is included.
- [ ] Fresh learner submission -> review-needed signal is correct.
- [ ] Reopened delivery does not create false review notification.
- [ ] Stalled project logic matches and excludes no-signal false positives.
- [ ] Requested meeting signal matches.
- [ ] Upcoming meeting 48h signal matches timezone-aware logic.
- [ ] Archived projects generate none of these project notifications.
- [ ] Deep links point at the correct project section.
- [ ] Loading/error/empty "nothing needs attention" states match.

## Explicitly retired Mentor stubs
Legacy Courses, Contacts, All Quizzes, File Explorer and Profile routes are server-side redirects/stubs.

- [x] Courses stub classified RETIRED.
- [x] Contacts stubs classified RETIRED.
- [x] All Quizzes stub classified RETIRED.
- [x] File Explorer stub classified RETIRED.
- [x] Profile stub classified RETIRED.

## W03 implementation checkpoint (2026-10-10) — partial, not parity-verified

Legacy oracles for this batch: FE `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`, BE `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`. Current implementation is on `main`; see `docs/planning/w03-projects-closure-tracker.md` and issue #23.

- `/mentor` now checks Projects optional-module access and redirects to `/mentor/projects` when enabled; disabled state links to Notifications.
- `/mentor/projects` and `/mentor/projects/[projectId]` now fail closed for disabled Projects; project list/detail enforce current platform-account and membership-role reads.
- `/mentor/calendar` now lists meeting rows for the authenticated same-college active Mentor only, with Upcoming/Past & Cancelled, overdue REQUESTED handling, 20-row past preview, show-all toggle, timezone-aware display, join URL sanitization, skeleton and retry boundary. Meetings use the persisted `timestamptz` instants rather than parsing legacy date/time strings.
- `/mentor/notifications` now reuses W06's personal inbox and derives project review/stalled/meeting attention from authorized project records, excluding archived projects. Shared announcement producer and final source parity remain open.
- Scheduling/cancellation uses conditional SQL writes to prevent stale statuses from overwriting competing meeting transitions.
- Pure Vitest and PostgreSQL integration regression cases have been **authored** but cannot yet be considered passed; GitHub CI fails with no runner steps and no disposable PostgreSQL/browser result.

**Do not tick the page contract above as fully CLOSED:** navigation shell, feature-policy failures, all tab/detail workflows, latest production UI fidelity, activity completeness, mobile/browser, privacy/storage-backed resource uploads and source semantic mappings remain unverified. W01 owns shared sidebar navigation and the migration journal. W06 owns shared inbox/announcement infrastructure.


## Mentor portfolio review queue and activity (2026-10-14)

Source-authored, read-only `/mentor/reviews` and `/mentor/activity` are
reachable from the existing Projects screen. Review queue filters the persisted
assigned-project submission alerts to actual pending final-delivery reviews,
with search and pagination, and links to existing authorized Delivery review
controls. The activity page projects fixed safe labels from registered
`activity_events` tied to active same-college Mentor project assignments;
raw event summaries, actor details and metadata are not returned.
Both require current MENTOR role, central projects.read college permission,
optional Projects enablement and active assignment. Invalid URL filters fail
closed. Denial-path PostgreSQL tests and pure model tests are authored, NOT
represented as executed evidence. Legacy full history coverage, response
analytics, browser/mobile evidence and independent functional verification
remain open. No parity checklist boxes are checked solely from source work.

## Mentor Task/Board pending submissions (2026-10-14)

Source-authored read-only `/mentor/task-reviews` lists persisted SUBMITTED
task versions that are still IN_REVIEW on currently assigned active Mentor
projects. Central projects.read, current Mentor role and college scope,
optional Projects access and persisted project memberships constrain each read.
Strict Zod query filters, bounded search/pagination, module-disabled/empty/error
states and unit/DB denial tests are authored. This is distinct from the
final-delivery `/mentor/reviews` queue. Existing project Board controls remain
responsible for authorized task review writes. Full legacy task-detail and
positive database/browser acceptance remain OPEN, with no checkbox claimed DONE.

## Mentor project team membership lifecycle (2026-10-14)

The read-only `/mentor/projects/[projectId]/team-history` is accessible
from the existing Mentor workspace. It shows registered P4 project_members
`started_at` / `ended_at` lifecycle rows with filters for all, open or
ended membership records. Authorization requires a persisted active Mentor
assignment for the exact requested project, matching current college and
central projects.read; optional-module disablement produces an honest notice.
Former/inactive member names are withheld. Dates are presented in IST; missing
pre-migration history is not fabricated. Pure model and PostgreSQL denial
tests are authored but not run, and exact legacy team-management actions,
complete audit history and browser acceptance remain OPEN. No parity row or
checklist is marked DONE.

## Mentor completed delivery decision history (2026-10-14)

Read-only `/mentor/review-history` aggregates persisted
`project_submission_reviews` across projects that have current, same-college
Mentor assignment membership. It uses only migrated Project P6 review,
submission and project-instance tables, central projects.read and active role
scope, bounded Zod decision/pagination filters, and an honest empty or
module-disabled state. Records describe project review decisions, not decisions
personally made by the viewing Mentor; names, raw feedback and learner details
are omitted. Linked from the existing pending delivery-review queue; writes
remain exclusively inside the authorized workspace. Unit and disposable DB
denial tests are authored but not executed; former assignments, pre-migration
history and full legacy/browsers parity remain OPEN and PARTIAL.

## Mentor sprint/release progress portfolio (2026-10-14)

New read-only `/mentor/sprint-progress` shows persisted sprint statuses,
release status, and counts of registered Done, In Review and Blocked tasks
over the Mentor's current same-college assigned non-archived projects.
It derives the allowlist from the existing live Mentor membership join, checks
central projects.read, supports strict Zod search/state/page filters and
uses SQL counts for accurate pagination; task status groups are read only for
the twenty current-page sprints. Zero-task completion is Unknown rather than
100%. The new page links to existing authorized Sprint controls and does not
represent elapsed hours, velocity, historical assignments or release readiness.
Pure tests and disposable PostgreSQL denial tests are authored but not
executed. Full legacy Sprint parity and browser acceptance remain OPEN; the
parent Sprint row stays PARTIAL.

## Mentor personal notifications pagination and announcements (2026-10-14)

The existing `/mentor/notifications` page now reads personal notifications
through the shared owner-scoped keyset page service (50 records per page,
all/unread views, unread count, mark-all-read toolbar) instead of truncating
to 60 latest messages. Malformed/incomplete cursors are rejected with an
explicit recovery link, never a fabricated empty feed. A dedicated persisted
active MENTOR membership/role check precedes personal reads and uses central
academics.read same-college permission; user identity comes only from the
server request context. The existing project review/meeting/stalled attention
cards remain subject to optional Projects enablement and active membership
scope. The existing college-audience announcement feed is now visible via
the same enabled reader used by Faculty; no new announcement or read-write
routes were created. The previously established notification API controls
continue handling read acknowledgments with same-origin checks.
Pure-model and disposable PostgreSQL denial tests are authored, not claimed
executed. Complete legacy notification producers, scrolling behavior,
mobile/browser validation and independent CI remain OPEN; parity is PARTIAL.

## Mentor Board reviewed task-submission history (2026-10-14)

The read-only `/mentor/task-review-history` supplements pending task reviews
with persisted P6 task submission decisions (APPROVED, CHANGES_REQUESTED),
ordered by actual review time. Only currently assigned same-college Mentor
projects are eligible, with central projects.read, active role and optional
Projects module access. Zod filters, 20-row pagination, loading/error/disabled
and honest empty states are authored. No raw feedback, learner identities,
submission URLs or individual reviewer claims are exposed. The pending queue
links to the new history and existing authorized Board review controls.
Pure-model/unit and disposable PostgreSQL denial tests are authored, not
executed. Full legacy Board functionality and browser evidence stay PARTIAL.

## Mentor exact-project activity history (2026-10-14)

The new read-only `/mentor/projects/[projectId]/activity-history` subpage is
linked from the existing Mentor Project workspace. The reader checks active
Mentor role, central projects.read and persisted exact-project assignment
through requireProjectReadAccess, plus optional Projects enablement; a strict
Zod UUID/importance/page query limits input. Registered `activity_events`
are filtered to the same college, organization and exact project by subject
or persisted metadata projectId, with SQL pagination and a known safe label
mapping. Raw event summaries, metadata, actor names and IDs are never shown.
Loading/error, disabled/empty and pagination states are authored, as are
unit and disposable PostgreSQL denial tests. This remains PARTIAL: audit
producer completeness, legacy event coverage and browser verification are open.

## Mentor positive PostgreSQL fixture coverage and audited task decisions — authored, not executed (2026-10-14)

Added test-owned `chat4-positive-*` template/project fixtures that exercise
successful active Mentor team history/coverage, sprint status,
task-review queue/history, exact-project activity, owned notifications and
read acknowledgment. Real task submissions are reviewed with both APPROVED
and CHANGES_REQUESTED, and the tests assert one persisted
`projects.task.reviewed` event per successful decision with scoped actor,
college, project/task/version/decision metadata. Unauthorized or repeated
reviews must produce no additional audit row. The existing same-origin
POST route, strict Zod validator, persisted Mentor lifecycle authority and
transaction-locked task/submission updates are retained; the decision audit
is inserted into that transaction, with no raw feedback in metadata.
Positive cases remain unexecuted pending disposable DB, CI and browser proof.
Mentor Board and notifications parity remain PARTIAL.

## Mentor sprint details write — source-only PARTIAL (2026-10-14)

The existing Project workspace now provides a two-step **Edit sprint** dialog
and confirmation for registered `project_sprints.title` and `description`.
The endpoint `PATCH /api/projects/[projectId]/sprints/[sprintId]`
enforces `isSameOriginRequest`, strict Zod params/input,
`requireProjectLifecycleAccess` backed by a current persisted same-college
Mentor assignment or authorized Project manager, central `projects.read`,
and Projects module availability. The transaction locks the project/sprint,
rejects archived/completed project, completed sprint, shipped release,
unchanged input and stale `expectedUpdatedAt`, and atomically writes the
new timestamp plus a safe `projects.sprint.updated` actor/college audit row.
No dates, goals, task states, release links or template keys are invented.
Pure-model tests and a disposable PostgreSQL fixture suite covering a
successful edit/audit plus forged Mentor, foreign college, stale version and
untrusted field denial are authored. They require independent execution.
The Project Sprints parent row remains PARTIAL pending verified browser,
accessibility, fresh-DB regression and full legacy controls.

## Mentor task metadata PATCH — source-only PARTIAL (2026-10-14)

A new two-stage, mobile-friendly **Edit task** dialog on the existing Mentor
Project Board edits only registered `project_tasks.title`, `description`,
`acceptance_criteria` and `priority`. It uses a review/confirmation step and
a same-origin `PATCH /api/projects/[projectId]/tasks/[taskId]/details` route.
Strict Zod input rejects injected tenant IDs, assignment/sprint fields and
workflow status. The service obtains current persisted Mentor/project lifecycle
access, central `projects.read` and the optional Projects module, then
transaction-locks the exact same-college project and task. It rejects shipped
releases, completed sprints, completed or in-review tasks, no-ops, and stale
millisecond `expectedUpdatedAt` tokens, accounting for PostgreSQL's
microsecond timestamp storage. A committed update produces exactly one
sanitized `projects.task.details_updated` actor/college audit inside the same
transaction, with changed field names but no private description or learner
submission URL in metadata. Existing Board status transitions and review
actions remain separate. Tests include Zod/route unit assertions and a real
disposable-PostgreSQL fixture covering a successful update and audit,
forged-member, cross-college, stale-token and untrusted-field denials,
with unique template/project names and full event/fixture cleanup.
These tests are authored **but not executed here**; do not mark Board
or task reviews DONE without fresh-DB, lint, typecheck and mobile/browser
proof. No unmigrated assignee/workload data has been invented.

## Mentor Sprint creation and optimistic lifecycle control (2026-10-14)

Added Mentor-only create in the Release workspace, and Start/Complete/Reopen
confirmation-gated actions using current persisted sprint timestamp tokens.
Strict Zod rejects caller-supplied dates, tenant IDs and unregistered fields.
This is intentional: `project_sprints` has no registered start/end date
columns. A release-linked planned Sprint is inserted transactionally under a
project row lock with a unique template key and next persisted sequence.
Transitions check active Mentor project membership, central projects.read,
module enablement, release state, other active sprints, and open-task status
before updating. Every committed create/status change records a sanitized
actor-and-college activity row in the same transaction. The UI explains that
dates cannot yet be saved; only ISO offset timestamps are accepted as
optimistic tokens and no IST-local date string is silently coerced.
Pure-model and isolated PostgreSQL positive/stale/foreign/forged tests are
authored; executed current-SHA lint, typecheck, browser and DB acceptance
are still OPEN and Project Sprints remains PARTIAL.

## Mentor notification acknowledgment scope and transaction (2026-10-14)

The existing `/mentor/notifications` page and owner-only inbox reader now
reconfirm the persisted active Mentor role and current college. The notification
list and confirmed bulk read control use Mentor-only same-origin POST routes,
not generic recipient-only endpoints. Mutation bodies accept only empty JSON
(Zod strict); recipient identity and college come from the signed-in membership.
Single and bulk acknowledgments update only notifications whose event belongs
to that college, inside a transaction that records one sanitized actor/college
identity audit for real changes. Repeated reads and an empty bulk action are
idempotent without extra audits. Cross-college notifications are excluded from
inbox paging, unread counts and writes; project alerts/announcements remain
separately handled. A unique-actor disposable PostgreSQL test exercises
single/bulk success, forged role, suspended membership, foreign-college
denial, idempotency, audit and full fixture cleanup. Unit tests cover invalid
mutation bodies. Authenticated browser and current-SHA PostgreSQL/CI
execution remain open; Mentor Notifications is PARTIAL.

## Mentor Project Overview recorded review/feedback completeness (2026-10-14)

The read-only `/mentor/projects/[projectId]/review-completeness` page
presents registered final-delivery versions, their persisted status,
submission/review timestamps, recorded decision and whether nonblank written
feedback exists. It distinguishes a draft, an unreviewed submitted version and
a recorded approval/revision decision without claiming that missing historic
records or optional feedback imply a policy violation. Raw review text, learner
identity and archived/unavailable histories are not fabricated. Authorization
is exact-project `projects.read` and persisted current assigned Mentor grant;
Zod pagination is capped at 10 versions per page, with mobile cards and honest
empty/disabled/loading/error states. The existing Project Overview links to
this view; Delivery remains the only write path. Unit/helper tests and
same-project positive empty/foreign-role denial in the existing unique-fixture
PostgreSQL suite are authored. Execution/browser and full legacy Overview
acceptance remain PARTIAL.

## Mentor Project task creation (2026-10-14)

An actively assigned Mentor can create a registered TODO task within an active/planned Sprint with persisted title, description, acceptance criteria, priority and sequence. Confirmation UI explains that this changes the Board and records an audit event. POST /api/projects/[projectId]/tasks validates strict Zod inputs and same origin, requires a persisted current Mentor project grant and central projects.read, and uses a locked project/Sprint transaction with optimistic sprint timestamp and immutable projects.task.created audit. Sequence uniqueness is enforced by the migrated table. PostgreSQL success/foreign/wrong-role/stale tests have been authored using unique project/template fixtures, cleaning mutable test records but never deleting from append-only audit tables. Assignment and workload fields remain explicitly blocked by the missing registered columns. Browser/real-DB execution and complete legacy parity remain PARTIAL.

## Mentor team & meeting log (2026-10-14)

The read-only /mentor/projects/[projectId]/team-meetings page combines exact-project current Learner/Mentor role-backed member counts and registered project_meetings records with REQUESTED/SCHEDULED/COMPLETED/CANCELLED filters and 20-row pagination. The live Mentor project grant, central projects.read and optional Projects enablement are checked before querying. The UI shows meeting type, status, recorded start time and timezone, and whether an outcome exists without exposing raw outcome text, meeting URLs or personal member contacts. Loading/error, mobile cards, disabled and honest zero-meeting states exist. An isolated PostgreSQL integration test inserts a real REQUESTED meeting and checks counts, filtering and wrong-role/foreign-project denials. Tests are authored, not executed in this chat. Lifecycle writes, complete history and browser parity remain PARTIAL.

## Mentor project closeout to registered COMPLETED status (2026-10-14)

An assigned active Mentor can inspect the exact-project closeout checklist at
`/mentor/projects/[projectId]/closeout` and confirm the registered ACTIVE →
COMPLETED transition by submitting three affirmative declarations. The
authoritative service locks the project row, verifies an optimistic
updatedAt token, checks latest final delivery APPROVED and verifies that all
persisted Tasks are DONE, Sprints COMPLETED, and Releases SHIPPED. The
transaction records one immutable projects.project.completed actor/college
audit. Strict Zod, projects.read/active assignment/module guards and
same-origin POST are included; forged scopes and stale tokens are denied.
An in-test project/template fixture and PostgreSQL success/denial tests are
authored. The registered enum has no REVIEWED or CLOSED values, so distinct
review-state closeout and sign-off remain BLOCKED pending schema/product
disposition. Positive PG/browser evidence is pending; parity remains PARTIAL.

## Mentor project Release/Sprint timeline read (2026-10-14)

Read-only `/mentor/projects/[projectId]/timeline` displays registered
release order, lifecycle status, contained sprint order/status and Done-task
progress for each Sprint. It scopes to the active Mentor's persisted
same-college project membership, central projects.read and module policy.
Strict Zod filters/paging, mobile milestone cards and loading/error/empty
states are present. A zero-task sprint shows Unknown progress, not 100%.
Registered releases/sprints have no planned start/end dates; dates, velocity
and forecasts are not fabricated. Pure-model tests and a new positive
registered Release/Sprint assertion with forged/foreign-scope denials
in the existing passing fixture suite are authored, not executed here.
Full legacy planning and browser parity remain PARTIAL.

## Mentor task comments / feedback thread (2026-10-14)

**PARTIAL / missing migrated table.** Registered `project_task_submissions`
stores only a nullable `feedback` string for each reviewed submission version.
There is no promoted `project_task_comments` or conversation/reply table.
A read-only `/mentor/projects/[projectId]/tasks/[taskId]/feedback` page therefore
shows only actually persisted version-specific review feedback and explicitly
explains that threaded comments and a composer are **unavailable**. The reader
requires a currently assigned Mentor on the exact project, `projects.read`,
same-college scope and existing Projects enablement, and selects task feedback
without exposing learner identity, submission URLs or private notes. Zod UUID
validation, loading/error/retry and real no-feedback empty states are present.
The reviewed-task history links to this exact-project page. Full comments,
replies, attachments, notification producers and parity remain blocked until
the DB owner promotes an authoritative schema and the product owner approves
visibility and edit/delete rules. This does **not** certify Board parity.

## Mentor project delivery review completeness (2026-10-14)

PARTIAL: `/mentor/projects/[projectId]/review-overview` reads registered
`project_submissions` and optional `project_submission_reviews` for the
exact project currently assigned to the active Mentor. It requires central
projects.read, persisted same-college project access and enabled Projects.
Twenty delivery versions per page show actual DRAFT/SUBMITTED/APPROVED/
CHANGES_REQUESTED state, review timestamp, and only the presence/absence of
written feedback. The page distinguishes no delivery, submitted without
review, approved without feedback and changes requested with feedback.
Raw feedback text, private URLs and reviewer identity are not shown. Counts
are explicitly page-local, not invented lifetime metrics. Zod, loading/error,
honest empty states and existing authorized Delivery workspace navigation are
provided. Former-assignment history, missing producers, full privacy/browser
verification and exact legacy parity remain open.

## D — Mentor live-team coverage read polish (2026-10-14)

The existing read-only cross-project `/mentor/team-coverage` now joins
registered membership_roles against each active project-member role, excluding
revoked grants even if a project_members row was not end-dated. The authorized
current non-archived project count is separate from filtered match counts;
honest empty states distinguish no active Mentor projects from a no-match
search/filter. Per-project active learner, Mentor and primary-Mentor
indicators remain grounded in migrated rows; project list totals do not
claim staffing adequacy. Links lead to the existing exact-project meeting log,
team controls and historic membership view, never raw private member data.
Pure unit and seeded positive/role/foreign-denial PostgreSQL assertions
are authored but not locally executed; mobile/browser and product parity
remain PARTIAL.

## 2026-10-14 Mentor project task-board read overview (PARTIAL)

Added `/mentor/projects/[projectId]/board-review`: scoped active Mentor,
college, optional Projects module and exact project access; registered
task-state totals, a completion percentage only when tasks exist, status and
title/sprint search, 20-row pages with honest no-match and no-task states.
The page links back to existing task workspace, exposes no private learner
submission and **does not invent task assignees, estimates or workloads**.
A pure model and unique-fixture disposable PostgreSQL read/role/foreign-selector
test are authored. Browser, eslint/TypeScript and PostgreSQL evidence remain open.

## 2026-10-14 Mentor pending review exact-task focus — PARTIAL
The registered pending queue now links to the exact task card, escapes literal
search wildcard input and clamps out-of-range pages. A latest-submission guard
excludes superseded versions. Existing permitted project review mutations,
same-transaction audit and approval/revision guards are reused (no duplicate
write endpoint). Still open: independent PostgreSQL, unit, lint, TypeScript and
mobile browser verification; detailed legacy review history and feedback UX.

## 2026-10-14 Mentor meeting completion/cancellation concurrency (PARTIAL)
Added a Mentor-only confirmed POST decision route for persisted project meetings,
with same-origin enforcement, exact active project-member scope, row locks,
millisecond-normalized version compare-and-swap, and immutable activity audit in
the same transaction. Existing Learner/Admin meeting routes remain unchanged.
The shared mobile meeting dialog now submits the existing meeting version for
Mentor decisions. Pure-model unit and independently created Mentor/Learner
PostgreSQL fixtures cover success, foreign-scope, wrong-role, stale replay
and audit. Remains PARTIAL: run tsc/eslint/PG/unit, browser/legacy review,
schedule-reschedule auditing and historical completeness.

## 2026-10-14 Mentor project final delivery decision CAS/audit (PARTIAL)
For existing persisted SUBMITTED delivery rows, Mentor now uses an exact-project
same-origin POST command with confirmed millisecond token, project/submission
row locks, SQL normalized timestamp CAS and immutable `projects.delivery.reviewed`
event in the same transaction as both status and review history insert.
Existing Admin and Learner submission paths remain unchanged. The existing
mobile review dialog sends the token. Unit and disposable PG fixtures cover
default `now()`, approval, stale replay, foreign scope, wrong-role and audit.
Still PARTIAL: execute tests and responsive browser acceptance, legacy review
history and revised submission cycle.

## 2026-10-14 Mentor task-review optimistic feedback (PARTIAL)
Existing same-origin review POST now requires Mentor decisions to include a confirmed
submission update token. The stored row lock and SQL millisecond predicate fence
a stale review without bypassing existing immutable task-review audit; Admin
direct calls remain compatible. The responsive review dialog supplies the token.
Added pure model/unit tests and an own-project disposable PostgreSQL test for
default SQL now(), Mentor success, stale replay, wrong-role, non-leaking foreign
scope and single review audit event. Still PARTIAL: CI/PG/browser/mobile and
legacy review-history verification; do not fabricate task-comments storage.


## 2026-10-14 chat-11 A — Mentor task status transitions (PARTIAL)

The existing Mentor Board now offers confirmed TODO/IN_PROGRESS/BLOCKED state
transitions using a dedicated same-origin PATCH endpoint, strict Zod validation,
current live assigned-Mentor college scope and central projects.read.
The service locks the Project, Task and Sprint, rejects shipped releases and
non-active Sprints, compares PostgreSQL microsecond timestamps at millisecond
precision in SQL, and records a same-transaction immutable actor/college
before/after activity event. Direct DONE and IN_REVIEW transitions are reserved
for versioned submission review, so Mentor cannot bypass the review record.
Admin legacy controls remain unchanged. Source-authored pure and PostgreSQL
tests cover valid writes, audit, forged inputs, stale replay and role/foreign
denial. **PARTIAL:** checks are not executed in this session; mobile/browser,
exact legacy Board controls, task assignees and workloads remain outstanding.


## 2026-10-14 chat-11 B — Mentor Board/Sprint filters and exports (PARTIAL)

The exact-project Mentor task-board status page now filters by registered Sprint
ID, status, priority and literal title/Sprint search. Existing per-state totals
remain whole-project counts while displayed/exported rows honor the selected
filters. A same-college/current-assigned-Mentor GET route exports at most 500
task rows to UTF-8 formula-neutralized CSV with a truncation count. Cross-project
Sprint progress adds a filtered, current-Mentor-only export capped at 100 rows,
also neutralized and explicitly truncated. Neither export invents assignees,
workload, velocity or readiness. Unit tests and a new isolated positive/foreign/
wrong-role PostgreSQL board-export fixture are authored. **PARTIAL:** real
typecheck, ESLint, unit, PostgreSQL, download/browser and legacy filters
verification remain open; full-scale streaming is not implemented.


## 2026-10-14 chat-11 C — Completed team meeting notes (PARTIAL)

The registered `project_meetings.outcome` field now has a dedicated current
assigned-Mentor detail/edit surface for COMPLETED meetings only. The scoped read
allows the Mentor to see existing post-meeting outcome text, while the confirmed
same-origin PATCH validates nonempty up-to-4000-character notes, locks project
and meeting, rejects archived projects and stale tokens, and uses PostgreSQL
millisecond CAS. An immutable actor/college audit is inserted in the same
transaction, recording only before/after note presence and never private text.
The team-meeting log links to the exact authorized meeting detail. New mobile
dialog and loading/error states, pure unit and isolated PostgreSQL role/foreign/
stale/audit tests are authored. **PARTIAL:** runtime/typecheck/lint, desktop and
mobile verification, product privacy review and historic versioned meeting
minutes remain open; no separate notes/version table is invented.


## 2026-10-14 chat-11 D — Mentor exact-project risk and readiness drill-ins (PARTIAL)

New `/mentor/projects/[projectId]/risk-readiness` shows persisted same-project
blocked tasks, submitted task reviews, requested meetings, and pending latest
final-delivery review as actionable attention signals, with exact workspace
links and paginated ALL/RISK/READINESS views. Missing/unshipped Releases,
missing/incomplete Sprints, missing/open tasks, absence of approved final
delivery and post-approval missing evaluation are presented as evidence-based
readiness checkpoints rather than as a fabricated score or probability.
Zero tasks/Sprints/Releases mean unknown—not 100% complete. The service verifies
active current assigned-Mentor membership, central projects.read, college/
organization scope and optional Projects enablement before scoped reads.
Loading/error, mobile cards, filter/empty states, pure-model tests and an
isolated PostgreSQL success/wrong-role/foreign-scope fixture were authored.
This is read-only: stale mutation token is not applicable. **PARTIAL:** tsc,
eslint, unit/PG/browser acceptance, exact legacy risk semantics, historical
activity/staleness and missing task assignee/workload data remain open.


## 2026-10-14 chat-11 E — Mentor final-review notification latest-version safety (PARTIAL)

The assigned-project Mentor attention and Notifications feed now selects the
highest persisted final-delivery version for each current Mentor project before
deciding whether a review is pending. A historic SUBMITTED row cannot create a
phantom pending-review notification after a later approved, revised or draft
version; only the latest SUBMITTED row with a real submittedAt is actionable.
This corrects review-queue notifications without creating new external sends,
exposing private learner contact information, or changing the existing read
permission. A pure unordered-version model/unit suite and a disposable
PostgreSQL unique-project fixture cover latest-status suppression, newly
submitted version, foreign-college non-leakage, wrong role and disabled user.
No mutating route is added; stale-token denial does not apply. **PARTIAL:**
TypeScript/ESLint/unit/PG/browser and legacy notification parity remain open.


## 2026-10-14 chat-11 F — Mentor global Meetings filters and IST semantics (PARTIAL)

The existing across-project Mentor Meetings calendar now supports server-validated
status and literal meeting/project search filters, with status-preserving
request workflows and transparent matching totals. Times and MISSED-day
boundaries use the owner-confirmed Asia/Kolkata timezone instead of browser
timezone or per-meeting timezone. Scope remains restricted to current assigned,
same-college, role-granted Mentor projects, now with an explicit central
projects.read check before the persisted read. There are no new meeting
mutations or external sends. Unit and independently created PostgreSQL
fixture tests cover real requested/scheduled rows, project status filters,
wrong-role/disabled denial and cross-college nonleakage. **PARTIAL:**
Test execution, browser verification, high-volume pagination, full legacy
meeting calendar, and schedule/reschedule writes remain open. No direct
status updates are introduced, so optimistic stale write tokens do not apply.


## 2026-10-14 chat-11 G — Mentor meeting reschedule CAS/audit (PARTIAL)

For current assigned Mentors, the registered project Team & Meetings list now
offers a confirmed reschedule of an existing SCHEDULED meeting, converting
IST wall-clock inputs to UTC instants explicitly without browser-local drift.
The exact-project same-origin PATCH uses strict Zod, current persisted Mentor
membership and central projects.read/module scope, locks Project and Meeting,
rejects completed/archived workspaces and stale timestamp tokens with SQL
millisecond compare-and-swap, and prevents overlapping SCHEDULED meetings
within that same Project. The meeting link and agenda are unchanged; no
external message is sent. A single actor/college reschedule activity event
is inserted atomically without private URL or notes. New error code is
declared in ProjectsServiceErrorCode; no new permission is required.
Pure-model and unique-fixture PostgreSQL tests cover success, audit, SQL
microseconds, stale replay, collision, wrong-role, foreign and disabled
denials. **PARTIAL:** TypeScript/ESLint/PG/browser verification, optional
cross-project Mentor conflict policy, and full legacy meeting lifecycle
remain unverified.


## 2026-10-14 chat-11 H — Mentor exact-project activity CSV (PARTIAL)

The existing role/college/project-scoped activity-history screen now exposes
a read-only capped CSV export of up to 200 actual persisted PROJECTS event
rows, respecting the existing event-importance filter. Export fields are
limited to safe event label, importance, ID and IST timestamp, with formula
neutralization, no raw metadata, learner contact, actor identity, private
notes, or event summary. The service revalidates current Mentor assignment,
central projects.read and optional Projects enablement for every bounded
page. CSV declares omitted matches both visibly and in HTTP headers; no
external delivery or new permission is introduced. A pure export model/unit
suite and unique-project PostgreSQL fixture assert safe output, persisted
read success, wrong-role, disabled and non-leaking foreign-college denial.
**PARTIAL:** Run typecheck, lint, unit, PG and browser download tests, verify
historic producer completeness and exact legacy activity filters.


## 2026-10-14 chat-11 I — Mentor pending task-review priority triage (PARTIAL)

The current assigned-project /mentor/task-reviews queue now supports strict
priority filters (LOW/MEDIUM/HIGH/CRITICAL or ALL) and oldest/newest submission
ordering in addition to existing task/project literal search, bounded pages
and exact-task deep links. SQL applies priority and ordering only after
persisted active Mentor project, tenant, live task IN_REVIEW and latest-version
SUBMITTED checks. The queue does not expose learner contacts or submission
URLs or create a parallel review-write endpoint. Pure Zod/filter/link unit
tests and an isolated PostgreSQL own-project fixture cover registered
HIGH/LOW submissions, deterministic ordering, forbidden role/disabled actors,
foreign college non-leakage and forged query rejection. It is read-only;
stale-token denial is provided by the separate audited task-review write,
not by these query controls. **PARTIAL:** actual typecheck, lint, PostgreSQL,
mobile browser and full legacy task review acceptance remain open.


## 2026-10-14 chat-11 J — Mentor reviewed task history sanitized CSV (PARTIAL)

The existing currently assigned Mentor task-review history (registered
APPROVED/CHANGES_REQUESTED project_task_submissions) now offers a read-only
decision-filtered CSV export capped at 200 rows, preserving strict decision
and literal task/project search filters. The server rechecks the active Mentor
role, exact college/project membership, module enablement and central
projects.read on each bounded page. The export includes only registered review
ID, project/task titles, version, decision and IST review date; no learner
contact, submitted links, feedback, or actor identities. UTF-8 CSV
formula-neutralizes untrusted titles, explicitly reports truncated matches
in the file and HTTP headers, and sends nothing externally. Source-authored
pure unit and disposable unique-project PostgreSQL fixtures assert positive
review visibility, forged input, wrong role, disabled user and foreign-college
nonleakage. Read-only: no mutation or stale-token check is introduced.
**PARTIAL:** typecheck/lint/unit/PostgreSQL tests and responsive browser CSV
acceptance remain unexecuted, as does complete legacy review history parity.

## 2026-10-14 chat-11 K — exact-version Mentor delivery review detail (PARTIAL)

A currently assigned Mentor can follow each recorded delivery version to an exact
project/submission detail displaying its persisted status, decision, timestamps
and written review feedback. The scoped reader enforces active current Mentor
membership, college scope, central projects.read and Projects enablement; no
learner contact, private submission URL/notes or reviewer identities are returned.
Responsive loading/error and no-feedback states are explicit. A pure model/unit
suite and in-test-project PostgreSQL fixture cover positive review, forged IDs,
wrong role, disabled user and foreign college. Read-only: no new review mutation
or optimistic write token. **PARTIAL:** independent PG, TypeScript, lint, browser
and legacy author/feedback parity verification remain open.

## 2026-10-14 chat-11 L — IST past scheduled meeting readiness evidence (PARTIAL)

Extended the existing exact-project Mentor at-risk/readiness drill-in with
SCHEDULED meetings whose start was on an earlier IST calendar day and which
lack a recorded completed/cancelled transition. These are labeled as
past scheduled/unclosed, **not** proof that the meeting was missed. Existing
REQUESTED meetings remain separately actionable regardless of their date;
ARCHIVED/COMPLETED projects do not invent new active risks. Pure-model tests
cover IST boundaries; the isolated PostgreSQL fixture now creates a valid
SCHEDULED row with scheduled_by IDs and meeting_url satisfying
project_meetings_schedule_shape_ck, plus existing wrong-role/foreign-scope
denials. Read-only, so stale write token is inapplicable. **PARTIAL:** actual
PostgreSQL, TypeScript, lint, browser and legacy risk semantics remain open.

## 2026-10-14 chat-11 M — filtered per-Sprint Board summaries and safe CSV (PARTIAL)

The scoped Mentor Task Board now aggregates each registered Sprint's total
stored tasks and current filtered task matches, DONE, BLOCKED and IN_REVIEW
counts, and a matching-task completion percentage only when work matches.
The page shows the first six Sprints and provides a formula-neutralized UTF-8
CSV of at most 100 filtered Sprint summaries, with explicit omitted count.
This reuses existing exact current Mentor assignment, central projects.read,
college/module gating and Zod query validation; no new permission or database
write. It does not imply velocity, dates, task owners, effort or completion
for an empty Sprint. Pure unit and isolated persisted PostgreSQL tests cover
filter aggregation, zero-task semantics, CSV neutralization/capping, wrong-role,
foreign-scope and forged selectors. This is read-only, so stale write tokens
are not applicable. **PARTIAL:** execute typecheck, lint, PostgreSQL, unit and
browser download checks, then compare the legacy Sprint/Board summary UX.

## 2026-10-14 chat-11 N — Assigned Mentor project reports (PARTIAL)

New read-only /mentor/reports aggregates persisted status counts across
currently assigned Mentor projects (PLANNED, ACTIVE, COMPLETED, ARCHIVED),
primary Mentor assignments and a per-project count of actual registered
review/stalled/meeting-request/meeting-soon attention signals. Strict Zod
status, attention, literal title filters and 20-row pages provide mobile cards
and exact workspace/risk drill-down links. Reads require current active Mentor
membership, central projects.read, live same-college project assignment and
optional Projects enablement. No learner contacts, inferred pass rates,
workload/effort, velocity or fictitious readiness score. Loading/error/empty
states, pure model/unit and independently created PostgreSQL positive, forged,
wrong-role, disabled and foreign-college non-leaking fixtures are authored.
No mutation or external sending; stale token is not applicable. **PARTIAL:**
execute PG, tsc, lint, unit, mobile/desktop and verify the legacy report UX.

## 2026-10-14 chat-11 O — Mentor resource-link directory (PARTIAL)

New exact-project read-only Resource Directory filters active registered
resource metadata by required/optional and literal title/description text;
shows only credential-free HTTPS links (rejecting javascript/http and embedded
credentials). The capped, formula-neutralized 200-row CSV explicitly reports
truncation and excludes all raw URLs, private notes, learner contact and file
metadata. The service rechecks active current Mentor assignment, same-college
scope, central projects.read and Projects enablement. Mobile cards, loading,
error and empty states are provided. Model/unit tests and a disposable own-
project PostgreSQL fixture cover safe link handling, CSV formula escaping,
positive persisted reads, foreign-scope, disabled/wrong-role and forged input
denials. No file-backed functionality, member mutation or external sending
was added; no mutation stale token applies. **PARTIAL:** independent PG,
TypeScript, lint, browser, and legacy Resources interaction parity remain.

## 2026-10-14 chat-11 P — Mentor activity decision-category drill-ins (PARTIAL)

The current exact-project sanitized Activity history and its capped 200-row
formula-neutralized CSV can now filter by registered Project lifecycle,
review decisions, meeting decisions, and task activity as well as importance.
An explicit fixed event-type allowlist filters SQL before pagination/counts;
no raw activity summaries, actor identities, notes, feedback or arbitrary
metadata filters are exposed. The same current Mentor, college, project,
projects.read and module gates are reused. Pure Zod/allowlist tests and
in-test-project PostgreSQL assertions verify real creation events, no fabricated
review history, forged filters, wrong role and foreign-scope denial. Read-only,
so optimistic mutation tokens are not applicable. **PARTIAL:** execute real PG,
TypeScript, ESLint, responsive browser and legacy activity completeness checks.

## 2026-10-14 chat-11 Q — final-delivery review filters/CSV (PARTIAL)

The currently assigned Mentor Delivery review overview now filters persisted
project_submissions by registered DRAFT/SUBMITTED/APPROVED/CHANGES_REQUESTED
status and actual nonblank review-feedback presence/absence. SQL count, paging
and rows use the identical same-project review join/filters; the responsive
UI links each filtered version to the existing secure exact-version detail.
A 200-row formula-neutralized CSV reports versions, recorded decision labels,
IST timestamps and feedback presence but deliberately does not export raw
feedback, submission URLs, learner contact or reviewer identities. Existing
current-Mentor college and projects.read scope is reused. Pure model/unit
and own-project PostgreSQL fixtures cover stored draft+review evidence,
filter accuracy, forged selector, wrong-role, disabled and foreign denials.
Read-only: no new mutation stale token applies. **PARTIAL:** independent
PG/tsc/eslint/browser execution and legacy feedback-history parity remain.

## 2026-10-14 chat-11 R — scoped Mentor portfolio report CSV (PARTIAL)

The assigned-project /mentor/reports view now exports up to 100 matching
current same-college Mentor project records using its strict status, attention
and title filters. The UTF-8 CSV formula-neutralizes potentially unsafe project
titles, includes only registered project ID/title/status, current primary-
Mentor flag, safe attention category labels and IST update time, and reports
omitted matches both in the file and HTTP header. No learner contacts,
unaudited student data, inferred scores, or raw alert descriptions are sent.
The existing active Mentor role, projects.read, persisted assignment and
module guards are reused; no new write path, new permission or external send.
Unit-model cap/neutralization tests and an own-project PostgreSQL fixture
cover persisted positive selection and wrong-role/disabled/foreign/forged
denial. Read-only, so no stale write token applies. **PARTIAL:** real typecheck,
lint, PostgreSQL, browser download and legacy reports acceptance remain open.

## chat-11 backlog S — global Meetings IST date-window filters (PARTIAL)

Current assigned Mentor global Meetings filters support Today, next 7 IST calendar
days and previous 7 IST calendar days alongside existing status/search. The
ALL view retains expired REQUESTED meetings as actionable, without synthesizing
MISSED status. Pure timezone-boundary tests and the existing same-college/foreign
PostgreSQL fixture were extended. **PARTIAL:** test/browser execution, large-calendar
paging and legacy parity remain open.

## chat-11 backlog T — exact-project meeting title search (PARTIAL)

A literal SQL-wildcard-escaped title filter now applies to the persisted
meeting count and page query, alongside registered status and current-Mentor
college/module access. Pure unit and in-test meeting PostgreSQL fixture checks
cover search, percent literals and role denial. **PARTIAL:** test/browser and
legacy meeting acceptance pending.

## chat-11 backlog U — pending task-review safe CSV (PARTIAL)

The current assigned-Mentor task-review queue now exports up to 200 registered
IN_REVIEW/latest-version SUBMITTED rows honoring existing search, priority and
oldest/newest filters. Formula-neutralized CSV includes no learner contact,
submission URLs, feedback or actor identity. Every bounded page revalidates
current grants; truncation is explicit. Unit and PG-fixture assertions authored,
not executed. **PARTIAL:** verified runtime/export/browser and legacy parity open.

## chat-11 backlog V — global Meeting calendar metadata CSV (PARTIAL)

Exact current-Mentor global meetings export supports existing status/search/IST
period filters, caps at 200 rows and formula-neutralizes human-supplied text.
No join URLs, learner contacts, meeting notes or external sends. The same role,
college and Projects-module gates are checked; model/unit and own-project PG
assertions authored. **PARTIAL:** browser and executed DB/typecheck still open.

## chat-11 backlog X — project-attention type filters (PARTIAL)
Current authorized Mentor project-attention signals can be filtered by recorded kind without changing personal notifications, producer/scope, or external sends. Pure unit cases authored. PARTIAL pending PG, browser and legacy checks.

## chat-11 backlog Y — Mentor team-history role filter (PARTIAL)

The exact-project registered Team history supports persisted MENTOR vs LEARNER
role selection alongside current/open/ended membership filters; role is
applied to both SQL count and paginated rows and preserved in page links.
No Mentor membership writes or private identities are added. Unit and
own-project PG assertions authored; **PARTIAL:** executed tests/browser remain.

## chat-11 backlog Z — positive Mentor coverage filters (PARTIAL)

Existing current-assignment Team coverage can filter projects with actual
active learner memberships and projects with recorded active primary Mentors,
complementing missing-coverage signals. No members, inferred staffing scores
or private learner contacts are introduced. Unit and existing in-test PG
staffing scope checks authored; **PARTIAL:** CLI/browser verification open.

## chat-11 backlog AA — Mentor risk/readiness task-priority drill-ins (PARTIAL)

Existing exact-project readiness supports optional HIGH/MEDIUM/LOW/CRITICAL
filters on persisted task drill-ins, while keeping overall task counts and
non-task risk evidence visible and honest. This filter does not invent risk
scores or hide the existence of recorded lower-priority tasks. Pure and
owned-PostgreSQL fixture checks authored; **PARTIAL:** actual PG/tsc/browser
and full legacy readiness behavior remain unverified.

## 2026-10-15 chat-11 AB — Mentor final-review queue ordering (PARTIAL)
Oldest/newest persisted submission ordering and URL-preserved pagination added to current assigned-project review alerts. The established role, college and project gate remains; strict query validation and pure unit tests are authored. CLI/PG/browser and legacy acceptance remain open.

## 2026-10-15 chat-11 AC — Mentor Resource HTTPS link availability filter (PARTIAL)
The exact-project Resource directory filters records with credential-free HTTPS links separately from unavailable/unsafe records, in both paginated reads and bounded formula-neutralized metadata CSV. Strict Zod and pure unit assertions authored. Current same-college assigned Mentor authority unchanged. Tests/browser/full legacy resource parity open.

## 2026-10-15 chat-11 AD — active-project state in Mentor team coverage (PARTIAL)
The current-assignment team coverage view now filters registered PLANNED/ACTIVE/COMPLETED project statuses alongside staffing counts, with URL-preserved pagination, strict invalid-state rejection and unit assertions. Archived project records remain excluded by existing scope; totals keep their authorized whole-portfolio meaning. Real tests/browser and legacy parity remain open.

## 2026-10-15 chat-11 AE — Mentor primary/supporting assignment report (PARTIAL)
Assigned-project reports now distinguish registered current primary versus supporting Mentor assignments, in page filters, pagination and capped neutralized report CSV. Whole-portfolio counts remain distinct from filtered totals. Strict Zod and model tests authored. No membership changes or learner contact. Actual test/browser/legacy parity open.

## 2026-10-15 chat-11 AF — exact-project meeting type filter (PARTIAL)
The registered Team & Meeting log filters by GENERAL, PLANNING, STANDUP, REVIEW or RETRO in the same scoped SQL count and paginated query as status/title. URL pagination retains meeting type, with strict invalid-selector unit tests and test-owned PostgreSQL fixture assertions. Existing Mentor role/college/current project checks unchanged; execution and full meeting legacy parity open.

## 2026-10-15 chat-11 AG — Mentor Sprint progress Release status (PARTIAL)
Cross-project Sprint progress now filters persisted PLANNED, IN_PROGRESS and SHIPPED Release status in the same SQL scope/count/page as Sprint filters, retaining it in pagination and capped CSV. Strict Zod and unit query cases are source-authored. No phantom velocity, scope override or write; CLI/PG/browser and full Sprint/Release legacy acceptance remain open.

## 2026-10-15 chat-11 AH — persisted final-review history title search (PARTIAL)
Delivery decision history now filters by literal project title with SQL wildcard escape, preserving decision filter/page and limiting reads to currently assigned Mentor project review records. Strict Zod, unit and unique-project DB fixture assertions source-authored. Raw feedback/learner contact not returned. Actual PG/type/lint/browser and legacy history parity remain open.

## 2026-10-15 chat-11 AI — global Mentor project activity importance filter (PARTIAL)
The cross-assignment sanitized activity feed now supports registered event importance LOW/NORMAL/HIGH/CRITICAL. SQL applies the selector before count/pagination over current same-college assigned Mentor projects; URLs and page-size controls preserve the filter. Only safe labels/timestamps and authorized project links are shown, no raw event summary/metadata/learner identities. Strict unit and PG wrong-role denial assertions authored. Independent CLI/PG/browser and legacy activity completeness still open.

## 2026-10-15 chat-11 AJ — reviewed task priority triage (PARTIAL)
Reviewed task-submission history now filters registered task priority alongside decision and literal search in the scoped SQL count/page, including the capped sanitized CSV. Pure model and positive own-project PostgreSQL assertions are authored. No new writes, learner contact or feedback export; runtime/PG/browser and legacy verification remain OPEN.

## 2026-10-15 chat-11 AK — registered primary Mentor history (PARTIAL)
Exact-project Team membership history can isolate registered primary Mentor assignment records, preserving role/open-ended/paging filters in authorized SQL. It does not grant role editing, expose former names or reconstruct missing history. Pure and fixture PostgreSQL assertions authored, including correction of a pre-existing two-meeting count assertion. CI/PG/browser acceptance remains open.

## 2026-10-15 chat-11 AL — Mentor timeline Sprint lifecycle drill-in (PARTIAL)
Exact-project Release/Sprint timeline now filters actual planned/active/completed Sprint statuses and includes only Releases containing matching Sprints when filtered. Pagination and Release state navigation retain the filter. Query rejects unregistered states; zero-task progress remains unknown. Unit regression cases authored; CLI/PG/browser and complete legacy parity open.

## 2026-10-15 chat-11 AM — meeting outcome-presence filter (PARTIAL)
Exact-project meeting history now selects meetings with/without nonblank persisted outcome text; SQL count/paging share the filter and current Mentor/college guards. Actual outcome content remains private in list. Strict unit and test-owned PostgreSQL cases authored; execution/browser and full lifecycle parity OPEN.

## 2026-10-15 chat-11 AN — exact-project recent activity windows (PARTIAL)
Registered safe Project activity can filter events recorded within rolling 7×24h or 30×24h windows, shared by SQL count/page and the capped sanitized CSV. Only stored occurred_at instants, assigned Mentor authorization and existing fixed safe event labels are used. Pure cutoff/selector tests authored; time moves between export page requests, so cross-page snapshot isolation and browser/CI remain outstanding. Legacy activity history remains PARTIAL.

## 2026-10-15 chat-11 AO — global Mentor project activity event categories (PARTIAL)
Across currently assigned Mentor projects, the safe activity feed now filters persisted registered Project lifecycle, review, meeting and task event-type allowlists before SQL count and pagination. The exact-project activity allowlist is reused; only fixed labels/time/project links, no raw metadata or contacts. Strict Zod and pure tests authored. PG/browser/legacy event producer completeness remain open.

## 2026-10-15 chat-11 AP — report projects without recorded attention (PARTIAL)
Mentor assigned-project reporting can now isolate projects with no current review/stalled/meeting-request/meeting-soon alert emitted by registered producers. The filter applies consistently to paginated UI and existing safe 100-row CSV, and does not equate missing alerts with verified health or reconstruct unmigrated activity. Tenant/assignment scope unchanged; model regression authored, execution/browser and legacy acceptance open.

## 2026-10-15 chat-11 AQ — Resource Directory recorded sequence vs title order (PARTIAL)
Scoped Resource Directory now supports deterministic recorded-sequence and title A–Z sorting, consistently before pagination and the existing capped formula-neutralized metadata CSV. Registered resource fields only; safe HTTPS filtering, required flags, access checks and no raw URL export remain unchanged. Strict Zod and unit regression cases authored; independently executed tests/browser and full legacy Resource parity open.

## 2026-10-15 chat-11 round 6 AR — global meeting type triage (PARTIAL)
The current-Mentor global Meetings calendar now carries registered meeting_type through its already tenant/active-grant-scoped reader and filters GENERAL/PLANNING/STANDUP/REVIEW/RETRO consistently for UI and capped safe CSV. Strict selector and pure tests authored; full DB/browser parity and executed checks remain open.

## 2026-10-15 chat-11 round 6 AS — meeting chronological order (PARTIAL)
Exact-project team meeting history supports persisted start-time oldest/newest ordering, deterministic UUID tie-breaks and URL-preserved paging, alongside current-Mentor authorization and recorded status/type/outcome/title filters. Query and href regression cases source-authored. Real PostgreSQL, TypeScript, browser and legacy verification remain open.

## 2026-10-15 chat-11 round 6 AT — reviewed task decision chronology (PARTIAL)
Currently assigned Mentor task-review history now supports oldest/newest recorded review ordering with deterministic ID tie-break; paginated UI and capped safe CSV retain the selector. Decision/priority/literal title and current college/role scope still apply in SQL. Pure strict-selector tests authored; executed gates/browser and historical parity remain open.

## 2026-10-15 chat-11 round 6 AU — exact recorded delivery version lookup (PARTIAL)
The current assigned Mentor exact-project delivery review overview now filters by an actual positive registered version number, shared by SQL count/page and metadata-only capped export; status and feedback-presence controls remain. Strict Zod rejects unknown tenant selectors and invalid versions. Unit cases authored; browser/PG and full legacy delivery parity remain open.

## 2026-10-15 chat-11 round 6 AV — team assignment history chronology (PARTIAL)
The current authorized Mentor exact-project Team history supports earliest/latest recorded membership start order, stable UUID tie-break, scope-aware SQL pagination and view/role/primary filters retained in page links. Former/inactive names remain masked; no membership changes. Strict-selector source tests authored; CLI/PG/browser and complete historic data coverage unverified.

## 2026-10-15 chat-11 round 6 AW — project reports ordering (PARTIAL)
Registered currently assigned Mentor project reports now allow updated-first and title A–Z/Z–A sort, consistently before pagination and capped formula-neutralized CSV. Strict URL validation and deterministic tie-break preserve status/attention/assignment filters and whole-scope totals. Model tests authored; CI/PG/browser and full reports parity remain open.

## 2026-10-15 chat-11 round 6 AX — written Resource description completeness (PARTIAL)
Exact-project Resource Directory now filters records with/without nonblank registered descriptions, alongside required/safe HTTPS/ordering/search, before pagination and capped safe metadata CSV. Presence tests treat whitespace-only notes as absent. Current live same-college Mentor checks reused; no new resource writes or file providers. Unit/browser/PG/legacy parity remain PARTIAL.

## 2026-10-15 chat-11 round 6 AY — Meetings assigned-project state (PARTIAL)
Current-assignment global Mentor Meetings now filters actual registered PLANNED/ACTIVE/COMPLETED/ARCHIVED project lifecycle status alongside meeting status/type/IST period/search. The same scoped roster drives UI and capped metadata CSV; invalid states are rejected, archived data never gains new write rights. Pure tests authored. Execute typecheck, lint, unit/PG and browser to verify full legacy calendar parity.

Round 6 AU follow-up: a blank optional delivery-version HTML input is normalized to absent before Zod numeric coercion, so the unfiltered view does not fail validation. The corresponding empty-input unit assertion is source-authored; execution pending.


## Class-based Project team workspace creation — source-only PARTIAL (2026-10-15)

Shared College Admin (`/college/projects/workspaces/new`) and scoped Super Admin
(`/admin/projects/workspaces/new`) creators now support selecting a persisted
active class and published assigned Project template, deterministic roll-order or
seeded shuffle, balanced team size (default 5), whole-class single group, preview
moves or explicit two-learner swaps, and one atomic, serializable create operation.

The creator revalidates the current learner roster and preview version inside
the transaction; inserts registered `lms_groups`, `lms_group_members`,
`project_instances`, Project membership and materialized release/sprint/task/
resource rows, and records registered Project-created audit events. No new schema
or migration is introduced. Managed class-team membership editing is not exposed
to Mentors, and generic admin member controls are hidden where the managed group
is authoritative. Admin scope and persisted College Admin membership/role
checks are required.

Pure models and isolated-PostgreSQL success, role/scope denial, stale-token,
invalid mentor and rollback tests have been **authored but not executed**.
Independent typecheck, lint, fresh PostgreSQL, concurrency, mobile 375px,
accessibility and browser end-to-end acceptance remain OPEN. Do not mark
the Mentor Team or College Admin/Super Admin workspace create parity rows CLOSED
until the gates and legacy semantic checks pass. The Mentor's own Team view
continues to be read-only for membership management.


## 2026-10-15 chat-11 — Mentor queue and assignment navigation (PARTIAL)

Source-authored enhancements to the assigned Mentor Projects list: explicit
recorded meeting requests, stalled activity, upcoming meetings, any recorded
attention and no recorded attention filters; primary/supporting Mentor assignment
scope; stable title A–Z or recent-update sorting with archived projects behind
current projects. Filtering occurs after the existing persisted active Mentor
assignment reader; pagination retains selectors and all results remain within
the same current-college/role scope. **No recorded attention does not mean
verified project health.** Only registered alert producers are considered,
and unmigrated legacy blocked/workload fields are not fabricated.

The currently assigned Mentor delivery-review queue also supports recorded
review-age windows (all, last 7 days, last 30 days), using an explicit server
snapshot and preserving the selector in pagination. The pending task-review
queue supports critical-priority-first ordering and filtering by a real positive
submission version; both are applied in scoped SQL before pagination.
Zod rejects invalid age/version/order values and the existing membership/role
checks remain authoritative. No team-membership mutations are exposed to
Mentors.

Pure unit tests and an extension of the existing isolated PostgreSQL task
review fixture (success, priority/order/version, learner-role denial) are
**authored, not executed**. Full legacy page/interaction semantics, complete
producer coverage, typecheck/lint, DB gates, desktop/375px browser acceptance,
and fresh-data performance remain OPEN. All parent Mentor Project, Team,
Reviews, Tasks/Board and Activity rows remain PARTIAL until independent
acceptance; no parity matrix row was edited.


## 2026-10-15 chat-11 follow-up — Mentor project triage, reviews and activity (PARTIAL)

Source-authoring only; all listed work retains PARTIAL status until executed
TypeScript/lint, unit, isolated PostgreSQL and 375px/desktop browser gates pass.

- Mentor Projects now strictly parses bounded, role-scoped URL controls with Zod,
  handles blank GET-form selectors, and shows an explicit invalid-filter recovery
  state rather than silently broadening a bad filter. Its shared attention-selector
  JSX fragment is repaired. The list can distinguish projects with no persisted
  tasks and with persisted non-DONE tasks. Counts are loaded via revalidated
  active Mentor membership/assigned-project scope, not caller-supplied IDs.
  This does **not** simulate the unmigrated legacy blocked-workspace flag.
- The sanitized assigned-project activity feed offers actual recorded-event
  windows (past 7 and 30 rolling days), oldest/newest ordering with a stable
  UUID tie-break, and scoped registered Project lifecycle filters applied
  before database count and page. Events with missing historical producers
  remain unknown; no raw summaries, metadata or learner contact are exposed.
- Pending final-delivery reviews can be narrowed to current assigned Project
  lifecycle and submissions waiting more than seven days. Existing age,
  paging and optional-module checks remain authoritative. This is an
  attention signal, not a fabricated SLA decision.
- Unit model tests and existing isolated PostgreSQL Mentor fixture assertions
  for recorded task count and learner denial are authored but **not executed**.
  No Mentor membership write capability was introduced. New files stay in
  existing modules with no new DB tables/migrations. The central parity matrix
  is intentionally unchanged; legacy Team, Board, Reviews, Activity and
  navigation/browser sign-off remain OPEN.


## 2026-10-15 chat-11 — truthful Project roster and review triage (PARTIAL)

This batch builds on existing current-Mentor persisted-assignment reads and retains
Mentor write restrictions (no team membership editing). Source implementations:

- **Projects list** cards show measured task completion (DONE versus all registered
  tasks), unknown rather than invented 0% when no tasks exist, and an explicit
  archived/read-only badge. Count of active Project members comes from live,
  same-college membership and registered persisted roles. Added least-recorded-
  progress sorting with unknown last; archived projects remain last.
- **Meetings** now triages overdue requested meetings (still actionable),
  scheduled meetings within 48 hours, and uncompleted past-day scheduled
  meetings using the already existing IST-based derived MISSED semantics.
  Filters are retained in the authenticated 200-row capped calendar CSV.
- **Pending task reviews** offer last-seven-days / waiting-over-seven-days
  age scopes and an exact-project selector limited to the authenticated
  Mentor's currently assigned projects. Both constrain scoped SQL count and
  pagination before returning submission metadata.
- **Sanitized activity** and **final-delivery review queue** now have an
  explicit per-project selector. Unknown/foreign Project UUID selection
  fails closed. Options come from persisted current-Mentor assignments; only
  registered safe activity labels and permitted review attention are shown.

Pure unit cases and new disposable-PostgreSQL fixture assertions for accurate
same-college team sizes and learner-role denial were authored. Tests, typecheck,
ESLint, isolated PostgreSQL, browser 375px/desktop, and historical legacy
semantic sign-off have **not been executed** in this branch. No new schema,
migration or API mutation endpoint was introduced. Consequently Project list,
Team, Meetings, Task Reviews, Delivery Review and Activity remain PARTIAL; no
central parity matrix row is marked DONE. Section 8 legacy-delta contains no
separate Mentor-specific MISSING surface; this batch targets its existing
PARTIAL Project/Team/Meeting/Review gaps only.


## 2026-10-15 chat-11 — Mentor meeting, attention, reports and review follow-ups (PARTIAL)

This round extends existing registered data reads without creating new tables,
opening new mutation endpoints, or giving Mentors admin-only team membership
writes. The source features below are **not independent browser/DB acceptance**.

- Global Mentor Meetings (/mentor/calendar) filters meetings within the already
  authorized Mentor roster by selected persisted Project UUID, whether an
  actual registered Sprint is linked, and whether the existing safe-join-link
  policy accepts the stored URL. Those selectors also apply to the current
  200-row metadata-only CSV export, with strict Zod validation. Selection
  cannot pull an unrelated Project into the scoped calendar reader. URL
  presence alone is not treated as join readiness.
- Mentor Notifications project attention can be isolated by a registered
  Project UUID and sorted by recorded latest first or review/request priority.
  The selector shows real Project titles reloaded from active authorized Mentor
  assignments, not possibly misleading alert description fragments. The
  personal notification inbox and college announcement scope remain unchanged.
- Mentor Reports can distinguish Projects with no registered tasks, with
  unfinished registered tasks, and with all registered tasks DONE, and can
  order projects by measured task completion with unknown values last. The
  same filtered order drives the capped, formula-safe report CSV and paginated
  UI. Existing whole-assignment KPIs remain whole-assignment totals.
- Pending final delivery reviews, sanitized portfolio activity, and pending
  task reviews support PRIMARY versus SUPPORTING assignment selection using
  persisted current Mentor assignment flags, not a client-supplied role grant.
  These selectors are preserved in pagination; task review and activity
  predicates restrict their registered database queries before count/page.
- Isolated PostgreSQL integration fixture assertions have been expanded for
  scoped Project calendar filters, safe join-link triage, Task Review assignment
  selection and foreign Project UUID denial. Pure model tests are authored.

**Unexecuted gates:** TypeScript, ESLint, unit tests, isolated PostgreSQL,
parallel-write/concurrency, accessibility, desktop/browser 375px, and full
legacy action/notification producer parity. This does not close the linked
Mentor Meetings, Team, Reports, Task Review, Delivery Review or Notifications
PARTIAL rows. Section 8 contains no independent Mentor-specific MISSING
route to implement; College Admin bulk reassign Mentor remains admin-owned,
not a Mentor write.


## 2026-10-15 chat-11 standing-brief round — Team coverage, Sprint progress and final-review history (PARTIAL)

Merged current main before implementation. Ten separate feature commits were pushed in
the assigned Mentor/Projects lane; all involved routes remain PARTIAL pending acceptance.

- **Team coverage:** primary-versus-supporting *current Mentor assignment* facet;
  multi-Mentor team flag from persisted active same-college project memberships;
  fewest/most active learners first, before server pagination. These are
  measured team counts, not inferred staffing levels. The existing team
  service still authorizes through central projects.read and a live persisted
  member/role grant.
- **Delivery review history:** optional exact assigned Project UUID, positive
  stored submission version, ascending/descending recorded decision time,
  last-seven/last-thirty day windows. Project selectors fail closed if not
  currently assigned; filters apply to the registered joined decision query
  before SQL count, ordering, and pagination. Only non-sensitive decision,
  version and timestamp metadata is returned; no learner identities, raw
  feedback or claim that the current Mentor personally authored a decision.
- **Sprint progress:** optional exact Project UUID, persisted task attention
  (BLOCKED or IN_REVIEW), and active-Sprint-first ordering. An authorized
  Project list supplies selector choices; the non-archived Mentor scope,
  release/project linkage, status, search, and task filters are enforced by
  the existing PostgreSQL query before pagination. The same filters/order
  are forwarded into the existing capped, formula-safe CSV download. No
  attempt was made to infer missing Sprint dates/goals.

Zod input, scoped SQL readers, existing React pages, focused unit assertions and
new isolated-PostgreSQL integration fixture assertions were authored. One
backwards-compatible model/test repair preserves older team-coverage call-site
types with missing optional filter facets. No new tables, registered migrations,
POST/PATCH/PUT/DELETE route handlers, permissions or team-member mutation paths
were introduced. Master account matrix and sole DATABASE tracker untouched.

**Unexecuted acceptance:** no Node typecheck, ESLint, Vitest, disposable
PostgreSQL, browser/375px or legacy-oracle side-by-side run was available
in this connector-only source session. Full Team/Overview/Delivery/Sprints
source-legacy interaction fidelity, upstream producers and browser/mobile
acceptance remain open. No DONE surface/task/phase claim is made.


## 2026-10-15 chat-11 — single-mentor team coverage (PARTIAL)

Projects with exactly one active Mentor now have a current-assignment, registered-team filter; this surfaces single-Mentor coverage without inferring workload. The existing active-Mentor/college/module permission service is reused; the new selector is server-validated and preserved in paging. Pure regression is authored, not executed. Real PostgreSQL, mobile/desktop, exact legacy producer and staffing-action verification remain OPEN; no Team row is closed.


## 2026-10-15 chat-11 — uncovered-team current Mentor team triage (PARTIAL)

The existing live same-college current-assignment Team coverage screen supports no learners and no primary mentor using registered active Learner/Mentor membership counts. Server-side Zod accepts only known selectors and paging retains them; no invented staffing adequacy or new team write is introduced. Focused unit test authored. Runtime, disposable PostgreSQL, accessible browser/mobile and exact legacy behavior checks remain open.


## 2026-10-15 chat-11 — five-learners current Mentor team triage (PARTIAL)

The existing live same-college current-assignment Team coverage screen supports five or more active learners using registered active Learner/Mentor membership counts. Server-side Zod accepts only known selectors and paging retains them; no invented staffing adequacy or new team write is introduced. Focused unit test authored. Runtime, disposable PostgreSQL, accessible browser/mobile and exact legacy behavior checks remain open.


## 2026-10-15 chat-11 — fewest-mentors current Mentor team triage (PARTIAL)

The existing live same-college current-assignment Team coverage screen supports fewest mentors first using registered active Learner/Mentor membership counts. Server-side Zod accepts only known selectors and paging retains them; no invented staffing adequacy or new team write is introduced. Focused unit test authored. Runtime, disposable PostgreSQL, accessible browser/mobile and exact legacy behavior checks remain open.


## 2026-10-15 chat-11 — most-mentors current Mentor team triage (PARTIAL)

The existing live same-college current-assignment Team coverage screen supports most mentors first using registered active Learner/Mentor membership counts. Server-side Zod accepts only known selectors and paging retains them; no invented staffing adequacy or new team write is introduced. Focused unit test authored. Runtime, disposable PostgreSQL, accessible browser/mobile and exact legacy behavior checks remain open.


## 2026-10-15 chat-11 — no-recorded-tasks Sprint attention (PARTIAL)

The authorized current assigned-Mentor Sprint progress UI and its existing capped metadata CSV now select sprints without recorded tasks using registered project_tasks, server-side Zod and the same college/project authorization. The predicate is applied in SQL before count and paging, and zero-task Sprints do not claim 100% completion. Focused model unit authored, independent database/TypeScript/lint/browser/legacy verification still OPEN.


## 2026-10-15 chat-11 — todo-task-attention Sprint attention (PARTIAL)

The authorized current assigned-Mentor Sprint progress UI and its existing capped metadata CSV now select sprints with recorded to do tasks using registered project_tasks, server-side Zod and the same college/project authorization. The predicate is applied in SQL before count and paging, and zero-task Sprints do not claim 100% completion. Focused model unit authored, independent database/TypeScript/lint/browser/legacy verification still OPEN.


## 2026-10-15 chat-11 — done-task-attention Sprint attention (PARTIAL)

The authorized current assigned-Mentor Sprint progress UI and its existing capped metadata CSV now select sprints with recorded done tasks using registered project_tasks, server-side Zod and the same college/project authorization. The predicate is applied in SQL before count and paging, and zero-task Sprints do not claim 100% completion. Focused model unit authored, independent database/TypeScript/lint/browser/legacy verification still OPEN.


## 2026-10-15 chat-11 — project-state-review-history (PARTIAL)

The currently-assigned Mentor delivery-decision history filters by persisted Project PLANNED/ACTIVE/COMPLETED/ARCHIVED lifecycle without widening project membership scope. Only registered review metadata is shown. The UI, Zod query, SQL-scoped service and pagination URL are updated together. A focused source regression is authored, not executed. Independent PostgreSQL, TypeScript, lint, mobile/desktop browser, current legacy-oracle and upstream-producer verification remain OPEN; this does not close the Mentor Delivery review row.


## 2026-10-15 chat-11 — older-recorded-reviews (PARTIAL)

The project-scoped review timeline distinguishes persisted decisions older than 30 rolling days from recent 7/30-day decisions; the SQL cutoff is applied before counting or paginating and does not assert missing legacy review rows. The UI, Zod query, SQL-scoped service and pagination URL are updated together. A focused source regression is authored, not executed. Independent PostgreSQL, TypeScript, lint, mobile/desktop browser, current legacy-oracle and upstream-producer verification remain OPEN; this does not close the Mentor Delivery review row.


## 2026-10-15 chat-11 — sprint-attention-postgres isolated DB regression (PARTIAL)

Added an isolated registered PostgreSQL regression for TODO, DONE and no-task Sprint triage, honest zero-task completion, current active Mentor scope and learner/foreign-project denial. The fixture is authored but not executed; independent PostgreSQL/typecheck/CI remain open.


## 2026-10-15 chat-11 — review-age-postgres isolated DB regression (PARTIAL)

Added a persisted Project-state and deliberately backdated review fixture for assigned Mentor review history, with older-than-30 vs last-30 contrast and learner/foreign project denials. The disposable PostgreSQL test is source-authored only; runtime/legacy acceptance is pending.


## 2026-10-15 chat-11 new round — safe-external-project-links (PARTIAL)

The shared Project workspace now rejects credential-bearing, non-HTTP(S), malformed and oversized external URL values before rendering source/demo/resource/meeting links. Existing clean HTTP(S) links remain usable. Authenticated workspace service and existing Project role/tenant/module scopes remain unchanged. Source-authored unit regression accompanies the UI and pure model. Independent TypeScript, lint, unit, database, browser (desktop/375px) and exact legacy acceptance are still outstanding; no DONE claim.


## 2026-10-15 chat-11 new round — mentor-task-acceptance-criteria (PARTIAL)

Mentors can now expand the same registered task acceptance criteria that Learners see, directly from the Board during review; blanks never display a false rubric. Authenticated workspace service and existing Project role/tenant/module scopes remain unchanged. Source-authored unit regression accompanies the UI and pure model. Independent TypeScript, lint, unit, database, browser (desktop/375px) and exact legacy acceptance are still outstanding; no DONE claim.


## 2026-10-15 chat-11 new round — sprint-recorded-progress (PARTIAL)

Each Mentor Sprint displays counted persisted Done/In review/Blocked tasks and a completion percentage only when tasks exist. Empty Sprint completion is explicitly unknown, never 100%. Authenticated workspace service and existing Project role/tenant/module scopes remain unchanged. Source-authored unit regression accompanies the UI and pure model. Independent TypeScript, lint, unit, database, browser (desktop/375px) and exact legacy acceptance are still outstanding; no DONE claim.


## 2026-10-15 chat-11 new round — sprint-empty-work-evidence (PARTIAL)

The Mentor Board now explicitly distinguishes Sprints without persisted task rows from completed Sprints with work, preventing blank boards from implying a successful delivery. Authenticated workspace service and existing Project role/tenant/module scopes remain unchanged. Source-authored unit regression accompanies the UI and pure model. Independent TypeScript, lint, unit, database, browser (desktop/375px) and exact legacy acceptance are still outstanding; no DONE claim.


## 2026-10-15 chat-11 new round — task-review-state-evidence (PARTIAL)

Mentor Task cards now identify a real pending review only when the task is IN_REVIEW and its latest recorded attempt is SUBMITTED; stale or absent submissions do not produce phantom review-needed messages. Authenticated workspace service and existing Project role/tenant/module scopes remain unchanged. Source-authored unit regression accompanies the UI and pure model. Independent TypeScript, lint, unit, database, browser (desktop/375px) and exact legacy acceptance are still outstanding; no DONE claim.


## 2026-10-15 chat-11 new round — task-feedback-deep-link (PARTIAL)

Mentors can open the exact currently assigned task's authorized recorded-feedback history from its Board card when a submission attempt exists, rather than searching another page. The target retains its own persisted membership/college permission checks. Existing current-Mentor persisted-assignment, central projects.read, college and Projects module authorization still applies. New pure-model regression and visible exact-project UI change are authored. Real PostgreSQL, TypeScript/lint/Vitest, responsive browser, accessibility and legacy-oracle comparison remain open.


## 2026-10-15 chat-11 new round — live-team-role-summary (PARTIAL)

The exact-project Mentor Team section now summarizes actual current Learner, Mentor and primary-Mentor grants from the authorized active roster, without inferred contacts, staffing capacity or workload. Existing current-Mentor persisted-assignment, central projects.read, college and Projects module authorization still applies. New pure-model regression and visible exact-project UI change are authored. Real PostgreSQL, TypeScript/lint/Vitest, responsive browser, accessibility and legacy-oracle comparison remain open.


## 2026-10-15 chat-11 new round — missing-primary-mentor-signal (PARTIAL)

The Mentor Team view now calls out a live current-project roster with no registered primary Mentor, without offering forbidden Mentor-side membership editing or treating archived teams as needing assignment. Existing current-Mentor persisted-assignment, central projects.read, college and Projects module authorization still applies. New pure-model regression and visible exact-project UI change are authored. Real PostgreSQL, TypeScript/lint/Vitest, responsive browser, accessibility and legacy-oracle comparison remain open.


## 2026-10-15 chat-11 new round — latest-final-delivery-version (PARTIAL)

The Mentor Delivery tab explicitly identifies the highest persisted final-delivery version and status, even if historical rows are returned in a different order. Prior submitted versions are not falsely presented as the latest review action. Existing current-Mentor persisted-assignment, central projects.read, college and Projects module authorization still applies. New pure-model regression and visible exact-project UI change are authored. Real PostgreSQL, TypeScript/lint/Vitest, responsive browser, accessibility and legacy-oracle comparison remain open.


## 2026-10-15 chat-11 new round — required-resource-link-evidence (PARTIAL)

The Mentor Resources tab now distinguishes valid required external links, valid text-only resources, and required entries without usable content. Credential-bearing links are never shown as safe; no file/blob provider or invented upload is implied. Existing current-Mentor persisted-assignment, central projects.read, college and Projects module authorization still applies. New pure-model regression and visible exact-project UI change are authored. Real PostgreSQL, TypeScript/lint/Vitest, responsive browser, accessibility and legacy-oracle comparison remain open.


## 2026-10-15 chat-11 — service-integrated Mentor workspace evidence (PARTIAL)

The existing scope-checked getProjectWorkspaceView service now derives Sprint task status totals, active Team role counts and latest recorded delivery version from the already loaded registered rows in a pure shared model. Mentor and other account renderers consume in-request facts without duplicate database reads or invented workload metrics. Source-authored unit verification covers composition; isolated PostgreSQL, TypeScript, lint, Vitest and responsive browser gates remain unexecuted.


## 2026-10-15 chat-11 — real PostgreSQL Mentor workspace evidence fixture (PARTIAL)

The existing seeded disposable-PostgreSQL task-create integration suite now asserts tenant-scoped Team membership counts, Sprint task totals before/after a persisted Mentor task creation, absence of fabricated delivery history and a foreign-college denial through the actual shared workspace service. This test is source-authored but has not been executed in this connector environment; all browser and CI acceptance gates remain open.


## 2026-10-15 chat-11 — responsive-portfolio-activity-filters (PARTIAL)

Replaced the previously overflowing wrapping form with a single-column narrow viewport grid and shrinkable labels/select controls; long project names wrap inside cards. Known orchestrator 375px/desktop overflow defect targeted, but browser measurement still required. Pure tests authored; independent PostgreSQL, unit, lint, typecheck, browser and legacy-oracle acceptance remain open. Mentor activity remains PARTIAL.


## 2026-10-15 chat-11 — bounded-portfolio-activity-pagination (PARTIAL)

Scoped count now executes before the page read and requested pages clamp to the last real page; avoids an empty page 9999 with misleading navigation for active Mentor portfolios. Pure tests authored; independent PostgreSQL, unit, lint, typecheck, browser and legacy-oracle acceptance remain open. Mentor activity remains PARTIAL.


## 2026-10-15 chat-11 — search-assigned-project-activity (PARTIAL)

Added literal trimmed project-title search over already authorized active Mentor project assignments, with strict 120-character Zod validation and URL-preserved pagination. No raw private event summary search or cross-tenant title discovery. Pure tests authored; independent PostgreSQL, unit, lint, typecheck, browser and legacy-oracle acceptance remain open. Mentor activity remains PARTIAL.


## 2026-10-15 chat-11 — older-than-30-days-portfolio-events (PARTIAL)

Mentor Activity can isolate genuinely older persisted events with a SQL strict-before 30-day cutoff, versus last-30-day inclusive window. Uses only scoped, fixed-label events. Unit source cases authored; runtime, database, 375px/desktop browser and complete legacy producers remain unverified.


## 2026-10-15 chat-11 — past-90-days-portfolio-events (PARTIAL)

Added rolling 90-day selection for registered Mentor events, applied by timestamp before bounded SQL count, ordering and pagination. Unit source cases authored; runtime, database, 375px/desktop browser and complete legacy producers remain unverified.


## 2026-10-15 chat-11 — evaluation-events-mentor-activity (PARTIAL)

Both assigned-project portfolio and exact-project activity screens can isolate actual registered evaluation events via fixed event-type SQL allowlists; raw rubrics, student data and metadata stay private. Unit source cases authored; runtime, database, 375px/desktop browser and complete legacy producers remain unverified.


## 2026-10-15 chat-11 — mentor-sprint-change-events (PARTIAL)

Both assigned Mentor portfolio and exact-project event readers now support sprint changes filtered to projects.sprint.updated. Existing active membership/college/role SQL gates and redacted event labels remain; unit tests authored, not executed. Browser and legacy event producer verification still open.


## 2026-10-15 chat-11 — mentor-assignment-change-events (PARTIAL)

Mentor assignment/reassignment events can now be selected in the assigned-project portfolio and exact-project audit screens using the registered projects.mentor.reassigned taxonomy. Current Mentor grants and tenant scoping, no actor PII, no raw audit metadata, and bounded SQL filters are retained. Test authored, runtime/legacy/browser verification OPEN.


## 2026-10-15 chat-11 — portfolio importance visibility (PARTIAL)

Mentor Activity now renders each matching registered event's stored importance beside its fixed safe event label. Scoped SQL projection explicitly selects the severity, without summaries, actors or metadata, and mobile cards wrap long labels. Unit test authored; source typing, PG and browser checks still OPEN.


## 2026-10-15 chat-11 — safe portfolio Activity CSV (PARTIAL)

The assigned Mentor portfolio activity now exports at most 200 existing scoped, filter-matched registered event records. Every bounded database page rechecks currently active Mentor membership, tenant, Projects access and project selection. UTF-8 CSV formula-neutralizes Project titles; safe columns only are event UUID, project title, fixed event label, registered importance and IST time. A truncation row and HTTP omitted-count header reveal excess. No external send or raw summaries, actor identities, contact data or metadata. Source tests authored; disposable PostgreSQL/browser download and security acceptance OPEN.


## 2026-10-15 chat-11 — portfolio activity persisted-positive regression (PARTIAL)

The existing isolated PostgreSQL Project task fixture now verifies the registered Project-created activity event appears only for its actual current assigned Mentor, project-title search cannot fabricate matches, export excludes actor and auth fields, and Learner/foreign-college requests are denied. Source-authored but not executed; no release-complete claim.


## 2026-10-15 chat-11 — persisted Resource activity lifecycle (PARTIAL)

Registered safe Resource created/updated/archived Project activity event taxonomy, fixed non-PII labels, and Resource group filters across cross-project and exact-project Mentor activity. The next source commits wire the real transactional resource write producers. This mirrors the legacy activity category without exposing resource URLs, file content, actor details or raw audit metadata. Browser, PostgreSQL and legacy second-pass evidence remain OPEN.


## 2026-10-15 chat-11 — transactional resource create audit (PARTIAL)

The registered Project resource create write now emits `projects.resource.created` within its existing scoped database transaction. Event failures roll back the resource mutation, with project/college/organization IDs and no URL/description/private payload in event metadata. Scoped Mentor Activity filters display only the fixed label. Pure payload test authored; database execution and browser acceptance remain OPEN.


## 2026-10-15 chat-11 — transactional resource update audit (PARTIAL)

The registered Project resource update write now emits `projects.resource.updated` within its existing scoped database transaction. Event failures roll back the resource mutation, with project/college/organization IDs and no URL/description/private payload in event metadata. Scoped Mentor Activity filters display only the fixed label. Pure payload test authored; database execution and browser acceptance remain OPEN.


## 2026-10-15 chat-11 — transactional resource archive audit (PARTIAL)

The registered Project resource archive write now emits `projects.resource.archived` within its existing scoped database transaction. Event failures roll back the resource mutation, with project/college/organization IDs and no URL/description/private payload in event metadata. Scoped Mentor Activity filters display only the fixed label. Pure payload test authored; database execution and browser acceptance remain OPEN.


## 2026-10-15 chat-11 — resource-positive-event-lifecycle (PARTIAL)

Source regression in existing seeded disposable PostgreSQL suite for Resource activity producer. Verifies real tenant-scoped actor/audit data, safe Mentor event labels, and denied mutations with no phantom events. Tests have not been executed; no DONE or legacy source fidelity certification.


## 2026-10-15 chat-11 — resource-cross-role-write-denials (PARTIAL)

Source regression in existing seeded disposable PostgreSQL suite for Resource activity producer. Verifies real tenant-scoped actor/audit data, safe Mentor event labels, and denied mutations with no phantom events. Tests have not been executed; no DONE or legacy source fidelity certification.


## 2026-10-15 chat-11 — registered Project Team activity (PARTIAL)

Added fixed-label, registered Team membership add/change/end activity event types and safe TEAM selectors on both Mentor project and cross-project feeds. Activity filters still require current persisted Mentor assignment; labels disclose neither member name, contact, actor identity nor raw metadata. Producer commits follow and independent PostgreSQL/browser execution is pending.
