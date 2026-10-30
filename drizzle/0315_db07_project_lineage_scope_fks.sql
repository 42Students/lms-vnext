-- DB-073 / DB-074 / DB-075: registered same-project ancestry constraints.
-- Forward-only, additive, fail-closed; no parent key or data rewrite.
-- Serialize all related writers for the mismatch preflight and FK installation.
LOCK TABLE project_releases,project_sprints,project_tasks,project_task_submissions,project_submissions,project_submission_reviews,project_evaluations,project_meetings IN SHARE ROW EXCLUSIVE MODE;
--> statement-breakpoint
DO $db07_lineage_preflight$
BEGIN
 IF EXISTS (SELECT 1 FROM project_sprints s JOIN project_releases r ON r.id=s.release_id WHERE s.project_id<>r.project_id)
 OR EXISTS (SELECT 1 FROM project_tasks t JOIN project_sprints s ON s.id=t.sprint_id WHERE t.project_id<>s.project_id)
 OR EXISTS (SELECT 1 FROM project_task_submissions sub JOIN project_tasks t ON t.id=sub.task_id WHERE sub.project_id<>t.project_id)
 OR EXISTS (SELECT 1 FROM project_submission_reviews r JOIN project_submissions s ON s.id=r.submission_id WHERE r.project_id<>s.project_id)
 OR EXISTS (SELECT 1 FROM project_evaluations e JOIN project_submissions s ON s.id=e.submission_id WHERE e.project_id<>s.project_id)
 OR EXISTS (SELECT 1 FROM project_meetings m JOIN project_sprints s ON s.id=m.linked_sprint_id WHERE m.project_id<>s.project_id)
 OR EXISTS (SELECT 1 FROM project_meetings m JOIN project_tasks t ON t.id=m.linked_task_id WHERE m.project_id<>t.project_id)
 OR EXISTS (SELECT 1 FROM project_meetings m JOIN project_tasks t ON t.id=m.linked_task_id WHERE m.linked_sprint_id IS NOT NULL AND m.linked_sprint_id<>t.sprint_id)
 THEN
  RAISE EXCEPTION 'DB073/074/075 existing cross-project lineage violation; migration refused' USING ERRCODE='23514';
 END IF;
END $db07_lineage_preflight$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS project_releases_project_id_id_uq ON project_releases(project_id,id);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS project_sprints_project_id_id_uq ON project_sprints(project_id,id);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS project_tasks_project_id_id_uq ON project_tasks(project_id,id);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS project_tasks_sprint_id_id_uq ON project_tasks(sprint_id,id);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS project_submissions_project_id_id_uq ON project_submissions(project_id,id);
--> statement-breakpoint
ALTER TABLE project_sprints ADD CONSTRAINT project_sprints_project_release_fk FOREIGN KEY (project_id,release_id) REFERENCES project_releases(project_id,id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE project_tasks ADD CONSTRAINT project_tasks_project_sprint_fk FOREIGN KEY (project_id,sprint_id) REFERENCES project_sprints(project_id,id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE project_task_submissions ADD CONSTRAINT project_task_submissions_project_task_fk FOREIGN KEY (project_id,task_id) REFERENCES project_tasks(project_id,id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE project_submission_reviews ADD CONSTRAINT project_submission_reviews_project_submission_fk FOREIGN KEY (project_id,submission_id) REFERENCES project_submissions(project_id,id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE project_evaluations ADD CONSTRAINT project_evaluations_project_submission_fk FOREIGN KEY (project_id,submission_id) REFERENCES project_submissions(project_id,id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE project_meetings ADD CONSTRAINT project_meetings_project_sprint_fk FOREIGN KEY (project_id,linked_sprint_id) REFERENCES project_sprints(project_id,id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE project_meetings ADD CONSTRAINT project_meetings_project_task_fk FOREIGN KEY (project_id,linked_task_id) REFERENCES project_tasks(project_id,id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE project_meetings ADD CONSTRAINT project_meetings_linked_sprint_task_fk FOREIGN KEY (linked_sprint_id,linked_task_id) REFERENCES project_tasks(sprint_id,id) ON DELETE RESTRICT;
