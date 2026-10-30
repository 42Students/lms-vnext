-- DB020 / DB045: reconcile one confirmed PostgreSQL-vs-exported-typed-schema
-- gap without rewriting already-applied 0205 or installing unregistered
-- staged history tables. The type is an OPTIONAL provenance field; it is not
-- proof that every legacy action was authorized or historically ingested.
--
-- The current 0205 grade-audit table exists on all registered installations.
-- No active grade writer is required to populate source_action: null means
-- no independently verified source string has been captured.
ALTER TABLE assignment_grade_events
 ADD COLUMN source_action varchar(120);
