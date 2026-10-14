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
