-- STAGED PROPOSAL ONLY. Do not run through application code.
-- Register/verify through the owner's migration process.
CREATE TABLE IF NOT EXISTS placement_tpo_job_types (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), college_id uuid NOT NULL REFERENCES colleges(id),
 label varchar(100) NOT NULL, active boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT placement_tpo_job_types_label_ck CHECK (length(btrim(label))>0),
 UNIQUE (college_id,label)
);
CREATE TABLE IF NOT EXISTS placement_tpo_blocked_dates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),college_id uuid NOT NULL REFERENCES colleges(id),
 day date NOT NULL,reason text NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT placement_tpo_blocked_dates_reason_ck CHECK (length(btrim(reason))>0),
 UNIQUE (college_id,day)
);
CREATE TABLE IF NOT EXISTS placement_tpo_prep_readiness (
 college_id uuid PRIMARY KEY REFERENCES colleges(id), config jsonb NOT NULL DEFAULT '{}'::jsonb,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT placement_tpo_prep_readiness_object_ck CHECK (jsonb_typeof(config)='object')
);
CREATE TABLE IF NOT EXISTS placement_tpo_after_college (
 learner_membership_id uuid PRIMARY KEY REFERENCES college_memberships(id),
 college_id uuid NOT NULL REFERENCES colleges(id),
 outcome varchar(40) NOT NULL CHECK (outcome IN
 ('PLACED','HIGHER_STUDIES','ENTREPRENEURSHIP','GOVERNMENT_EXAMS','OTHER')),
 updated_at timestamptz NOT NULL DEFAULT now()
);
-- Registration review must add cross-table tenant-membership invariant and RLS / service scope checks.
-- Application routes must check to_regclass before accessing these tables.
