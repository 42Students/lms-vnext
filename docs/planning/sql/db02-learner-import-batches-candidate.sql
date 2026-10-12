-- DB004/DB005 learner import lineage candidate.
-- NOT REGISTERED / NOT EXECUTED. This intentionally provides NO bulk-delete
-- or cascade path; current legacy production disables generic bulk undo.

CREATE UNIQUE INDEX IF NOT EXISTS college_memberships_id_college_uq
  ON college_memberships(id,college_id);

CREATE TABLE learner_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT learner_import_batches_id_college_uq UNIQUE (id,college_id)
);

CREATE TABLE learner_import_batch_members (
  batch_id uuid NOT NULL,
  college_id uuid NOT NULL,
  membership_id uuid NOT NULL,
  linked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (batch_id,membership_id),
  CONSTRAINT learner_import_batch_members_batch_fk
    FOREIGN KEY (batch_id,college_id)
    REFERENCES learner_import_batches(id,college_id)
    ON DELETE RESTRICT,
  CONSTRAINT learner_import_batch_members_membership_fk
    FOREIGN KEY (membership_id,college_id)
    REFERENCES college_memberships(id,college_id)
    ON DELETE RESTRICT,
  CONSTRAINT learner_import_batch_member_once_uq UNIQUE (membership_id)
);

-- Required acceptance:
-- 1) cross-college member/batch link is rejected;
-- 2) one membership cannot be retroactively claimed by multiple imports;
-- 3) deleting a batch or member link with live lineage is RESTRICTed;
-- 4) list batches can derive successful-account count from member rows;
-- 5) no endpoint/migration implements generic "delete every account in batch".
