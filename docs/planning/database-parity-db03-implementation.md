# DB03 schema implementation — foundation batch (2026-10-10)

**State: SIX TABLES AUTHORED / NOT DATABASE-VERIFIED.**
Legacy source: `lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5` V166/V167/V168/V191.

Added: `lms_groups`, `lms_group_members`, `lms_group_member_events`, `lms_group_rules`, `elective_slots` and `elective_offerings`. All use UUIDs and PostgreSQL types; source concepts (membership state/source/locked, event history, group active_count, rule state, slot pick limits, offering archive-aware uniqueness) are preserved. New CHECKs and restrictive FKs guard basic invariants.

**Intentional mapping decision:** legacy polymorphic `member_type + member_id` becomes a scoped `college_memberships.id` FK, with separate display type. `created_by_type/id` becomes user identity. No migration of old production data.

**Unresolved before DB03 DONE:** actual migrations and Drizzle snapshot must be generated/verified with drizzle-kit and disposable Postgres; atomic join/leave/event/waitlist + max-pick concurrency implementation/tests; tenant and creator permission checks at every writer; platform owner groups; rule refresh; project team mirror; group-backed course content/quiz/attendance access and cross-program roster; semantic sign-off for all 79 legacy fields.

`backed_delivery_id` is a nullable bridge only, **not** implementation of the legacy GROUP_BACKED class contract. Primary `section_enrollments` is not modified. Do not mark group-backed roster parity on presence of this FK.

## Follow-up verification
Run `npm run db:generate` in a complete checkout and inspect generated `0037` drift against the authored SQL, then replay migrations against disposable PostgreSQL before running tests. The manually authored migration is **not yet registered in the journal** until a generated snapshot can be validated. It will not apply through `db:migrate` at this checkpoint.
