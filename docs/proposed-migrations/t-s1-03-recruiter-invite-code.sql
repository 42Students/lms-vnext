-- T-S1-03: STAGED ONLY. Orchestrator must register a numbered migration,
-- the journal/schema barrel, disposable PG replay and provider hookup.
-- This is a hashed challenge table, NOT a credential storage table.
CREATE TABLE recruiter_invite_code (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 lead_id uuid NOT NULL REFERENCES placement_tpo_leads(id) ON DELETE RESTRICT,
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 token_hash varchar(64) NOT NULL CHECK(token_hash~'^[0-9a-f]{64}$'),
 code_hash varchar(64) NOT NULL CHECK(code_hash~'^[0-9a-f]{64}$'),
 sent_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL CHECK(expires_at>sent_at AND
    expires_at<=sent_at+interval '10 minutes'),
 failed_attempts integer NOT NULL DEFAULT 0 CHECK(failed_attempts BETWEEN 0 AND 5),
 consumed_at timestamptz,
 delivery_state varchar(16) NOT NULL DEFAULT 'PENDING'
   CHECK(delivery_state IN ('PENDING','SENT','FAILED')),
 CONSTRAINT recruiter_invite_code_time_ck CHECK(consumed_at IS NULL OR consumed_at>=sent_at),
 CONSTRAINT recruiter_invite_code_scoped_fk FOREIGN KEY(college_id,lead_id)
   REFERENCES placement_tpo_leads(college_id,id) ON DELETE RESTRICT
);
CREATE INDEX recruiter_invite_code_lead_sent_idx
 ON recruiter_invite_code(lead_id,sent_at DESC);
CREATE INDEX recruiter_invite_code_college_sent_idx
 ON recruiter_invite_code(college_id,sent_at DESC);
CREATE INDEX recruiter_invite_code_token_active_idx
 ON recruiter_invite_code(token_hash,sent_at DESC);
-- Do not enable OTP send/verify routes without verified delivery provider,
-- atomic per-link/per-college issuance lock, and existing-auth identity bridge.
