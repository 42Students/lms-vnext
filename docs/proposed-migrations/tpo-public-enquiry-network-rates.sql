-- TPO-campaigns-public-31. STAGED ONLY; orchestrator registers migrations.
CREATE TABLE placement_public_enquiry_rate_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 ip_hash varchar(64) NOT NULL CHECK (ip_hash ~ '^[a-f0-9]{64}$'),
 action varchar(12) NOT NULL CHECK (action IN ('SEND_CODE','RECRUIT')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX public_enquiry_rate_ip_action_idx
 ON placement_public_enquiry_rate_events(ip_hash,action,created_at DESC);
-- Trusted ingress must strip spoofed x-public-verified-client-ip headers.
