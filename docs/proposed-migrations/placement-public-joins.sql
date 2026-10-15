-- PROPOSAL; owner registers migration after email-code and grant writer integration.
CREATE TABLE placement_public_join_links (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 token_hash varchar(64) UNIQUE NOT NULL CHECK (token_hash ~ '^[a-f0-9]{64}$'),
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 company_id uuid,
 company_domain varchar(254),
 scope varchar(12) NOT NULL CHECK (scope IN ('COLLEGE','COMPANY')),
 expires_at timestamptz NOT NULL,
 revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT public_join_company_shape CHECK (
   (scope='COLLEGE' AND company_id IS NULL AND company_domain IS NULL)
   OR (scope='COMPANY' AND company_id IS NOT NULL AND company_domain IS NOT NULL)
 )
);
CREATE INDEX public_join_links_college_idx ON placement_public_join_links(college_id,scope);
CREATE TABLE placement_public_join_challenges (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 link_id uuid NOT NULL REFERENCES placement_public_join_links(id) ON DELETE RESTRICT,
 work_email varchar(254) NOT NULL,
 code_hash varchar(64) NOT NULL CHECK (code_hash ~ '^[a-f0-9]{64}$'),
 attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
 expires_at timestamptz NOT NULL,
 verified_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX public_join_challenges_link_email_idx ON placement_public_join_challenges(link_id,work_email,created_at DESC);
-- After code verification, the backend must recheck verified company/college,
-- persisted recruiter identity, trusted policy and idempotent live membership grants.
