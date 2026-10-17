-- SA-placements-projects-26. Orchestrator to register; do not place directly under drizzle/.
ALTER TABLE placement_companies ADD COLUMN IF NOT EXISTS industry varchar(160);
ALTER TABLE placement_companies ADD COLUMN IF NOT EXISTS about text;
ALTER TABLE placement_companies ADD COLUMN IF NOT EXISTS logo_public_url text;
