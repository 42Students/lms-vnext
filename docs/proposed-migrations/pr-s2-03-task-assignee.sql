-- PR-S2-03 STAGED ONLY. Registration is owned by the orchestrator.
-- Run on disposable PostgreSQL after reviewing nullable historical tasks.
ALTER TABLE project_tasks
  ADD COLUMN assignee_membership_id uuid
  REFERENCES college_memberships(id) ON DELETE RESTRICT;
CREATE INDEX project_tasks_assignee_membership_idx
  ON project_tasks (assignee_membership_id)
  WHERE assignee_membership_id IS NOT NULL;
-- Before promotion: decide whether unassigned tasks remain valid, backfill if
-- needed, then add a scoped invariant for (project_id, assignee_membership_id)
-- pointing only to an active LEARNER project member. The membership FK alone
-- does not prove project membership; enforce that in task submission service.
