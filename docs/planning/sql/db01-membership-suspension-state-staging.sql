-- DB-004 / Chat 2. CANDIDATE ONLY: NOT A REGISTERED MIGRATION.
-- vNext source contract:
--   src/modules/people/membership-domain.ts getMembershipLifecyclePatch
--   src/modules/people/validation.ts membershipLifecycleInputSchema
--   src/db/schema/memberships.ts collegeMemberships
-- Source legacy parity still needs a separate persisted-workflow decision.
-- Chat 1 is sole owner of numbered Drizzle migrations and schema barrel.
-- DO NOT APPLY this staging SQL directly.

-- Existing greenfield vNext lifecycle producer:
--   ACTIVE / ENDED -> suspended_at=null, suspension_reason=null.
--   SUSPENDED -> suspended_at set, reason is trimmed and 1..1000 chars.
-- A direct SQL client currently can write status/metadata disagreements.
ALTER TABLE college_memberships
  ADD CONSTRAINT college_memberships_suspension_state_ck
  CHECK (
    (
      status = 'SUSPENDED'
      AND suspended_at IS NOT NULL
      AND suspension_reason IS NOT NULL
      AND char_length(btrim(suspension_reason)) BETWEEN 1 AND 1000
    )
    OR (
      status IN ('ACTIVE', 'ENDED')
      AND suspended_at IS NULL
      AND suspension_reason IS NULL
    )
  );

-- This is a per-row shape constraint ONLY.
-- It does not forbid ENDED -> ACTIVE by another SQL actor. The current
-- application domain rule treats ENDED as terminal; automatic DB triggers
-- are NOT proposed until the product decides how alumni rejoining a college
-- ought to be represented with current user_id+college_id uniqueness.
--
-- Before Chat 1 registration:
--   1. Check existing active DB rows for constraint violations (no backfill
--      or silent rewrites). Greenfield does not mean unsafe production reset.
--   2. Confirm service REACTIVATE/END clears both metadata fields.
--   3. Test SUSPENDED without timestamp, blank/oversize reason, ACTIVE/ENDED
--      with dangling suspension metadata -> SQLSTATE 23514.
--   4. Test valid SUSPEND -> REACTIVATE -> END and SAME-USER multi-college
--      independence; ensure revoked membership cannot be chosen as active.
--   5. Decide END terminality, reenrollment semantics and durable lifecycle
--      audit separately from this shape constraint.
--   6. Run clean and incremental PostgreSQL migration replay independently.
