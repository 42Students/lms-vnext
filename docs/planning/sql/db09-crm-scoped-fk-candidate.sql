-- DB-012 / Chat 3: scoped FK draft only. NOT REGISTERED OR EXECUTED.
-- Requires existing college_memberships, placement_company_relationships,
-- placement_tpo_leads, and placement_tpo_followups Drizzle SQL tables.
-- No numbered migration, snapshot, schema barrel, CI or production DB edits.
-- Chat 1 integrates after reviewing equivalent Drizzle definitions and
-- executes acceptance on disposable PostgreSQL with tenant A / B fixtures.

-- Parent primary-key id alone cannot establish child.college_id matches
-- the college owning a referenced owner membership / company relationship.
-- An ordinary FK(child.owner_membership_id -> college_memberships.id)
-- permits a valid membership ID belonging to another college.
ALTER TABLE college_memberships
  ADD CONSTRAINT db09_college_memberships_scope_uq
  UNIQUE (college_id, id);

ALTER TABLE placement_company_relationships
  ADD CONSTRAINT db09_company_relationships_scope_uq
  UNIQUE (college_id, id);

ALTER TABLE placement_tpo_leads
  ADD CONSTRAINT db09_leads_company_scope_fk
    FOREIGN KEY (college_id, company_relationship_id)
    REFERENCES placement_company_relationships(college_id, id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT db09_leads_owner_scope_fk
    FOREIGN KEY (college_id, owner_membership_id)
    REFERENCES college_memberships(college_id, id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE placement_tpo_followups
  ADD CONSTRAINT db09_followups_owner_scope_fk
    FOREIGN KEY (college_id, owner_membership_id)
    REFERENCES college_memberships(college_id, id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

-- Acceptance matrix before claiming VERIFIED:
--  A) Lead college=A, companyRelationship college=B -> FOREIGN KEY failure.
--  B) Lead college=A, ownerMembership college=B -> FOREIGN KEY failure.
--  C) Followup college=A, ownerMembership college=B -> FOREIGN KEY failure.
--  D) Lead college=A, foreign but valid recruiter_user_id -> examine
--     role/grant coupling separately; user_id FK alone is not an ACL.
--  E) All tenant A correctly owned optional refs -> insert succeeds.
--  F) NULL optional company/owner refs remain valid (MATCH SIMPLE).
--  G) Concurrent owner/relationship moves and deletes cannot break rows.
--  H) Compare Drizzle migration registration before applying; if a
--     shared parent key was already introduced by another worker,
--     deduplicate rather than blindly replay this draft.
--  I) These FKs cannot enforce membership ACTIVE, company ACTIVE,
--     consent, recruiter grants, or private disclosure permissions.
--     Application reads/writes and audit permissions still need witnesses.
