-- [chat-14] Historical AUTO screening result snapshot, separate from current manual
-- placement_application_screenings and its decision/actor policy.
CREATE TABLE placement_application_legacy_auto_screening (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 application_id uuid NOT NULL REFERENCES placement_applications(id) ON DELETE RESTRICT,
 legacy_screening_id bigint NOT NULL,
 legacy_application_id bigint,
 score double precision,
 method varchar(64),
 source_version bigint,
 legacy_status varchar(64),
 skills_json jsonb,
 exclusions_json jsonb,
 metadata_json jsonb,
 original_created_at timestamptz,
 original_updated_at timestamptz,
 imported_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT placement_legacy_screening_application_source_uq
  UNIQUE(application_id,legacy_screening_id),
 CONSTRAINT placement_legacy_screening_score_ck
  CHECK(score IS NULL OR (score BETWEEN 0 AND 100 AND score <> 'NaN'::float8))
);
--> statement-breakpoint
CREATE INDEX placement_legacy_screening_application_idx
 ON placement_application_legacy_auto_screening(application_id,original_updated_at);
