-- Proposal, not registered migration. Must be applied before selected employer shares can be issued.
-- Existing all-shortlist shares remain unchanged. A share with selected rows is restricted
-- to exactly those application IDs, subject to live shortlist and college predicates.
CREATE TABLE IF NOT EXISTS placement_company_share_selections(
 share_id uuid NOT NULL REFERENCES placement_company_applicant_shares(id) ON DELETE RESTRICT,
 application_id uuid NOT NULL REFERENCES placement_applications(id) ON DELETE RESTRICT,
 PRIMARY KEY(share_id, application_id)
);
CREATE INDEX IF NOT EXISTS pcss_application_idx ON placement_company_share_selections(application_id);
-- Migration registration owner: orchestrator. Requires verified college ownership
-- of every selected application before inserts. No migration of legacy data.
