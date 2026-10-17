-- TPO-inbox-team-17: legacy Team topics allow 200 characters.
-- Orchestrator registers migration; builders must not edit numbered drizzle files.
ALTER TABLE placement_tpo_internal_threads
 ALTER COLUMN topic TYPE varchar(200);
