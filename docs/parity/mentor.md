# Mentor — Detailed Page Parity Spec

Legacy primary navigation: Projects, Meetings, Notifications.

## Page: Mentor landing
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

