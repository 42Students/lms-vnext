# DB03 79-column semantic crosswalk — PROPOSED / UNVERIFIED

Generated from `docs/planning/db-pass4-columns-db03_groups_and_electives.json` (legacy migrations) against the committed vNext Drizzle snapshot 0040. This is an **all-column accounting ledger, not a verified parity result**.

| Gate | Evidence |
| --- | --- |
| Legacy source tables | 6 |
| Legacy source columns listed | 79 |
| Proposed target paths/derived structures | 79 |
| Truly unmapped historical fields | 0 |
| Runtime/semantic field verifications | **0** |

## Highest-risk semantic differences

1. **Creator role is newly persisted**: `lms_groups.created_by_type` (migration 0040). Creation writes a role snapshot, but role/actor semantics still require DB tests.
2. **Event member type is newly persisted**: `lms_group_member_events.member_type` (migration 0040), not derived from mutable roles. Verify event writers and history retention.
3. **Legacy backed class is a different primitive** than vNext `course_section_deliveries`. The current group-backed course, quiz, timetable and attendance consumers must be end-to-end tested, including cross-program learner access without home-section movement.
4. **Source numeric IDs are redesigned as tenant-scoped UUID membership IDs**. Audit actual producer/consumer identity interpretation rather than comparing only column types.
5. **MySQL generated active_course_key is replaced by partial unique index**. Negative SQL/race and archive/re-offer tests are still required.
6. **Soft delete and time semantics** translate `is_deleted` boolean to `deleted_at` and legacy DATETIME to `timestamptz`; check every archived/historical read and time-window boundary.
7. `lms_group_member_event` is append-only via a custom trigger not represented in Drizzle snapshot; inspect `pg_trigger` and test UPDATE/DELETE rejection.

Each of the 79 JSON rows includes legacy source, proposed target, status `UNVERIFIED`, and empty evidence/signoff fields. Before marking DB03 complete, every row must receive actual schema+workflow proof or explicit approved retirement with recorded decision. No tests were run by this document.
