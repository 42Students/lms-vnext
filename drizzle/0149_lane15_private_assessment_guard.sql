-- Staff-only assessment URL. Real URL parsing and same-origin auth still required in service.
ALTER TABLE placement_application_private_artifacts ADD CONSTRAINT placement_application_private_assessment_url_ck
 CHECK (assessment_url IS NULL OR (length(assessment_url) <= 2048
   AND assessment_url ~* '^https?://'));
