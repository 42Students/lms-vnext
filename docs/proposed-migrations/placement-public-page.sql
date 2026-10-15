-- PROPOSED ONLY: owner must allocate/register the next migration.
-- Never display these counters unless explicitly enabled and population >= 5.
CREATE TABLE IF NOT EXISTS placement_public_page_settings (
 college_id uuid PRIMARY KEY REFERENCES colleges(id) ON DELETE RESTRICT,
 enabled boolean NOT NULL DEFAULT false,
 placed_count integer,
 offer_count integer,
 employer_count integer,
 population_count integer,
 published_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT placement_public_stats_nonnegative CHECK (
   (placed_count IS NULL OR placed_count >= 0) AND
   (offer_count IS NULL OR offer_count >= 0) AND
   (employer_count IS NULL OR employer_count >= 0) AND
   (population_count IS NULL OR population_count >= 0)
 ),
 CONSTRAINT placement_public_population_guard CHECK (
   placed_count IS NULL OR population_count IS NULL OR placed_count <= population_count
 )
);
-- Publication API must verify authenticated TPO college permissions, enforce
-- minimum-five k-anonymity and audited provenance before enabling this table.
