-- Proposed follow-up for TPO-companies-01, TPO-settings-audit-55, TPO-campaigns-public-21.
-- NOT REGISTERED: orchestrator owns numbered migrations, journal and schema barrel.
-- Existing placement_public_join_links stores only scope/domain/expiry/revocation.
-- Explicit state and counters are necessary to match legacy link lifecycle.
ALTER TABLE placement_public_join_links
  ADD COLUMN enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN post_without_approval boolean NOT NULL DEFAULT false,
  ADD COLUMN opens_count integer NOT NULL DEFAULT 0 CHECK (opens_count >= 0),
  ADD COLUMN joins_count integer NOT NULL DEFAULT 0 CHECK (joins_count >= 0);
-- For legacy no-expiry links, remove the mandatory expiry after migration replay and
-- policy approval. New code temporarily chooses year 9999, not an expired link.
-- Counters must advance via explicit same-origin or public beacon POST for opens
-- (GET stays read-only), and the verified join transaction for joins.
-- This is NOT acceptance proof for any of those missing flows.
