-- MEN-projects-meetings-34 and MEN-projects-meetings-35
-- Await orchestrator registration; do not run manually.
ALTER TABLE project_sprints ADD COLUMN IF NOT EXISTS goal text;
ALTER TABLE project_sprints ADD COLUMN IF NOT EXISTS definition_of_done text;
ALTER TABLE project_sprints ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE project_sprints ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE project_sprints ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE project_sprints ADD CONSTRAINT project_sprints_dates_ck
  CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date);
-- Changing dates after ACTIVE must be denied by the service, not by UI alone.
