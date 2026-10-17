-- Proposed only. Orchestrator registers as the next numbered migration.
-- Public content is an opt-in college-owned section; no identity or raw offers.
CREATE TABLE IF NOT EXISTS placement_public_page_content (
 college_id uuid PRIMARY KEY REFERENCES colleges(id) ON DELETE RESTRICT,
 about text NOT NULL DEFAULT '',
 metric_keys jsonb NOT NULL DEFAULT '["PLACED","OFFERS","HIRING_COMPANIES"]'::jsonb,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT placement_public_about_length CHECK(char_length(about)<=4000),
 CONSTRAINT placement_public_metric_array CHECK(jsonb_typeof(metric_keys)='array')
);
