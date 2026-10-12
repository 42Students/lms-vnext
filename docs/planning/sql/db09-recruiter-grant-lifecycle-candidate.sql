-- DB004/DB012 recruiter grant lifecycle peer candidate.
-- NOT REGISTERED. NOT EXECUTED. W01 owns migration integration.

-- Registered vNext already owns recruiter profile, company relationship and
-- grant identity. Add only live source semantics not represented today.
ALTER TABLE placement_recruiter_college_grants
  ADD COLUMN IF NOT EXISTS valid_until timestamptz,
  ADD COLUMN IF NOT EXISTS granted_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS revoke_reason text,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grant_source varchar(24) NOT NULL DEFAULT 'TPO',
  ADD COLUMN IF NOT EXISTS verification varchar(24) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS hiring_company_id uuid
    REFERENCES placement_companies(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS agency_client_name_snapshot varchar(150);

ALTER TABLE placement_recruiter_college_grants
  DROP CONSTRAINT IF EXISTS placement_recruiter_college_grants_status_ck,
  DROP CONSTRAINT IF EXISTS placement_recruiter_college_grants_lifecycle_ck;

ALTER TABLE placement_recruiter_college_grants
  ADD CONSTRAINT placement_recruiter_college_grants_status_ck
    CHECK (status IN ('ACTIVE','PENDING_RECRUITER','REVOKED')),
  ADD CONSTRAINT placement_recruiter_college_grants_lifecycle_ck
    CHECK (
      (status IN ('ACTIVE','PENDING_RECRUITER')
        AND revoked_by_user_id IS NULL AND revoked_at IS NULL)
      OR
      (status='REVOKED' AND revoked_at IS NOT NULL)
    ),
  ADD CONSTRAINT placement_recruiter_college_grants_valid_until_ck
    CHECK (valid_until IS NULL OR valid_until > granted_at),
  ADD CONSTRAINT placement_recruiter_college_grants_version_ck
    CHECK (version >= 0),
  ADD CONSTRAINT placement_recruiter_college_grants_source_ck
    CHECK (grant_source IN ('SUPER_ADMIN','TPO','INVITE_ACCEPTANCE')),
  ADD CONSTRAINT placement_recruiter_college_grants_verification_ck
    CHECK (verification IN ('VERIFIED_DOMAIN','TPO_APPROVED','PENDING')),
  ADD CONSTRAINT placement_recruiter_college_grants_revoke_reason_ck
    CHECK (revoke_reason IS NULL OR length(trim(revoke_reason)) BETWEEN 1 AND 500),
  ADD CONSTRAINT placement_recruiter_college_grants_agency_name_ck
    CHECK (
      agency_client_name_snapshot IS NULL
      OR length(trim(agency_client_name_snapshot)) BETWEEN 1 AND 150
    );

-- ACTIVE uniqueness must also prevent two pending rows for the same recruiter
-- and college/company relationship while acceptance is unresolved.
DROP INDEX IF EXISTS placement_recruiter_college_grants_active_uq;
CREATE UNIQUE INDEX placement_recruiter_college_grants_live_uq
  ON placement_recruiter_college_grants
    (recruiter_user_id, company_relationship_id)
  WHERE status IN ('ACTIVE','PENDING_RECRUITER');

CREATE TABLE placement_recruiter_grant_capabilities (
  grant_id uuid NOT NULL
    REFERENCES placement_recruiter_college_grants(id) ON DELETE RESTRICT,
  capability varchar(64) NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (grant_id, capability),
  CONSTRAINT placement_recruiter_grant_capability_ck
    CHECK (capability IN ('COLLEGE_OVERVIEW','DRIVE_REQUEST','DRIVE_WORK'))
);

CREATE TABLE placement_recruiter_grant_invitation_links (
  grant_id uuid PRIMARY KEY
    REFERENCES placement_recruiter_college_grants(id) ON DELETE RESTRICT,
  lead_id uuid NOT NULL
    REFERENCES placement_tpo_leads(id) ON DELETE RESTRICT,
  linked_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  declined_at timestamptz,
  CONSTRAINT placement_recruiter_grant_invite_terminal_ck
    CHECK (NOT (accepted_at IS NOT NULL AND declined_at IS NOT NULL))
);
CREATE UNIQUE INDEX placement_recruiter_grant_invitation_lead_uq
  ON placement_recruiter_grant_invitation_links(lead_id);

CREATE TABLE placement_recruiter_grant_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id uuid NOT NULL
    REFERENCES placement_recruiter_college_grants(id) ON DELETE RESTRICT,
  prior_status varchar(24),
  next_status varchar(24) NOT NULL,
  prior_version integer NOT NULL,
  next_version integer NOT NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  actor_role_snapshot varchar(64),
  event_type varchar(32) NOT NULL,
  reason text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_recruiter_grant_event_status_ck
    CHECK (
      (prior_status IS NULL OR prior_status IN ('ACTIVE','PENDING_RECRUITER','REVOKED'))
      AND next_status IN ('ACTIVE','PENDING_RECRUITER','REVOKED')
    ),
  CONSTRAINT placement_recruiter_grant_event_version_ck
    CHECK (prior_version >= 0 AND next_version = prior_version + 1),
  CONSTRAINT placement_recruiter_grant_event_type_ck
    CHECK (event_type IN ('GRANTED','INVITED','ACCEPTED','DECLINED','EXTENDED','REVOKED','REACTIVATED','CAPABILITIES_CHANGED'))
);
CREATE INDEX placement_recruiter_grant_events_grant_time_idx
  ON placement_recruiter_grant_events(grant_id, occurred_at);

-- Source-current request semantics require expired grants to be unusable.
-- API/context hydration must apply:
-- status='ACTIVE' AND (valid_until IS NULL OR valid_until > now())
-- and require the requested capability row for protected features.
--
-- Required PostgreSQL witnesses:
-- * expired ACTIVE grant not returned as usable
-- * PENDING_RECRUITER grant cannot authorize college data
-- * duplicate ACTIVE/PENDING grant rejected under concurrency
-- * unknown capability rejected
-- * revoke/extend CAS on version rejects stale writer
-- * wrong-company recruiter relationship rejected by existing DB09 company guard
-- * pending invitation link cannot point to another grant/lead lifecycle
-- * revoked history/event rows remain immutable
-- * verification=PENDING never auto-approves a drive
