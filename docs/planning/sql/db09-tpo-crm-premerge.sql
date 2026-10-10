-- DB09-A CRM PRE-MERGE / UNREGISTERED migration draft.
-- Apply ONLY to an explicitly isolated PostgreSQL test database after
-- the current vNext baseline is provisioned. This SQL is NOT in the
-- Drizzle journal. Merge migration numbering is owned by the DB03 coordinator.
-- PostgreSQL triggers below must be checked separately from Drizzle snapshot.

CREATE TABLE placement_tpo_leads (
  id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  company_relationship_id uuid REFERENCES placement_company_relationships(id) ON DELETE RESTRICT,
  name varchar(150) NOT NULL,
  designation varchar(100),
  email_norm varchar(150),
  phone_norm varchar(20),
  company_name varchar(150),
  company_logo_object_path text,
  owner_membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT,
  manual_stage varchar(15) NOT NULL DEFAULT 'NEW',
  not_now_reason varchar(255),
  not_now_until date,
  source varchar(30),
  invite_token_hash varchar(128),
  invite_sent_at timestamptz,
  invite_clicked_at timestamptz,
  invite_reminder_sent_at timestamptz,
  invite_bounced_at timestamptz,
  unsubscribed_at timestamptz,
  recruiter_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_tpo_leads_stage_ck
    CHECK (manual_stage IN ('NEW', 'CONTACTED', 'NOT_NOW')),
  CONSTRAINT placement_tpo_leads_contact_ck
    CHECK (email_norm IS NOT NULL OR phone_norm IS NOT NULL),
  CONSTRAINT placement_tpo_leads_name_ck
    CHECK (length(trim(name)) > 0),
  CONSTRAINT placement_tpo_leads_email_lower_ck
    CHECK (email_norm IS NULL OR email_norm = lower(email_norm)),
  CONSTRAINT placement_tpo_leads_phone_digits_ck
    CHECK (phone_norm IS NULL OR phone_norm ~ '^[0-9]{7,20}
CREATE UNIQUE INDEX placement_tpo_leads_college_id_id_uq
  ON placement_tpo_leads(college_id, id);
CREATE UNIQUE INDEX placement_tpo_leads_college_email_uq
  ON placement_tpo_leads(college_id, email_norm) WHERE email_norm IS NOT NULL;
CREATE UNIQUE INDEX placement_tpo_leads_college_phone_uq
  ON placement_tpo_leads(college_id, phone_norm) WHERE phone_norm IS NOT NULL;
CREATE UNIQUE INDEX placement_tpo_leads_invite_hash_uq
  ON placement_tpo_leads(invite_token_hash) WHERE invite_token_hash IS NOT NULL;
CREATE INDEX placement_tpo_leads_college_stage_updated_idx
  ON placement_tpo_leads(college_id, manual_stage, updated_at);
CREATE INDEX placement_tpo_leads_owner_idx
  ON placement_tpo_leads(owner_membership_id, updated_at);

CREATE TABLE placement_tpo_lead_activities (
  id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  lead_id uuid NOT NULL,
  type varchar(20) NOT NULL,
  outcome varchar(30),
  note varchar(2000),
  is_system boolean NOT NULL DEFAULT false,
  created_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_tpo_lead_activities_scoped_fk
    FOREIGN KEY (college_id, lead_id)
    REFERENCES placement_tpo_leads(college_id, id) ON DELETE RESTRICT,
  CONSTRAINT placement_tpo_lead_activities_type_ck
    CHECK (type IN ('CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'NOTE', 'SYSTEM')),
  CONSTRAINT placement_tpo_lead_activities_system_ck
    CHECK ((type = 'SYSTEM') = is_system)
);
CREATE INDEX placement_tpo_lead_activities_lead_time_idx
  ON placement_tpo_lead_activities(college_id, lead_id, created_at);

CREATE TABLE placement_tpo_followups (
  id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  lead_id uuid NOT NULL,
  due_at timestamptz NOT NULL,
  owner_membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT,
  note varchar(500),
  done_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_tpo_followups_scoped_fk
    FOREIGN KEY (college_id, lead_id)
    REFERENCES placement_tpo_leads(college_id, id) ON DELETE RESTRICT
);
CREATE INDEX placement_tpo_followups_college_due_idx
  ON placement_tpo_followups(college_id, done_at, due_at);
CREATE INDEX placement_tpo_followups_lead_idx
  ON placement_tpo_followups(college_id, lead_id);

-- These guards close otherwise possible direct-SQL cross-tenant
-- references through single-column owner/company foreign keys.
CREATE FUNCTION db09_assert_lead_scoped_links() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.owner_membership_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM college_memberships
     WHERE id = NEW.owner_membership_id AND college_id = NEW.college_id
  ) THEN
    RAISE EXCEPTION 'lead owner membership belongs to another college'
      USING ERRCODE = '23514';
  END IF;
  IF NEW.company_relationship_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM placement_company_relationships
     WHERE id = NEW.company_relationship_id AND college_id = NEW.college_id
  ) THEN
    RAISE EXCEPTION 'lead company relationship belongs to another college'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db09_lead_scoped_links_guard
  BEFORE INSERT OR UPDATE OF college_id, owner_membership_id, company_relationship_id
  ON placement_tpo_leads
  FOR EACH ROW EXECUTE FUNCTION db09_assert_lead_scoped_links();

CREATE FUNCTION db09_assert_followup_owner_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.owner_membership_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM college_memberships
     WHERE id = NEW.owner_membership_id AND college_id = NEW.college_id
  ) THEN
    RAISE EXCEPTION 'follow-up owner belongs to another college'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db09_followup_owner_scope_guard
  BEFORE INSERT OR UPDATE OF college_id, owner_membership_id
  ON placement_tpo_followups
  FOR EACH ROW EXECUTE FUNCTION db09_assert_followup_owner_scope();

-- Activity history is append-only. Stronger DB role grants and outbox
-- integration remain a release gate; trigger alone is not an audit system.
CREATE FUNCTION db09_reject_lead_activity_rewrite() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'lead activity history is append-only'
    USING ERRCODE = '23514';
END $$;
CREATE TRIGGER db09_lead_activity_immutable
  BEFORE UPDATE OR DELETE ON placement_tpo_lead_activities
  FOR EACH ROW EXECUTE FUNCTION db09_reject_lead_activity_rewrite();
),
  CONSTRAINT placement_tpo_leads_invite_hash_ck
    CHECK (invite_token_hash IS NULL OR invite_token_hash ~ '^[a-f0-9]{64}
CREATE UNIQUE INDEX placement_tpo_leads_college_id_id_uq
  ON placement_tpo_leads(college_id, id);
CREATE UNIQUE INDEX placement_tpo_leads_college_email_uq
  ON placement_tpo_leads(college_id, email_norm) WHERE email_norm IS NOT NULL;
CREATE UNIQUE INDEX placement_tpo_leads_college_phone_uq
  ON placement_tpo_leads(college_id, phone_norm) WHERE phone_norm IS NOT NULL;
CREATE UNIQUE INDEX placement_tpo_leads_invite_hash_uq
  ON placement_tpo_leads(invite_token_hash) WHERE invite_token_hash IS NOT NULL;
CREATE INDEX placement_tpo_leads_college_stage_updated_idx
  ON placement_tpo_leads(college_id, manual_stage, updated_at);
CREATE INDEX placement_tpo_leads_owner_idx
  ON placement_tpo_leads(owner_membership_id, updated_at);

CREATE TABLE placement_tpo_lead_activities (
  id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  lead_id uuid NOT NULL,
  type varchar(20) NOT NULL,
  outcome varchar(30),
  note varchar(2000),
  is_system boolean NOT NULL DEFAULT false,
  created_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_tpo_lead_activities_scoped_fk
    FOREIGN KEY (college_id, lead_id)
    REFERENCES placement_tpo_leads(college_id, id) ON DELETE RESTRICT,
  CONSTRAINT placement_tpo_lead_activities_type_ck
    CHECK (type IN ('CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'NOTE', 'SYSTEM')),
  CONSTRAINT placement_tpo_lead_activities_system_ck
    CHECK ((type = 'SYSTEM') = is_system)
);
CREATE INDEX placement_tpo_lead_activities_lead_time_idx
  ON placement_tpo_lead_activities(college_id, lead_id, created_at);

CREATE TABLE placement_tpo_followups (
  id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  lead_id uuid NOT NULL,
  due_at timestamptz NOT NULL,
  owner_membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT,
  note varchar(500),
  done_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_tpo_followups_scoped_fk
    FOREIGN KEY (college_id, lead_id)
    REFERENCES placement_tpo_leads(college_id, id) ON DELETE RESTRICT
);
CREATE INDEX placement_tpo_followups_college_due_idx
  ON placement_tpo_followups(college_id, done_at, due_at);
CREATE INDEX placement_tpo_followups_lead_idx
  ON placement_tpo_followups(college_id, lead_id);

-- These guards close otherwise possible direct-SQL cross-tenant
-- references through single-column owner/company foreign keys.
CREATE FUNCTION db09_assert_lead_scoped_links() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.owner_membership_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM college_memberships
     WHERE id = NEW.owner_membership_id AND college_id = NEW.college_id
  ) THEN
    RAISE EXCEPTION 'lead owner membership belongs to another college'
      USING ERRCODE = '23514';
  END IF;
  IF NEW.company_relationship_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM placement_company_relationships
     WHERE id = NEW.company_relationship_id AND college_id = NEW.college_id
  ) THEN
    RAISE EXCEPTION 'lead company relationship belongs to another college'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db09_lead_scoped_links_guard
  BEFORE INSERT OR UPDATE OF college_id, owner_membership_id, company_relationship_id
  ON placement_tpo_leads
  FOR EACH ROW EXECUTE FUNCTION db09_assert_lead_scoped_links();

CREATE FUNCTION db09_assert_followup_owner_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.owner_membership_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM college_memberships
     WHERE id = NEW.owner_membership_id AND college_id = NEW.college_id
  ) THEN
    RAISE EXCEPTION 'follow-up owner belongs to another college'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db09_followup_owner_scope_guard
  BEFORE INSERT OR UPDATE OF college_id, owner_membership_id
  ON placement_tpo_followups
  FOR EACH ROW EXECUTE FUNCTION db09_assert_followup_owner_scope();

-- Activity history is append-only. Stronger DB role grants and outbox
-- integration remain a release gate; trigger alone is not an audit system.
CREATE FUNCTION db09_reject_lead_activity_rewrite() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'lead activity history is append-only'
    USING ERRCODE = '23514';
END $$;
CREATE TRIGGER db09_lead_activity_immutable
  BEFORE UPDATE OR DELETE ON placement_tpo_lead_activities
  FOR EACH ROW EXECUTE FUNCTION db09_reject_lead_activity_rewrite();
)
);
CREATE UNIQUE INDEX placement_tpo_leads_college_id_id_uq
  ON placement_tpo_leads(college_id, id);
CREATE UNIQUE INDEX placement_tpo_leads_college_email_uq
  ON placement_tpo_leads(college_id, email_norm) WHERE email_norm IS NOT NULL;
CREATE UNIQUE INDEX placement_tpo_leads_college_phone_uq
  ON placement_tpo_leads(college_id, phone_norm) WHERE phone_norm IS NOT NULL;
CREATE UNIQUE INDEX placement_tpo_leads_invite_hash_uq
  ON placement_tpo_leads(invite_token_hash) WHERE invite_token_hash IS NOT NULL;
CREATE INDEX placement_tpo_leads_college_stage_updated_idx
  ON placement_tpo_leads(college_id, manual_stage, updated_at);
CREATE INDEX placement_tpo_leads_owner_idx
  ON placement_tpo_leads(owner_membership_id, updated_at);

CREATE TABLE placement_tpo_lead_activities (
  id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  lead_id uuid NOT NULL,
  type varchar(20) NOT NULL,
  outcome varchar(30),
  note varchar(2000),
  is_system boolean NOT NULL DEFAULT false,
  created_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_tpo_lead_activities_scoped_fk
    FOREIGN KEY (college_id, lead_id)
    REFERENCES placement_tpo_leads(college_id, id) ON DELETE RESTRICT,
  CONSTRAINT placement_tpo_lead_activities_type_ck
    CHECK (type IN ('CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'NOTE', 'SYSTEM')),
  CONSTRAINT placement_tpo_lead_activities_system_ck
    CHECK ((type = 'SYSTEM') = is_system)
);
CREATE INDEX placement_tpo_lead_activities_lead_time_idx
  ON placement_tpo_lead_activities(college_id, lead_id, created_at);

CREATE TABLE placement_tpo_followups (
  id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  lead_id uuid NOT NULL,
  due_at timestamptz NOT NULL,
  owner_membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT,
  note varchar(500),
  done_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_tpo_followups_scoped_fk
    FOREIGN KEY (college_id, lead_id)
    REFERENCES placement_tpo_leads(college_id, id) ON DELETE RESTRICT
);
CREATE INDEX placement_tpo_followups_college_due_idx
  ON placement_tpo_followups(college_id, done_at, due_at);
CREATE INDEX placement_tpo_followups_lead_idx
  ON placement_tpo_followups(college_id, lead_id);

-- These guards close otherwise possible direct-SQL cross-tenant
-- references through single-column owner/company foreign keys.
CREATE FUNCTION db09_assert_lead_scoped_links() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.owner_membership_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM college_memberships
     WHERE id = NEW.owner_membership_id AND college_id = NEW.college_id
  ) THEN
    RAISE EXCEPTION 'lead owner membership belongs to another college'
      USING ERRCODE = '23514';
  END IF;
  IF NEW.company_relationship_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM placement_company_relationships
     WHERE id = NEW.company_relationship_id AND college_id = NEW.college_id
  ) THEN
    RAISE EXCEPTION 'lead company relationship belongs to another college'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db09_lead_scoped_links_guard
  BEFORE INSERT OR UPDATE OF college_id, owner_membership_id, company_relationship_id
  ON placement_tpo_leads
  FOR EACH ROW EXECUTE FUNCTION db09_assert_lead_scoped_links();

CREATE FUNCTION db09_assert_followup_owner_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.owner_membership_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM college_memberships
     WHERE id = NEW.owner_membership_id AND college_id = NEW.college_id
  ) THEN
    RAISE EXCEPTION 'follow-up owner belongs to another college'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db09_followup_owner_scope_guard
  BEFORE INSERT OR UPDATE OF college_id, owner_membership_id
  ON placement_tpo_followups
  FOR EACH ROW EXECUTE FUNCTION db09_assert_followup_owner_scope();

-- Activity history is append-only. Stronger DB role grants and outbox
-- integration remain a release gate; trigger alone is not an audit system.
CREATE FUNCTION db09_reject_lead_activity_rewrite() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'lead activity history is append-only'
    USING ERRCODE = '23514';
END $$;
CREATE TRIGGER db09_lead_activity_immutable
  BEFORE UPDATE OR DELETE ON placement_tpo_lead_activities
  FOR EACH ROW EXECUTE FUNCTION db09_reject_lead_activity_rewrite();


-- A manual CRM activity must be attributed to an ACTIVE user membership in
-- the same college as the lead. SYSTEM activity is explicitly unattributed.
CREATE FUNCTION db09_assert_activity_actor_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_system THEN
    IF NEW.created_by_user_id IS NOT NULL THEN
      RAISE EXCEPTION 'system lead activity must not forge a user actor'
        USING ERRCODE = '23514';
    END IF;
  ELSE
    IF NEW.created_by_user_id IS NULL OR NOT EXISTS (
      SELECT 1
        FROM college_memberships m
       WHERE m.user_id = NEW.created_by_user_id
         AND m.college_id = NEW.college_id
         AND m.status = 'ACTIVE'
    ) THEN
      RAISE EXCEPTION 'lead activity actor is not active in the lead college'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db09_lead_activity_actor_scope_guard
  BEFORE INSERT ON placement_tpo_lead_activities
  FOR EACH ROW EXECUTE FUNCTION db09_assert_activity_actor_scope();
