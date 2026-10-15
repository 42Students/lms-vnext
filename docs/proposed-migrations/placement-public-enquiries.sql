-- PROPOSED ONLY. Register via owner-approved migration after delivery integration.
CREATE TABLE placement_public_enquiry_challenges (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 work_email varchar(254) NOT NULL,
 code_hash varchar(64) NOT NULL CHECK (code_hash ~ '^[a-f0-9]{64}$'),
 attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
 expires_at timestamptz NOT NULL,
 verified_at timestamptz,
 requested_at timestamptz NOT NULL DEFAULT now(),
 CHECK (expires_at > requested_at)
);
CREATE INDEX public_enquiry_challenges_email_idx ON placement_public_enquiry_challenges(college_id,work_email,requested_at DESC);
CREATE TABLE placement_public_recruit_enquiries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 challenge_id uuid NOT NULL UNIQUE REFERENCES placement_public_enquiry_challenges(id) ON DELETE RESTRICT,
 full_name varchar(120) NOT NULL,
 company_name varchar(160) NOT NULL,
 message text NOT NULL CHECK (char_length(message) BETWEEN 10 AND 1500),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX public_enquiry_college_created_idx ON placement_public_recruit_enquiries(college_id,created_at DESC);
-- Enquiry creation must atomically verify unexpired challenge (<=5 attempts),
-- ensure matching college + work email, and audit the authenticated delivery intent.
