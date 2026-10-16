-- [chat-11] COL-projects-02 / COL-projects-11 / COL-projects-10
-- PROPOSAL ONLY. Orchestrator must register this as the next numbered migration.
-- Do NOT execute or register from this builder lane.
ALTER TABLE project_instances
  ADD COLUMN progress_percent smallint NOT NULL DEFAULT 0,
  ADD COLUMN phase varchar(120),
  ADD COLUMN due_label varchar(160),
  ADD COLUMN course_label varchar(160),
  ADD COLUMN section_id uuid REFERENCES sections(id) ON DELETE RESTRICT,
  ADD COLUMN blocker text,
  ADD COLUMN next_action text,
  ADD COLUMN start_date date,
  ADD COLUMN end_date date,
  ADD COLUMN sprint_length_weeks integer,
  ADD COLUMN estimation_unit varchar(32) DEFAULT 'POINTS';
ALTER TABLE project_instances
  ADD CONSTRAINT project_instances_progress_percent_ck CHECK (progress_percent BETWEEN 0 AND 100),
  ADD CONSTRAINT project_instances_sprint_length_weeks_ck
    CHECK (sprint_length_weeks IS NULL OR sprint_length_weeks BETWEEN 1 AND 104),
  ADD CONSTRAINT project_instances_dates_ck
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
  ADD CONSTRAINT project_instances_estimation_unit_ck
    CHECK (estimation_unit IS NULL OR estimation_unit IN ('POINTS','HOURS','TASKS'));
CREATE INDEX project_instances_section_idx ON project_instances(section_id) WHERE section_id IS NOT NULL;
-- Section tenant check is required in the service transaction:
-- sections -> cohorts -> programs -> college_id MUST equal project_instances.college_id.
-- No state can be considered persisted until this proposal is registered.
