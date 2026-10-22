-- DB067 / Chat 2 follow-up: SECURITY-PARITY CANDIDATE ONLY.
-- DO NOT APPLY directly and DO NOT treat as a registered migration.
-- Chat 1 is sole owner of numbered Drizzle journal + registered schema barrel.
--
-- Existing draft outbound_messages.organization_id and college_id each have
-- independent foreign keys. They prove the IDs exist separately, but allow
-- a college in Organization A to be paired with Organization B in raw SQL.
-- Active queueOutboundDeliveryInTransaction verifies the joined pair during
-- enqueue, but another writer or an organization reassignment can bypass the
-- application's check. A durable outbox must be tenant-consistent in storage.
--
-- Migration integration order:
-- 1. Register colleges(id, organization_id) unique parent target.
-- 2. Fail closed if any existing outbox pair differs from the college's owner.
-- 3. Register the composite child FK without dropping either existing FK.
-- This project is greenfield: do NOT build legacy data migration/backfill.

SELECT m.id AS bad_outbound_id,
       m.organization_id AS declared_organization_id,
       c.organization_id AS college_organization_id
  FROM outbound_messages m
  LEFT JOIN colleges c ON c.id = m.college_id
 WHERE c.id IS NULL
    OR m.organization_id IS DISTINCT FROM c.organization_id;

DO $db10_outbound_scope_preflight$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM outbound_messages m
      LEFT JOIN colleges c ON c.id = m.college_id
     WHERE c.id IS NULL
        OR m.organization_id IS DISTINCT FROM c.organization_id
  ) THEN
    RAISE EXCEPTION 'DB10 outbound organization/college scope mismatch'
      USING ERRCODE = '23514';
  END IF;
END;
$db10_outbound_scope_preflight$;

-- PostgreSQL composite FK targets require a unique index/constraint covering
-- exactly these columns, even though colleges.id is already its UUID PK.
-- Register this parent target through Chat 1's Drizzle/schema workflow.
CREATE UNIQUE INDEX IF NOT EXISTS colleges_id_organization_uq
  ON colleges (id, organization_id);

-- Existing registered migrations may already have installed this FK.
-- Never drop or relax it merely to make the disposable replay succeed.
DO $db10_outbound_scope_constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.outbound_messages'::regclass
       AND conname = 'db10_outbound_college_organization_fk'
  ) THEN
    ALTER TABLE outbound_messages
      ADD CONSTRAINT db10_outbound_college_organization_fk
      FOREIGN KEY (college_id, organization_id)
      REFERENCES colleges (id, organization_id)
      ON UPDATE RESTRICT
      ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.outbound_messages'::regclass
       AND conname = 'db10_outbound_college_organization_fk'
       AND contype = 'f' AND convalidated
  ) THEN
    RAISE EXCEPTION 'DB10 outbound composite scope FK missing or unvalidated'
      USING ERRCODE = '23514';
  END IF;
END;
$db10_outbound_scope_constraint$;

-- Acceptance gates (NOT EXECUTED):
-- A. New outbox row with a valid but WRONG organization UUID fails 23503.
-- B. Valid same-owner pair inserts and remains readable in the same transaction.
-- C. UPDATE on outbox organization_id or college_id cannot forge cross-tenant.
-- D. Reassigning a college's organization while its outbox rows exist fails
--    23503, even after sender/provider acceptance.
-- E. Two-session mismatched enqueue vs college transfer cannot both commit.
-- F. Catalog confirms the FK references colleges(id,organization_id),
--    is validated, and both preexisting per-column foreign keys remain.
-- G. No sender, plaintext PII, provider grant or active app API enabled here.
