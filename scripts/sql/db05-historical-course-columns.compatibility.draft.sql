-- Chat 6 / DB-008 / DATABASE. UNREGISTERED CONDITIONAL COMPANION.
-- DO NOT apply or count as an eighth independent DB05 migration.
-- Integrator: Chat 1 exclusively. Proposed optional extension to
-- scripts/sql/db05-course-identity.draft.sql IF source preservation chosen.
--
-- Historical MySQL snapshot:
--   course.default_subscription_days INT DEFAULT NULL
--   course.formal_title VARCHAR(255) DEFAULT NULL
-- Source: 42Students/lms/src/test/resources/db/mysql-schema-snapshot.sql
-- The current legacy Course.java and CourseDTO.java DO NOT map either field.
-- Bounded scan of 13 current legacy Java course paths and 15 React/JS course
-- paths had zero exact snake_case/camelCase references to these names.
-- See docs/planning/db05-historical-course-columns-source-evidence.json.
-- This is NOT proof no other SQL/report/export/client references exist.
--
-- Neither column has a current vNext business consumer or an approved
-- retirement disposition. Chat 1 must CHOOSE one:
-- (A) Preserve in nullable typed compatibility storage, with explicit
--     no-reader/no-writer state until API semantics are source-approved.
-- (B) Explicitly retire from greenfield vNext after complete current source
--     consumer audit and documented product-owner approval.
-- NEVER silently drop from the DB05 parity ledger.
--
-- IF (and only if) A chosen, fold the following once into the shared Drizzle
-- schema and numbered migration after checking all same-named columns:
BEGIN;
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS legacy_default_subscription_days integer,
  ADD COLUMN IF NOT EXISTS legacy_formal_title varchar(255);
COMMIT;

-- No DEFAULT, NOT NULL, forced positive check, subscription entitlements,
-- billing policy, title precedence or expiry semantics are invented here.
-- NO application writes/reads, PostgreSQL test or registered migration proof.
-- Requires source/consumer decision + W01 clean replay before activation.
