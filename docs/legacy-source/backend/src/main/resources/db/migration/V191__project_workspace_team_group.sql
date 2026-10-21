-- Project teams on groups (docs/groups/PROJECT-TEAMS.md). A workspace may point at a PROJECT_TEAM group
-- that is the source of truth for its learners; project_member learner rows are mirrored from it in the
-- same transaction (ProjectTeamMirror). NULL = a workspace without a team group, which behaves as before.
ALTER TABLE project_workspace
    ADD COLUMN team_group_id BIGINT NULL AFTER template_id,
    ADD INDEX idx_project_workspace_team_group (team_group_id),
    ADD CONSTRAINT fk_project_workspace_team_group FOREIGN KEY (team_group_id) REFERENCES lms_group (id);
