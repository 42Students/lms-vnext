-- DB-012 / CHAT 3 — staged SQL ONLY, not a registered migration.
-- Proven source gap: src/db/schema/tpo-crm.ts uses separate FK constraints
-- for leads.college_id, company_relationship_id and owner_membership_id.
-- A direct SQL write can pair two individually valid IDs from different
-- colleges unless the pair is checked. Existing application-side college
-- queries do not establish this direct-DB invariant.
-- In a greenfield disposable PostgreSQL fixture, these constraints must
-- reject cross-college lead and followup rows.
-- Do not apply this draft without a Drizzle diff, replay and migration
-- approval from single-writer Chat 1.

-- Composite target uniqueness (not inferred from unique(id) alone by PG).
ALTER TABLE placement_company_relationships
  ADD CONSTRAINT placement_company_relationships_id_college_uq
  UNIQUE (id, college_id);

ALTER TABLE college_memberships
  ADD CONSTRAINT college_memberships_id_college_uq
  UNIQUE (id, college_id);

-- The parent's college is invariant, not an independently asserted value.
ALTER TABLE placement_tpo_leads
  ADD CONSTRAINT placement_tpo_leads_company_same_college_fk
  FOREIGN KEY (company_relationship_id, college_id)
  REFERENCES placement_company_relationships(id, college_id)
  ON DELETE RESTRICT;

ALTER TABLE placement_tpo_leads
  ADD CONSTRAINT placement_tpo_leads_owner_same_college_fk
  FOREIGN KEY (owner_membership_id, college_id)
  REFERENCES college_memberships(id, college_id)
  ON DELETE RESTRICT;

ALTER TABLE placement_tpo_followups
  ADD CONSTRAINT placement_tpo_followups_owner_same_college_fk
  FOREIGN KEY (owner_membership_id, college_id)
  REFERENCES college_memberships(id, college_id)
  ON DELETE RESTRICT;

-- Negative fixture required:
-- A/lead college A + B/company relationship => SQLSTATE 23503;
-- A/lead college A + B/owner membership => SQLSTATE 23503;
-- A/followup + B/owner => SQLSTATE 23503;
-- Correctly scoped, NULL optional references and activity scoped-FK work;
-- role/active-state must still be enforced by the transactional service.
-- Idempotent rollout, lock impact, composite index sizing and existing row
-- compatibility must be checked by Chat 1 before integration.
-- No PostgreSQL tests were run in the authoring step.
