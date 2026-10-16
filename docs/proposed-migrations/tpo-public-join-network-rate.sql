-- STAGED proposal for TPO-campaigns-public-19 (NOT REGISTERED).
-- It is not safe to provide public OTP send-code without durable per-network
-- throttling; existing placement_public_join_challenges alone cannot enforce it.
CREATE TABLE placement_public_join_rate_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES placement_public_join_links(id) ON DELETE RESTRICT,
  ip_hash varchar(64) NOT NULL CHECK (ip_hash ~ '^[a-f0-9]{64}$'),
  action varchar(12) NOT NULL CHECK (action IN ('SEND_CODE', 'JOIN')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX public_join_rate_network_time_idx
  ON placement_public_join_rate_events(ip_hash, action, created_at DESC);
CREATE INDEX public_join_rate_link_time_idx
  ON placement_public_join_rate_events(link_id, created_at DESC);
-- Ingress MUST canonicalize the client IP into a verified trusted header,
-- stripping all externally supplied values before this endpoint is activated.
-- Do not put plaintext addresses or IPs into this table.
