# DB03 79-column semantic crosswalk — PROPOSED / UNVERIFIED

Generated from `docs/planning/db-pass4-columns-db03_groups_and_electives.json` (legacy migrations) against the committed vNext Drizzle snapshot 0039. This is an **all-column accounting ledger, not a verified parity result**.

| Gate | Evidence |
| --- | --- |
| Legacy source tables | 6 |
| Legacy source columns listed | 79 |
| Proposed target paths/derived structures | 78 |
| Truly unmapped historical fields | 1 |
| Runtime/semantic field verifications | **0** |

## Highest-risk semantic differences

1. **Legacy group creator type is NOT persisted**: `lms_group.created_by_type` does not have a vNext historical column. A creator user ID cannot reproduce an actor's old role after changes. Resolve by adding a durable creator-type snapshot or documenting approved intentional retirement.
2. **Event member type is derived from current group-member row**, not stored immutably per event. If member type ever changes, event history loses the original type. Resolve by storing event type snapshot or enforcing permanent type immutability with tests.
3. **Legacy backed class is a different primitive** than vNext `course_section_deliveries`. The current group-backed course, quiz, timetable and attendance consumers must be end-to-end tested, including cross-program learner access without home-section movement.
4. **Source numeric IDs are redesigned as tenant-scoped UUID membership IDs**. Audit actual producer/consumer identity interpretation rather than comparing only column types.
5. **MySQL generated active_course_key is replaced by partial unique index**. Negative SQL/race and archive/re-offer tests are still required.
6. **Soft delete and time semantics** translate `is_deleted` boolean to `deleted_at` and legacy DATETIME to `timestamptz`; check every archived/historical read and time-window boundary.
7. `lms_group_member_event` is append-only via a custom trigger not represented in Drizzle snapshot; inspect `pg_trigger` and test UPDATE/DELETE rejection.

Each of the 79 JSON rows includes legacy source, proposed target, status `UNVERIFIED`, and empty evidence/signoff fields. Before marking DB03 complete, every row must receive actual schema+workflow proof or explicit approved retirement with recorded decision. No tests were run by this document.
