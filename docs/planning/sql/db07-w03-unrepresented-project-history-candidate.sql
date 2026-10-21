-- W03 DB07 DRAFT ONLY — NOT registered in drizzle/meta/_journal.json.
-- W01 must allocate migration number, reconcile Drizzle snapshots, replay and
-- run tenant isolation/direct-SQL negative tests. Legacy data is NOT migrated.
-- The original source has 4 unrepresented tables in the DB07 field census.
-- Some vNext columns intentionally normalize id/name and soft delete shape.

-- Same-project composite FK prerequisites for all referenced child rows.
CREATE UNIQUE INDEX IF NOT EXISTS w03_projects_meetings_project_id_id_uq
  ON project_meetings(project_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS w03_projects_resources_project_id_id_uq
  ON project_resources(project_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS w03_projects_submissions_project_id_id_uq
  ON project_submissions(project_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS w03_projects_tasks_project_id_id_uq
  ON project_tasks(project_id,id);

CREATE TABLE project_meeting_history(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES project_instances(id) ON DELETE RESTRICT,
  project_meeting_id uuid,
  meeting_key varchar(120) NOT NULL,
  action_type varchar(40) NOT NULL CHECK(length(trim(action_type))>0),
  actor_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  actor_user_type varchar(20),actor_name varchar(160),
  before_json jsonb,after_json jsonb,changed_fields jsonb,notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_meeting_history_project_fk
    FOREIGN KEY (project_id,project_meeting_id)
    REFERENCES project_meetings(project_id,id) ON DELETE RESTRICT
);
CREATE INDEX project_meeting_history_project_time_idx ON project_meeting_history(project_id,created_at);
CREATE INDEX project_meeting_history_meeting_idx ON project_meeting_history(project_meeting_id,created_at);
-- Meeting edit-history pagination by project + stable source meeting key.
CREATE INDEX project_meeting_history_project_key_time_id_idx
  ON project_meeting_history(project_id, meeting_key, created_at DESC, id DESC);

CREATE TABLE project_resource_audit(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES project_instances(id) ON DELETE RESTRICT,
  project_resource_id uuid,
  resource_key varchar(120) NOT NULL,
  action_type varchar(40) NOT NULL CHECK(length(trim(action_type))>0),
  actor_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  actor_user_type varchar(20),actor_name varchar(160),
  resource_order integer,before_json jsonb,after_json jsonb,changed_fields jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_resource_audit_project_fk
    FOREIGN KEY(project_id,project_resource_id)
    REFERENCES project_resources(project_id,id) ON DELETE RESTRICT
);
CREATE INDEX project_resource_audit_project_time_idx ON project_resource_audit(project_id,created_at);
CREATE INDEX project_resource_audit_resource_idx ON project_resource_audit(project_resource_id,created_at);

CREATE TABLE project_delivery_events(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES project_instances(id) ON DELETE RESTRICT,
  delivery_id uuid NOT NULL,
  action varchar(60),status varchar(60),
  actor_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  actor_name varchar(160),actor_type varchar(20),
  notes text,attachment_url text,feedback text,revision_count integer
    CHECK(revision_count IS NULL OR revision_count>=0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_delivery_events_project_fk
    FOREIGN KEY(project_id,delivery_id)
    REFERENCES project_submissions(project_id,id) ON DELETE RESTRICT
);
CREATE INDEX project_delivery_events_project_time_idx ON project_delivery_events(project_id,created_at);
CREATE INDEX project_delivery_events_delivery_idx ON project_delivery_events(delivery_id,created_at);

CREATE TABLE project_task_comments(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES project_instances(id) ON DELETE RESTRICT,
  project_task_id uuid NOT NULL,
  commenter_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  commenter_type varchar(20),commenter_name varchar(160),
  message text CHECK(message IS NULL OR length(trim(message))>0),
  progress_value integer CHECK(progress_value IS NULL OR progress_value BETWEEN 0 AND 100),
  comment_type varchar(30) NOT NULL CHECK(length(trim(comment_type))>0),
  task_status_snapshot varchar(30),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT project_task_comments_project_fk
    FOREIGN KEY(project_id,project_task_id)
    REFERENCES project_tasks(project_id,id) ON DELETE RESTRICT
);
CREATE INDEX project_task_comments_task_time_idx ON project_task_comments(project_task_id,created_at);
CREATE INDEX project_task_comments_project_idx ON project_task_comments(project_id,created_at);

-- Immutable histories: project meeting / resource / delivery event history
-- is append-only; any correction writes a new event rather than rewriting it.
CREATE FUNCTION w03_reject_project_history_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
 RAISE EXCEPTION 'project audit history is append only' USING ERRCODE='23514';
END $$;
CREATE TRIGGER w03_meeting_history_immutable BEFORE UPDATE OR DELETE
  ON project_meeting_history FOR EACH ROW EXECUTE FUNCTION w03_reject_project_history_mutation();
CREATE TRIGGER w03_resource_history_immutable BEFORE UPDATE OR DELETE
  ON project_resource_audit FOR EACH ROW EXECUTE FUNCTION w03_reject_project_history_mutation();
CREATE TRIGGER w03_delivery_history_immutable BEFORE UPDATE OR DELETE
  ON project_delivery_events FOR EACH ROW EXECUTE FUNCTION w03_reject_project_history_mutation();

-- PostgreSQL TRUNCATE never invokes row-level DELETE triggers. Protect these
-- append-only audit trails against whole-table erasure as well.
CREATE TRIGGER w03_meeting_history_no_truncate BEFORE TRUNCATE
  ON project_meeting_history FOR EACH STATEMENT EXECUTE FUNCTION w03_reject_project_history_mutation();
CREATE TRIGGER w03_resource_history_no_truncate BEFORE TRUNCATE
  ON project_resource_audit FOR EACH STATEMENT EXECUTE FUNCTION w03_reject_project_history_mutation();
CREATE TRIGGER w03_delivery_history_no_truncate BEFORE TRUNCATE
  ON project_delivery_events FOR EACH STATEMENT EXECUTE FUNCTION w03_reject_project_history_mutation();

-- Legacy project_task_comment.is_deleted is intentionally normalized to
-- deleted_at. Physical DELETE/TRUNCATE would bypass that recoverable state.
CREATE FUNCTION w03_reject_project_comment_erasure() RETURNS trigger
LANGUAGE plpgsql AS $w03_comments_guard$
BEGIN
  RAISE EXCEPTION 'project task comments must use soft deletion' USING ERRCODE='23514';
END $w03_comments_guard$;
CREATE TRIGGER w03_task_comments_no_delete BEFORE DELETE
  ON project_task_comments FOR EACH ROW EXECUTE FUNCTION w03_reject_project_comment_erasure();
CREATE TRIGGER w03_task_comments_no_truncate BEFORE TRUNCATE
  ON project_task_comments FOR EACH STATEMENT EXECUTE FUNCTION w03_reject_project_comment_erasure();

-- Editing a comment must not silently move it to another project/task or
-- change the immutable author/creation identity. Message/progress editing and
-- setting deleted_at remain available to the future API implementation.
CREATE FUNCTION w03_guard_project_comment_identity() RETURNS trigger
LANGUAGE plpgsql AS $w03_comments_guard$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.project_id IS DISTINCT FROM OLD.project_id
     OR NEW.project_task_id IS DISTINCT FROM OLD.project_task_id
     OR NEW.commenter_user_id IS DISTINCT FROM OLD.commenter_user_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'project task comment identity is immutable' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $w03_comments_guard$;
CREATE TRIGGER w03_task_comments_identity_immutable BEFORE UPDATE
  ON project_task_comments FOR EACH ROW EXECUTE FUNCTION w03_guard_project_comment_identity();

ALTER TABLE project_task_comments
  ADD CONSTRAINT w03_task_comments_updated_after_created_ck CHECK(updated_at >= created_at),
  ADD CONSTRAINT w03_task_comments_deleted_after_created_ck CHECK(deleted_at IS NULL OR deleted_at >= created_at);

-- W03 consumer still needs transactionally written history/audits, tenant
-- permission projection, private resource URL redaction, and project task
-- comment API/UI parity. Treat all as OPEN, NOT IMPLEMENTED.
-- TRUNCATE, hard-delete, immutable-identity and chronology constraints above
-- are staged source definitions only; no PostgreSQL execution is claimed.
