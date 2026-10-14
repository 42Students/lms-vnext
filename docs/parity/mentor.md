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
