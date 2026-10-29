-- DB-079 / L01 integration candidate. STAGED ONLY; NOT REGISTERED.
-- Security fix for migration 0075's column-specific trigger:
-- UPDATE rating/note after a recruiter grant revocation currently bypasses the
-- existing active-grant check because no identity column is in the SET list.
-- Register as a NEW forward-only migration after disposable PostgreSQL replay;
-- never modify 0075, rewrite historical snapshots, or grant new privileges.
-- PostgreSQL 17 CREATE OR REPLACE TRIGGER preserves the existing trigger name
-- and function while widening the firing events to ALL UPDATEs.
--
-- Existing function db09_assert_recruiter_private_note_scope() continues to
-- require a live same-college and same-relationship recruiter grant.
-- The independent lifecycle trigger still enforces immutable parent identities
-- and monotonically increasing update timestamps.
--
-- Acceptance: revoked/wrong-company UPDATE rating/note -> SQLSTATE 23514;
-- live same-company granted recruiter UPDATE with advanced updated_at -> PASS;
-- identity and timestamp tampering remain denied; active grant revocation
-- concurrently with an edit must be independently exercised in PostgreSQL.
-- No SQL body here migrates or deletes stored notes.

CREATE OR REPLACE TRIGGER db09_recruiter_private_note_scope_guard
  BEFORE INSERT OR UPDATE
  ON placement_recruiter_applicant_notes
  FOR EACH ROW
  EXECUTE FUNCTION db09_assert_recruiter_private_note_scope();
