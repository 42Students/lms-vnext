-- MEN-projects-meetings-44 / MEN-projects-meetings-45
-- PROPOSAL ONLY. Orchestrator owns numbering and registration.
-- The legacy Approach field is distinct from Description and Done when.
-- UI/API must not offer a separate editable Approach until this is registered.
ALTER TABLE "project_tasks"
  ADD COLUMN "approach" text;
ALTER TABLE "project_tasks"
  ADD CONSTRAINT "project_tasks_approach_length_ck"
  CHECK ("approach" IS NULL OR length("approach") <= 4000);
