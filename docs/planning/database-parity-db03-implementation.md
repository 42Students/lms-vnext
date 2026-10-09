# DB03 schema implementation — foundation batch (2026-10-10)

**State: SIX TABLES AUTHORED / NOT DATABASE-VERIFIED.**
Legacy source: `lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5` V166/V167/V168/V191.

Added: `lms_groups`, `lms_group_members`, `lms_group_member_events`, `lms_group_rules`, `elective_slots` and `elective_offerings`. All use UUIDs and PostgreSQL types; source concepts (membership state/source/locked, event history, group active_count, rule state, slot pick limits, offering archive-aware uniqueness) are preserved. New CHECKs and restrictive FKs guard basic invariants.

**Intentional mapping decision:** legacy polymorphic `member_type + member_id` becomes a scoped `college_memberships.id` FK, with separate display type. `created_by_type/id` becomes user identity. No migration of old production data.

**Unresolved before DB03 DONE:** actual migrations and Drizzle snapshot must be generated/verified with drizzle-kit and disposable Postgres; atomic join/leave/event/waitlist + max-pick concurrency implementation/tests; tenant and creator permission checks at every writer; platform owner groups; rule refresh; project team mirror; group-backed course content/quiz/attendance access and cross-program roster; semantic sign-off for all 79 legacy fields.

`backed_delivery_id` is a nullable bridge only, **not** implementation of the legacy GROUP_BACKED class contract. Primary `section_enrollments` is not modified. Do not mark group-backed roster parity on presence of this FK.

## Follow-up verification
Run `npm run db:generate` in a complete checkout and inspect generated `0037` drift against the authored SQL, then replay migrations against disposable PostgreSQL before running tests. The migration is now **registered in the journal** with an intentionally constructed 0037 snapshot. A full Drizzle-kit generation diff and PostgreSQL replay are still REQUIRED to detect manual snapshot/schema drift; registration does not prove execution. The migration will be picked up by `db:migrate` when run against a disposable database.

## Membership transaction batch (2026-10-10)

Added `src/modules/groups/service.ts` with `createGroup`, `joinGroup`, and `leaveGroup`:
- Parent group row is locked with `FOR UPDATE`, and elective joins lock the shared slot **before** the group.
- Active seat counts, durable member transition, append-only event **insert**, and waitlist promotion occur in one transaction.
- SELF joins require active learner account and exact membership, group ACTIVE status and valid join window.
- MANUAL edits require tenant admin permission; platform groups require global superadmin.
- Locked REMOVED rejects rejoin; existing ACTIVE/WAITLISTED joins are idempotent.
- max_pick counts ACTIVE **and** WAITLISTED across active offerings of the common slot.
- No primary section changes.

**Still not proven:** real DB transaction execution, all admin/rule state variants, consent/status policy, DB-level append-only event immutability, group-backed course consumers. Cross-parent invalid inserts remain possible by privileged SQL; transactional service checking alone is not proof of schema-level tenant integrity.

## Disposable PostgreSQL integration suite added
`tests/integration/groups-db03.test.ts` now specifies five DB-backed tests: simultaneous elective max-pick=1 joins across two groups, seat/waitlist promotion and event count, wrong-college member rejection, locked removal, and a direct SQL CHECK failure. They also assert no primary section enrollment changes after elective choice.

**Execution:** NOT RUN; this chat has no connected disposable PostgreSQL. Tests are not evidence of successful execution until run under `npm run test:db` with an isolated database and the registered 0037 migration applied. Tests use synthetic seeded users only.

## Elective producer batch
Added `createElectiveSlot`, `createElectiveOffering`, and `listElectiveOfferings` to `src/modules/electives/service.ts`.

The producer validates admin scope, program/term college, course college and ACTIVE status, group kind/college, optional delivery course/college and locks the elective slot/group consistently with joining. Duplicate active slot/course, reused group or backed delivery map to domain errors. **Backed delivery is only a provisional bridge:** all course, quiz, schedule, attendance and grading consumers must resolve the actual group roster before this is operationally equivalent to legacy GROUP_BACKED classes. No consumer authorization changes in this batch.

## Hardening adjustment — lifecycle and concurrent offering creation
- `lms_group_member_events` now has a PostgreSQL trigger rejecting UPDATE/DELETE of event history; this custom database object is not captured by the Drizzle table snapshot and must be verified from `pg_trigger` after replay.
- Prevent attaching a new elective offering to an already populated group under the same slot→group locks used by member joins. This closes a creation-versus-join bypass of `max_pick` at setup time.
- Both elective slot counts and offering reads now ignore soft-deleted offerings.
- Remaining: event creation access control (DB role grants), direct SQL tenant integrity, and exhaustive producer/consumer roster parity. These changes are unexecuted.

## Isolated test-safety + group lifecycle
A `transitionGroup` API now supports authorized DRAFT/CLOSED→ACTIVE, ACTIVE→CLOSED and DRAFT/CLOSED→ARCHIVED (archive requires no active seats). Tests invoke this rather than issuing raw status updates.

The DB03 integration suite now **requires** `TEST_DATABASE_URL` and the explicit `DB03_ISOLATED_TEST_DATABASE=1` acknowledgement. Its cleanup uses TRUNCATE only for the isolated group-member event history table, because the production event trigger deliberately rejects UPDATE and DELETE. Never point this suite at any shared or production database. An additional test verifies both UPDATE and DELETE of event history are refused. Runtime result: NOT EXECUTED in this chat.

## Event actor attribution and waitlist eligibility
Automatic promotion is now recorded as a SYSTEM event (the original member source is retained). Promotion scans only waitlisted records whose college membership remains ACTIVE and whose LEARNER role still exists. Suspended members are not promoted ahead of eligible learners. Revoked/stale waitlist cleanup and rule-driven refresh remain separate open work.

## Group-backed learner access batch (2026-10-10)

The original learner course-list and `requireLearningReadAccess` treated primary
`section_enrollments` as the only roster. Fixed that incomplete parity path:
- `src/modules/groups/roster-access.ts` now centralizes the ACTIVE elective
  roster predicate for both course discovery and exact-delivery permissions.
- Filters require matching college across group, slot, membership, course
  department and the slot's owning program, ACTIVE learner role, member
  state, group/slot/offering/course, and a live backed delivery.
- The host section **never** grants a non-member access to a group-backed
  elective. Archived/inactive linked offerings are denied even when the
  learner belongs to the host section.
- Elective courses are visible to active group members without altering
  the learner's `section_enrollments`.
- The group join writer rejects a kind=ELECTIVE group without an ACTIVE
  offering; direct joins cannot bypass the common slot lock.
- Historical elective reads intentionally require current ACTIVE group
  membership; this is a conservative authorization policy awaiting explicit
  legacy historical behavior approval.

**Not yet covered:** learner schedule for elective event sessions; faculty
attendance capture; course producer-level GROUP_BACKED delivery lifecycle;
grading/quiz submission behavior under all access modes. DB fixture tests
and typechecking are required before treating this as verified.

## Roster integration regression specifications

Added `tests/integration/groups-db03-roster.test.ts`: five PostgreSQL integration cases for group-only discovery/access, host-section denial, revocation, archive denial and inactive offering join denial. They are **authored, not run**, and use disposable fixture rows. Production acceptance still requires migration replay, `npm run typecheck`, test execution and an audit of attendance/schedule/quiz consumers.

## Timetable and suspended-user protection (2026-10-10)

Learner timetable now derives courses and linked-event eligibility from the
central `listLearnerCourseDeliveries` authorization union, not exclusively
`section_enrollments`. Primary section events without delivery remain visible,
while linked events require access to that exact delivery. This prevents
host-section members from seeing group-backed elective events unless they join
the elective group. Suspended user accounts no longer pass course-read or
course-list access even when their college membership is still marked ACTIVE.

**Not verified:** typecheck, Drizzle runtime, database tests, teaching/attendance
producer parity, historical learning access and legacy field signoff.

## Additional regression specifications

The DB03 roster integration suite now tests timetable inclusion/exclusion for active group members versus unrelated host-section learners and rejects suspended learner contexts even if group membership persists. **Test run pending.**
