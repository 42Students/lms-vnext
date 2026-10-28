# DB03 schema implementation — foundation batch (2026-10-10)

**State: MERGED TO MAIN / NOT DATABASE-VERIFIED.**
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

## Exact backing-delivery checks

The shared active group-backed roster query also requires the backed delivery's section to be ACTIVE and to match the course offering's cohort and academic period. This avoids navigation/API drift from stale or cross-parent delivery links. Current mapping is conservative: ended/archived elective access requires a separate reviewed historical policy. **Not yet DB-tested.**

## Strict backed-delivery release fix (2026-10-10)

Elective offerings now REQUIRE a backed delivery in the TypeScript Drizzle
schema, PostgreSQL migration, snapshot and service validation. The writer also
checks ACTIVE course offering/type ELECTIVE, ACTIVE section, matching cohort and
academic period, no ended delivery, same college and slot-period match when
specified. The DB03 concurrent max-pick fixture now creates real academic
structure, course offerings and deliveries; unbacked test shortcuts are gone.

The DB03 roster tests no longer DELETE append-only events, only TRUNCATE within
explicit `DB03_ISOLATED_TEST_DATABASE=1` disposable mode. CI sets that
acknowledgement for its PostgreSQL test step. Invalid platform status fixtures
were repaired (DISABLED is valid, SUSPENDED was not).

**Verification remains PENDING:** Drizzle regeneration, TypeScript compile,
migration replay, real PostgreSQL test execution and UI/API consumer E2E.

## Project team schema link (migration 0038, 2026-10-10)

`project_instances.team_group_id` is a nullable, unique, FK-backed link
to a kernel group (legacy V191 mapping). The Drizzle snapshot and migration
journal include 0038. Source contract assertions now know 0038 follows 0037.
Existing unlinked projects preserve the previous standalone roster behavior.
Actual migration replay and regeneration remain unverified.

## Academic eligibility guard (2026-10-10)

Compared directly with legacy `ElectiveService.learnerEligibilityError`.
New joins now require an ACTIVE learner enrollment in the elective slot's
program, a valid ACTIVE **primary** section tied to that learner's cohort, and
slot/section period equality whenever `academic_period_id` is populated.
Waitlist promotion skips learners whose actual user account was DISABLED,
whose role/college was revoked or whose active primary program/section ceased
matching. Both elective course discovery and exact-delivery authorization
also require this active academic eligibility, so a stale group-member row
does not keep access.

**Unresolved parity contract:** Legacy also checks current batch semester
and academic year. VNext currently does NOT persist a proven equivalent
semester/year-on-current-cohort mapping; period equality by itself does NOT
prove semester equivalence. This is an explicit DB02/DB03 blocker, not
a completed field mapping. Do not mark DB03 VERIFIED.

## Project TEAM live mirror & rollback specifications (2026-10-10)

The 0038 link is consumed by `attachProjectTeamGroup` and the kernel
membership transitions. Only empty DRAFT same-college groups attach to empty
project rosters. ACTIVE learner membership is mirrored to project_members in
the **same transaction** as event and counter changes; a failed mirror aborts
the group join. Direct project learner add/exit APIs reject
`PROJECT_TEAM_GROUP_MANAGED` after a locked project-row check. Mentor
management is separate.

Added isolated PostgreSQL tests: transition/rejoin mirroring, direct writer
rejection, and rollback on a conflicting privileged-SQL project member.
**The tests have been authored but have NOT run; CI runner was never allocated.**

## Atomic elective transfer (2026-10-10)

Added `moveElectiveMember` in the group kernel (also re-exported as
`moveElectiveSelection` from the electives module). Moves require same active
slot, two distinct active backed offerings, authenticated college administrator,
active same-program learner, active source membership, and target membership state. A locked REMOVED target may be revived only by an explicit admin move, with the lock preserved.
Within ONE PostgreSQL transaction we lock the shared slot, then both groups
in deterministic ID order; validate target capacity BEFORE removing source;
update group seats/history; and promote an eligible source waitlisted learner.
If the target is unavailable with no waitlist, all source mutations roll back.
No primary section enrollment changes. This mirrors legacy
`ElectiveService.move` rather than doing two independent HTTP actions.

The group promotion helper also mirrors project-team members atomically,
preserving another DB03 workstream's group/project source-of-truth mapping.
Two more PostgreSQL tests cover successful transfer and failed full-target
rollback. Runtime test execution remains BLOCKED.

## Rule-based group roster batch (2026-10-10)

Added strict `rule-evaluator.ts` (programs, cohorts, CGPA, active backlogs,
passing years; absent academic evidence fails closed) plus transactionally
serialized `upsertGroupRule` and `refreshGroupRule`. Reruns reconcile the
ACTIVE count, append event history for state changes, honor finite capacity
and optional waitlist, and preserve manual/CSV/SELF and locked decisions.
Unknown legacy JSON rule fields or empty catch-all criteria are rejected
rather than silently broadening the audience. Generic rule runner explicitly
rejects ELECTIVE and PROJECT_TEAM kinds, which need feature-specific
reconciliation to honor max-pick and project mirrors.

Includes a pure evaluation suite and an isolated PostgreSQL idempotence,
locked-override and manual-protection integration test. **NOT EXECUTED**.
Rule scheduling (`autoRefresh`) and complete legacy eligibility-expression
parity remain release blockers, not falsely marked complete.

## Rule roster reconciliation — waitlist vacancy and lifecycle (2026-10-10)

The generic rule refresher now rejects non-ACTIVE groups rather than
materializing member access before activation. It also promotes already
WAITLISTED, still-matching, unlocked RULE memberships (ordered by existing
waitlist position) when rule removals create vacancies, before considering
new matches. Human-managed/locked states are left untouched. Promoted
transitions record separate immutable SYSTEM events and are idempotent on
subsequent refreshes. New isolated PostgreSQL tests cover vacancy
promotion and DRAFT-group rejection. **Tests have not been executed.**

## Disabled-user target hardening (2026-10-10)

Manual join and PostgreSQL member identity trigger now both require ACTIVE user platform status as well as ACTIVE college membership, eliminating disabled accounts consuming seats through privileged/admin joins. New integration test covers service rejection and physical SQL rejection. Runtime result: NOT TESTED.

## Soft-deleted elective listing protection (2026-10-10)

`listElectiveOfferings` now excludes `deleted_at` rows even if the old status is still ACTIVE; the shared slot pick limit and roster-access predicates already excluded them. Added an isolated PostgreSQL regression case. Not executed.


## Implementation checkpoint, 2026-10-10 — RELEASE BLOCKED

**Source-implemented, not evidence-verified:** six foundational tables (0037),
project-team FK (0038), four parent/tenant integrity trigger families and
immutable group ownership (0039), historical creator actor and event member
type snapshots (0040). Rule evaluator/refresh, cross-program elective join and
read access, learner course/timetable access, project-team transaction mirror,
direct learner edit protection, and event immutability are authored.

**Field accounting:** `docs/planning/database-parity-db03-79-field-crosswalk.json`
lists **all 79 source columns** with **79 proposed target paths / derived
structures**, **0 currently unmapped**, and **0 formally verified**. Proposed
mapping is NOT equality of business behavior.

**Authored DB03 test cases:** 17 `groups-db03.test.ts`, 11
`groups-db03-roster.test.ts`, 3 `groups-db03-project-team.test.ts`,
2 pure `groups-db03-rule-evaluator.test.ts`, 8 static
`db-parity-db03-schema.test.mjs`: **41 authored, 0 executed here**.
DB03 pull request #7 was merged into main at
`594a7ee61d093540d0aba8ffcfde30bba9c5bc35` following explicit user
instruction. Follow-up pull request #18 merged at
`ad538fd0cc41b885c4a524ff52d0b35cd84d31e7` to prevent a disabled
user from retaining group-backed elective access through a stale request
context. GitHub Actions fails before any job steps (no runner allocated),
so these merges do NOT provide evidence of compilation, migration, DB or
end-to-end correctness. DB03 remains RELEASE BLOCKED.

**Prioritized hard blockers to call DB03 complete:**
1. Runner/disposable PostgreSQL: `npm ci`, `npm run lint`,
   `npm run typecheck`, `npm run test:db:parity`, `npm run db:generate`;
   inspect `git diff --exit-code -- drizzle/` to catch manually-authored
   snapshot drift.
2. Replay all migrations 0000–0040 on a **new disposable PostgreSQL** database,
   inspect physical tables, FKs, indexes, CHECKs and functions/triggers in
   `pg_catalog`; run isolated DB03 integration and negative-write/race
   suites. **Never point database reset/test helpers at production or shared DB.**
3. Prove lecture attendance capture, quiz/assignment submission/grading,
   learner/faculty/admin course and section roster, scheduling, content and
   history are consistent under cross-program electives and group lifecycle.
4. Reconcile *full* legacy JSON eligibility criteria, elective semester/year,
   refresh scheduling policy, group capacity/rule race with direct joins,
   project team source-of-truth across all producer APIs.
5. Review and sign off each of the 79 crosswalk fields with concrete
   PostgreSQL and write/read workflow evidence. Review concurrent branch
   changes before signoff. Legacy actual SQL schema is still not inspected.

**No migration of historical production data** (vNext greenfield). Do not
estimate release readiness from count of tables, source-audit passes or
authored tests. The broader 2,829-field LMS database parity remains open.

## Active handoff after merge, 2026-10-10

**Authoritative development branch for this workstream: `main`.** The historical
`db-parity-2026` branch and PR #7 are completed integration history; do not
continue DB03 on the old branch or copy stale head snapshots over main. Check
current main SHA and preserve all parallel DB08/DB10 work. A small follow-up
required PR #18 because other chats were updating main concurrently.

**Release gate remains OPEN**: disposable PostgreSQL migration replay,
Drizzle-generated snapshot consistency, TypeScript compilation, isolated
integration tests, cross-program elective attendance/quiz/submission E2E,
rule refresh scheduling and actual 79-field signoff. The count of written tests
is not a proxy for passing tests.

## W01 transactional actor freshness and migration preflight (2026-10-10)

PR #27 adds a persisted actor status/membership/role check for group writes and rule refresh under transaction-scoped SHARE locks, closing stale `RequestContext` revocation windows. PR #31 extends this protection to elective slot/offering writes and fixes the missing `isNull` import used by elective listing. The new isolated DB03 test file authors five negative write cases, not yet executed. PR #29 adds a structural migration journal preflight and six Node regression cases, wired into CI; it cannot replace `drizzle-kit generate` or actual PostgreSQL replay. Merge commits and remaining blockers are itemized in `docs/planning/w01-platform-closure-status.md`.

**DB03 remains RELEASE BLOCKED:** zero of 79 field mappings verified by runtime/producer-consumer evidence; runner-backed TypeScript, disposable PostgreSQL and browser suites not executed. Do not extrapolate implementation or semantic closure from test authorship.


## Chat 5 DB-006 source reconciliation (2026-10-11)

**Queue disposition: implementation/source review complete, runtime verification pending.**

Chat 5 re-read the pinned legacy DB03 migrations and product contracts against the
current vNext schema/services. The pass accounts for **79/79 source fields with
proposed targets, 0 unmapped after source review, and 0 formally runtime-verified**.
The updated source ledger is
`docs/planning/db-pass4-columns-db03_groups_and_electives.json`. This source-review
state MUST NOT be reported as database verification.

The pass found three concrete legacy-behavior mismatches in the already-authored
group service and corrected them on main:

- Missing/non-boolean `config_json.allowWaitlist` now preserves the legacy default
  of `true`; only explicit boolean `false` disables waitlisting. This applies to
  both ordinary joins and same-slot elective transfers.
- Missing/non-boolean `config_json.allowSelfLeave` now preserves the legacy default
  of `true`; only explicit boolean `false` disables learner self-leave.
- A locked `REMOVED` membership still blocks learner self-rejoin, but an explicit
  admin re-add or elective move may revive it and preserves `is_locked=true`, as
  the legacy kernel did.

Regression specifications were added/updated in
`tests/integration/groups-db03.test.ts`, including empty-config defaults,
admin revival of a locked removed membership, preservation of that lock across
an elective move, and explicit `allowWaitlist=false` for the rollback-on-full
case.

Evidence commits:
`fa78a96fd4448c0828c30b77cd98105e8c433666`,
`f4b498f5da75e104b04a4b04fd4aef31b82b83c8`,
`078a707cbf0b0788068fd1a9a4acd845396f6402`,
`ba35e3ae9e65738c0d41a81bd1f8adba9319f92d`, and
`7ae2a5de9035c2df349eaf176905e6e4b1db825e`.

**Still not DONE_VERIFIED:** DB-001 runner/disposable PostgreSQL is blocked, so
the authored TypeScript/PostgreSQL tests were not executed here. The global
negative DB witness, active-field disposition and fresh-schema certification
tasks remain responsible for executed migration/runtime evidence. The
`backed_class_id -> backed_delivery_id + group-roster consumers` semantic
redesign also still requires end-to-end course/attendance/assessment proof
before release certification.


## DB-006 registered PostgreSQL engineering receipt (2026-10-29)

**Executed, not staged:** the forward-only registered migration
`drizzle/0306_db03_elective_kernel_integrity.sql` adds PostgreSQL guards
for direct-SQL learner program/current term/nullable academic-year eligibility,
one-slot `max_pick` concurrency serialization, active offering backing-program
identity and prevention of structural reparenting while an elective is active.
The registered journal and 0306 snapshot form part of a clean PG17 replay.
The common elective roster predicate now feeds faculty attendance as well as
learner learning access, to deny a stale member after term changes and a disabled
source course. Academic transfers in regression fixtures retire the old active
enrollment with the required timestamps and create new immutable identities;
they do not mutate the DB02 program/cohort FK.

**Exact passing acceptance:** commit `df74adf75e2a2e58f6df65aa4771924554c746bd`,
dedicated GitHub Actions run
https://github.com/42Students/lms-vnext/actions/runs/40751132217
returned **SUCCESS** on Ubuntu/Node 22 with isolated PostgreSQL 17:
`npm ci`, `npm run db:journal:verify`, full disposable
`npm run db:test:prepare`, `npm run db:migrate` idempotence,
`tests/db006-catalog-pg.test.mjs`, four DB03 integration test files
(**57/57 PASS**) and two DB03 source-contract suites
(**17/17 PASS**). The catalog witness verified physical existence of
all 79 proposed legacy target columns/indexes and registered trigger objects;
it **did not prove 79/79 producer-consumer field semantics**. The archive-aware
course, member-history immutability, same-slot race, tenant denial, group
rule idempotence, project-team mirroring and group-backed attendance/course
access tests and the rule refresh's default waitlist=true/explicit false
parity regression are included in the 57 executed PG tests.

**Do not re-run the original DB03 source inventory or the already-green 55
integration scenarios merely to count work.** The sole tracker
`docs/tracker.json` still correctly keeps **DB-006 done:false** pending
a full 79-field semantic disposition with executable producer/consumer
witnesses or justified/approved retirement and the remaining legacy group-rule
`JobEligibility` contract (verified education percentages, branches/batches,
verification policy and absence behavior). The existing vNext
`rule-evaluator.ts` expressly supports only a safe, strict subset of the
legacy JSON. That is a **real functional gap**, not an independent final
signature that may be deferred as RELEASE review. Final full database/API/UI
phase certification is also separate. Continue from this exact gap; do not
mistake physical 79 target proof for semantic approval.
