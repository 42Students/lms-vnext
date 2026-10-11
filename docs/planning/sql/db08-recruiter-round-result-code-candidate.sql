-- DB-072 / Chat 3. ISOLATED CANDIDATE, not a registered migration.
-- Final recruiter naming + round-result provenance vocabulary.
--
-- Frozen legacy oracle:
--   42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
--   V193__recruiter_naming.sql:
--     round_result.source HR -> RECRUITER
--     round_result.submitted_by_type HR -> RECRUITER
--
-- Frozen active provenance:
--   TPOResultsService / RoundResult: TPO, recruiter, PANELIST, DRIVE_DAY, EXCEL
--   TpoImportService actively stages EXCEL
--   RecruiterDriveWorkService actively stages RECRUITER
--
-- vNext normalization:
--   EXCEL -> IMPORT
--   recruiter/HR -> RECRUITER
--   PANELIST, DRIVE_DAY, TPO retained
--   submitted_by_type is redesigned away; submitted_by_user_id is canonical
--   actor identity and source carries provenance.
--
-- DEPLOYMENT BARRIER:
-- Current result-service still writes/recognizes "HR". Therefore final strict
-- RECRUITER-only activation MUST NOT run before API cutover. Register the
-- EXPAND migration first; finalize only after the producer/consumer cutover.

-- === DB072 EXPAND: safe while the old API still writes HR ===================

DO $db072_expand_preflight$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM placement_round_results
     WHERE source NOT IN ('TPO','HR','IMPORT')
  ) THEN
    RAISE EXCEPTION
      'DB072 expand: unexpected pre-cutover placement_round_results.source value';
  END IF;
END
$db072_expand_preflight$;

ALTER TABLE placement_round_results
  DROP CONSTRAINT placement_round_results_source_ck;

-- Forward-compatible bridge:
-- * old API can continue writing HR;
-- * new API can begin writing RECRUITER;
-- * future provenance writers can use PANELIST/DRIVE_DAY;
-- * normalized spreadsheet import uses IMPORT.
ALTER TABLE placement_round_results
  ADD CONSTRAINT placement_round_results_source_ck
  CHECK (
    source IN (
      'TPO',
      'HR',
      'RECRUITER',
      'PANELIST',
      'DRIVE_DAY',
      'IMPORT'
    )
  );

-- STOP HERE until API cutover:
--   result-service recruiter conflict check accepts RECRUITER (and transitional
--   HR rows); recruiter writer emits RECRUITER, never HR.
-- No data rewrite occurs in EXPAND, so the old producer remains behaviorally
-- compatible during a phased deployment.

-- === DB072 FINALIZE: only after API cutover is confirmed ====================

-- This lock makes the rewrite + strict CHECK atomic with respect to concurrent
-- round-result writes in this migration transaction. It cannot protect against
-- an old application instance that keeps running after commit; deployment must
-- therefore drain/cut over old writers before FINALIZE.
LOCK TABLE placement_round_results IN SHARE ROW EXCLUSIVE MODE;

DO $db072_finalize_preflight$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM placement_round_results
     WHERE source NOT IN (
       'TPO','HR','RECRUITER','PANELIST','DRIVE_DAY','IMPORT'
     )
  ) THEN
    RAISE EXCEPTION
      'DB072 finalize: unexpected placement_round_results.source value';
  END IF;
END
$db072_finalize_preflight$;

UPDATE placement_round_results
   SET source='RECRUITER'
 WHERE source='HR';

ALTER TABLE placement_round_results
  DROP CONSTRAINT placement_round_results_source_ck;

ALTER TABLE placement_round_results
  ADD CONSTRAINT placement_round_results_source_ck
  CHECK (
    source IN (
      'TPO',
      'RECRUITER',
      'PANELIST',
      'DRIVE_DAY',
      'IMPORT'
    )
  );

DO $db072_finalize_postcheck$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM placement_round_results
     WHERE source='HR'
  ) THEN
    RAISE EXCEPTION
      'DB072 finalize: legacy HR source survived conversion';
  END IF;
END
$db072_finalize_postcheck$;

-- W01 integration notes:
-- 1) Keep EXPAND and FINALIZE as separate ordered migrations / release gates.
-- 2) Canonical Drizzle final CHECK is:
--      TPO | RECRUITER | PANELIST | DRIVE_DAY | IMPORT
-- 3) Do not add submitted_by_type back to vNext. submitted_by_user_id remains
--    canonical actor identity; source is provenance.
-- 4) API cutover changes result-service recruiter writer HR -> RECRUITER and
--    makes the staged-result ownership/conflict check transition-safe.
-- 5) Spreadsheet result import uses IMPORT, not legacy EXCEL.
-- 6) Run the authored disposable PostgreSQL expand/finalize witnesses before
--    claiming DONE_VERIFIED.
