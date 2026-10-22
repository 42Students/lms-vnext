-- Staff-only assessment URL. Real URL parsing and same-origin auth still required in service.
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_application_private_artifacts ADD CONSTRAINT placement_application_private_assessment_url_ck
 CHECK (assessment_url IS NULL OR (length(assessment_url) <= 2048
   AND assessment_url ~* '^https?://'))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
