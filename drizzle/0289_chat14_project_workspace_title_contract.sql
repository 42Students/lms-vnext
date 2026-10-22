-- [chat-14] G2-7-020-103: legacy create workspace title bound.
-- Do not truncate or rewrite historical imported titles without review.
-- NOT VALID protects new writes while preserving existing out-of-range rows
-- for a separately audited migration reconciliation and later VALIDATE.
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE project_instances
  ADD CONSTRAINT project_instances_title_length_ck
  CHECK (char_length(btrim(title)) BETWEEN 1 AND 160) NOT VALID$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
