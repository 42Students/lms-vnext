# Migration journal reconciliation — 25 October 2026

This change recovers the source Drizzle journal from an invalid 294/295 tail without inventing schema state or silently omitting SQL.

- Old journal 294/295 incorrectly pointed to `0312_chat12_notification_delivery_cancelled.sql` and `0313_chat14_template_less_legacy_projects.sql`; these now have ordinal-matching filenames `0294_...` and `0295_...`, preserving their SQL bodies and ordinal timestamps.
- Previously orphaned `0310_chat7_public_issue_catalog.sql` and `0311_chat7_core_updated_at_guards.sql` are registered as subsequent migrations `0296_...` and `0297_...` with identical SQL. Their old unregistered files are deleted, not executed twice.
- The four snapshot states are reconstructed from committed `0293_snapshot.json` and each actual DDL delta. 0294 changes the separately managed notification outbox check constraint (table absent from the earlier Drizzle introspection snapshot), so its managed snapshot schema is otherwise unchanged. 0295 drops template pair NOT NULL and registers its pair check. 0296 adds the public bug catalog approval column and partial descending index. 0297 adds PostgreSQL trigger logic, which is outside Drizzle's table snapshot representation.
- Each snapshot carries a unique id chained through prevId; no table or record data was fabricated. The source schema has the new bug public catalog index for parity.
- **Deployment safety:** Before applying to any *existing* environment, inspect its `__drizzle_migrations` table and independently applied `0310–0313` history/checksums. Fresh disposable PostgreSQL CI is the first mandatory execution test. Do not reapply a deployed DDL statement or force-rewrite an existing production journal without reconciling applied state.
- CI `db:journal:verify` should enforce numbering and snapshot ancestry on the actual committed files. Its success alone is not a passing migration or full Mentor acceptance.
