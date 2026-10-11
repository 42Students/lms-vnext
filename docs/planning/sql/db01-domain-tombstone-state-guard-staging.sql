-- Chat 2 / DB-004 / 2026-10-11
-- STAGED ONLY. NOT REGISTERED, NOT APPLIED. Chat 1 owns all numbered
-- Drizzle migrations, the active schema barrel and activation sequencing.
-- Companion to db01-tenant-domain-tombstone-staging.sql, NOT a substitute.
--
-- Current vNext repository hard-deletes tenant_domains and DNS recheck can
-- write verification metadata from a pre-deletion snapshot. Tombstone
-- activation MUST be coordinated with repository/read paths; this prevents
-- DELETE/history-loss and stale UPDATE resurrection at the database layer.
-- This SQL assumes deleted_at, deleted_by_user_id, deletion_reason exist.

CREATE OR REPLACE FUNCTION db01_domain_tombstone_state_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Once tombstoned, no UPDATE of any field may rearm or mutate the historic
  -- hostname, verification state, primary flag, diagnostics or audit actor.
  -- The row lock is held before this trigger observes OLD; a concurrent
  -- verifier blocked by a deletion therefore sees OLD.deleted_at non-NULL.
  IF OLD.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Tombstoned domain is immutable'
      USING ERRCODE = '23514',
            CONSTRAINT = 'db01_domain_tombstone_terminal_ck';
  END IF;

  -- A hostname (including a verified alias) cannot silently transfer to a
  -- second college: migration must create a new independently proven host.
  IF NEW.college_id IS DISTINCT FROM OLD.college_id THEN
    RAISE EXCEPTION 'Domain tenant ownership is immutable'
      USING ERRCODE = '23514',
            CONSTRAINT = 'db01_domain_college_immutable_ck';
  END IF;

  -- Deletion is a single atomic UPDATE. Preserve historical proof but
  -- immediately disable routing: a deleted row cannot remain primary.
  -- The separate table CHECK enforces the same property on direct INSERT.
  IF NEW.deleted_at IS NOT NULL THEN
    IF NEW.is_primary IS DISTINCT FROM false THEN
      RAISE EXCEPTION 'Tombstoning requires clearing primary in the same write'
        USING ERRCODE = '23514',
              CONSTRAINT = 'db01_domain_tombstone_nonprimary_ck';
    END IF;
    -- Tombstoning is not an opportunity to rewrite historical DNS proof.
    -- Erase any outstanding secret token, but keep the old host, status,
    -- verification timestamp and diagnostic evidence unchanged.
    IF NEW.host IS DISTINCT FROM OLD.host
       OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
       OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
       OR NEW.last_checked_at IS DISTINCT FROM OLD.last_checked_at
       OR NEW.last_check_result IS DISTINCT FROM OLD.last_check_result
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
       OR NEW.verification_token IS NOT NULL THEN
      RAISE EXCEPTION 'Tombstone must preserve proof history and erase DNS secret'
        USING ERRCODE = '23514',
              CONSTRAINT = 'db01_domain_tombstone_history_ck';
    END IF;
    RETURN NEW;
  END IF;

  -- A changed hostname is a different DNS possession claim. Reuse of the
  -- previous proof or TXT token can assign trust to a host never validated.
  -- SQL DDL CHECKs cannot compare OLD.host and NEW.host; this trigger can.
  IF NEW.host IS DISTINCT FROM OLD.host THEN
    IF NEW.is_verified IS DISTINCT FROM false
       OR NEW.is_primary IS DISTINCT FROM false
       OR NEW.verified_at IS NOT NULL
       OR NEW.last_checked_at IS NOT NULL
       OR NEW.last_check_result IS NOT NULL
       OR NEW.verification_token IS NULL
       OR NEW.verification_token IS NOT DISTINCT FROM OLD.verification_token THEN
      RAISE EXCEPTION 'Changing hostname requires new verification token and cleared old proof'
        USING ERRCODE = '23514',
              CONSTRAINT = 'db01_domain_host_change_proof_reset_ck';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER db01_domain_tombstone_state_trg
BEFORE UPDATE ON tenant_domains
FOR EACH ROW
EXECUTE FUNCTION db01_domain_tombstone_state_guard();

-- Hard DELETE bypasses an UPDATE-only tombstone guard. Block until a
-- separately authorized bounded-retention purge design is approved.
CREATE OR REPLACE FUNCTION db01_domain_no_hard_delete_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Domain deletion must be a tombstone update'
    USING ERRCODE = '23514',
          CONSTRAINT = 'db01_domain_hard_delete_forbidden_ck';
END;
$$;

CREATE TRIGGER db01_domain_no_hard_delete_trg
BEFORE DELETE ON tenant_domains
FOR EACH ROW
EXECUTE FUNCTION db01_domain_no_hard_delete_guard();

-- INTEGRATION REQUIREMENTS (unverified):
-- (1) Replace current DELETE with an atomic update setting deleted_at and
--     is_primary=false and explicit actor/audit metadata.
-- (2) Add deleted_at IS NULL to EVERY host lookup/list/set-primary/DNS
--     verification and public bootstrap, not merely the external resolver.
-- (3) The old all-time lower(host) uniqueness and tenant FK stay intact.
--     Host reuse after deletion needs separate explicit policy.
-- (4) Changing host requires a NEW high-entropy verification token and
--     clearing the previous proof/diagnostics; current API has no host
--     update operation, so this is a direct SQL / future contract guard.
-- (5) Tombstone-vs-verification and tombstone-vs-primary under two real PG
--     clients MUST pass in both lock orders, including rollback/retry.
-- (6) Genuine migrated-schema test/replay, correct tenant authorization
--     and current ACTIVE organization/college authorization remain pending.
-- (7) Don't treat this file as production-verified, or activate without
--     coordinated API changes; current deleteDomain is still a hard DELETE.
