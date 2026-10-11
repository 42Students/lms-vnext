-- DB-004 / Chat 2 / 2026-10-11: one-time handoff row-transition hardening.
-- STAGED ONLY, NOT a registered migration. Chat 1 alone owns journal/barrel.
-- Install only together with identity_auth_handoffs table if the DB-backed
-- handoff design is approved. Do not run this SQL against an existing DB.
--
-- A CHECK and conditional UPDATE do not prevent another writer from resetting
-- consumed_at to NULL, extending expiry or rebinding host/member/code. This
-- trigger enforces the immutable envelope and monotone one-time consume state.

CREATE OR REPLACE FUNCTION db01_auth_handoff_lifecycle_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- The one-time proof is always bound to its original principal, college,
  -- membership, target domain, hostname and opaque keyed-code fingerprint.
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.college_id IS DISTINCT FROM OLD.college_id
     OR NEW.target_membership_id IS DISTINCT FROM OLD.target_membership_id
     OR NEW.target_domain_id IS DISTINCT FROM OLD.target_domain_id
     OR NEW.target_host IS DISTINCT FROM OLD.target_host
     OR NEW.code_mac IS DISTINCT FROM OLD.code_mac
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Auth handoff identity and target scope are immutable'
      USING ERRCODE = '23514',
            CONSTRAINT = 'db01_auth_handoff_scope_immutable_ck';
  END IF;

  -- Shortening the deadline for revocation is allowed; extending it is not.
  IF NEW.expires_at > OLD.expires_at THEN
    RAISE EXCEPTION 'Auth handoff expiration may not be extended'
      USING ERRCODE = '23514',
            CONSTRAINT = 'db01_auth_handoff_expiry_monotonic_ck';
  END IF;

  -- Once consumed, even no-op UPDATEs are denied. A future retention purge
  -- may DELETE a row under a separate approved data-retention policy.
  IF OLD.consumed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Consumed auth handoff cannot be altered or rearmed'
      USING ERRCODE = '23514',
            CONSTRAINT = 'db01_auth_handoff_consumed_immutable_ck';
  END IF;

  -- An expiry comparison against transaction-start now() can be stale when
  -- a concurrent consumer was blocked waiting for a row lock. Recheck the
  -- actual server clock AFTER acquiring that lock, even if a caller supplied
  -- an earlier consumed_at timestamp that passes the row CHECK.
  IF NEW.consumed_at IS NOT NULL
     AND clock_timestamp() >= NEW.expires_at THEN
    RAISE EXCEPTION 'Expired auth handoff cannot be consumed'
      USING ERRCODE = '23514',
            CONSTRAINT = 'db01_auth_handoff_expired_consume_ck';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER db01_auth_handoff_lifecycle_trg
BEFORE UPDATE ON identity_auth_handoffs
FOR EACH ROW
EXECUTE FUNCTION db01_auth_handoff_lifecycle_guard();

-- PROMOTION/ACCEPTANCE NOTES:
-- 1. Keep the unique code_mac index, <=2-minute CHECK, and composite scope
--    FK proposal. This guard alone does not verify that host == domain.host
--    or that the actor/member/college/domain remain active and authorized.
-- 2. Consume only in a transaction that locks/revalidates current principal,
--    member and verified domain, with exactly-one UPDATE RETURNING winner.
-- 3. Use clock_timestamp() in the conditional consume WHERE and SET, rather
--    than relying on stale transaction-start now() at the expiry boundary.
-- 4. Purge only via a separately authorized bounded-retention DELETE; do
--    not implement retry by resetting consumed_at, rotating MAC, or reissuing
--    the same row. New handoffs require newly generated 256-bit codes.
-- 5. Execute two-client PostgreSQL tests for concurrent consumption, stale
--    transaction expiry, token/host/college/target rebinding, deadline
--    extension, expired consumption and consumed replay before promotion.
