-- [chat-15] Immutable project meeting/resource audit. Physical project meeting
-- deletes are intentionally restricted after the first history event.
-- Native writes are captured by database triggers even if a client bypasses
-- the application service. Actor provenance for edits without an explicit
-- request-scoped database actor remains unattributed, never invented.
CREATE UNIQUE INDEX IF NOT EXISTS project_meetings_project_id_id_uq
 ON project_meetings (project_id,id);
--> statement-breakpoint
CREATE TABLE project_meeting_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 project_id uuid NOT NULL REFERENCES project_instances(id) ON DELETE RESTRICT,
 project_meeting_id uuid,
 meeting_key varchar(120) NOT NULL,
 legacy_history_id bigint,
 legacy_occurred_at_local varchar(40),
 action_type varchar(40) NOT NULL,
 actor_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
 actor_user_type varchar(20),
 actor_name varchar(160),
 before_json jsonb,
 after_json jsonb,
 changed_fields jsonb,
 notes text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 deleted_at timestamptz,
 CONSTRAINT project_meeting_history_project_fk
  FOREIGN KEY (project_id,project_meeting_id) REFERENCES project_meetings(project_id,id) ON DELETE RESTRICT,
 CONSTRAINT project_meeting_history_before_object_ck CHECK (before_json IS NULL OR jsonb_typeof(before_json)='object'),
 CONSTRAINT project_meeting_history_after_object_ck CHECK (after_json IS NULL OR jsonb_typeof(after_json)='object'),
 CONSTRAINT project_meeting_history_changed_array_ck CHECK (changed_fields IS NULL OR jsonb_typeof(changed_fields)='array'),
 CONSTRAINT project_meeting_history_updated_after_created_ck CHECK (updated_at >= created_at),
 CONSTRAINT project_meeting_history_deleted_after_created_ck CHECK (deleted_at IS NULL OR deleted_at >= created_at),
 CONSTRAINT project_meeting_history_action_nonempty_ck CHECK (length(trim(action_type)) > 0)
);
--> statement-breakpoint
CREATE INDEX project_meeting_history_project_time_idx ON project_meeting_history(project_id,created_at);
--> statement-breakpoint
CREATE INDEX project_meeting_history_meeting_idx ON project_meeting_history(project_meeting_id,created_at);
--> statement-breakpoint
CREATE INDEX project_meeting_history_cursor_idx ON project_meeting_history(project_id,created_at DESC,id DESC);
--> statement-breakpoint
CREATE INDEX project_meeting_history_project_key_time_id_idx ON project_meeting_history(project_id,meeting_key,created_at DESC,id DESC);
--> statement-breakpoint
CREATE TABLE project_resource_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 project_id uuid NOT NULL REFERENCES project_instances(id) ON DELETE RESTRICT,
 project_resource_id uuid,
 resource_key varchar(120) NOT NULL,
 legacy_history_id bigint,
 legacy_occurred_at_local varchar(40),
 action_type varchar(40) NOT NULL,
 actor_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
 actor_user_type varchar(20),
 actor_name varchar(160),
 resource_order integer,
 before_json jsonb,
 after_json jsonb,
 changed_fields jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 deleted_at timestamptz,
 CONSTRAINT project_resource_audit_before_object_ck CHECK (before_json IS NULL OR jsonb_typeof(before_json)='object'),
 CONSTRAINT project_resource_audit_after_object_ck CHECK (after_json IS NULL OR jsonb_typeof(after_json)='object'),
 CONSTRAINT project_resource_audit_changed_array_ck CHECK (changed_fields IS NULL OR jsonb_typeof(changed_fields)='array'),
 CONSTRAINT project_resource_audit_updated_after_created_ck CHECK (updated_at >= created_at),
 CONSTRAINT project_resource_audit_deleted_after_created_ck CHECK (deleted_at IS NULL OR deleted_at >= created_at),
 CONSTRAINT project_resource_audit_action_nonempty_ck CHECK (length(trim(action_type)) > 0)
);
--> statement-breakpoint
CREATE INDEX project_resource_audit_project_time_idx ON project_resource_audit(project_id,created_at);
--> statement-breakpoint
CREATE INDEX project_resource_audit_resource_idx ON project_resource_audit(project_resource_id,created_at);
--> statement-breakpoint
CREATE INDEX project_resource_audit_cursor_idx ON project_resource_audit(project_id,created_at DESC,id DESC);
--> statement-breakpoint
CREATE FUNCTION lms_project_meeting_history_capture() RETURNS trigger AS $$
DECLARE
  row_data record;
  before_state jsonb;
  after_state jsonb;
  action_name varchar(40);
  audit_actor uuid;
BEGIN
 IF TG_OP='DELETE' THEN row_data:=OLD; ELSE row_data:=NEW; END IF;
 IF TG_OP='UPDATE' AND to_jsonb(NEW)=to_jsonb(OLD) THEN RETURN NEW; END IF;
 before_state:=NULL;
 after_state:=NULL;
 IF TG_OP<>'INSERT' THEN
  before_state:=jsonb_build_object(
   'status',OLD.status,'title',OLD.title,'meetingType',OLD.meeting_type,
   'startsAt',OLD.starts_at,'endsAt',OLD.ends_at,'timeZone',OLD.time_zone,
   'meetingKey',OLD.meeting_key,'deletedAt',OLD.deleted_at,'version',OLD.version);
 END IF;
 IF TG_OP<>'DELETE' THEN
  after_state:=jsonb_build_object(
   'status',NEW.status,'title',NEW.title,'meetingType',NEW.meeting_type,
   'startsAt',NEW.starts_at,'endsAt',NEW.ends_at,'timeZone',NEW.time_zone,
   'meetingKey',NEW.meeting_key,'deletedAt',NEW.deleted_at,'version',NEW.version);
 END IF;
 action_name:=CASE TG_OP WHEN 'INSERT' THEN 'CREATED'
  WHEN 'DELETE' THEN 'DELETED' ELSE 'UPDATED' END;
 audit_actor:=CASE WHEN TG_OP='INSERT' THEN row_data.created_by_user_id
  ELSE NULLIF(current_setting('lms.actor_user_id',true),'')::uuid END;
 INSERT INTO project_meeting_history(
  project_id,project_meeting_id,meeting_key,action_type,actor_user_id,
  actor_user_type,actor_name,before_json,after_json)
 VALUES(row_data.project_id,row_data.id,
  left(coalesce(row_data.meeting_key,row_data.id::text),120),
  action_name,audit_actor,
  CASE WHEN audit_actor IS NULL THEN 'SYSTEM' ELSE 'USER' END,
  CASE WHEN audit_actor IS NULL THEN 'Unattributed database write' ELSE NULL END,
  before_state,after_state);
 RETURN row_data;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER lms_project_meeting_history_capture_trg
 AFTER INSERT OR UPDATE ON project_meetings
 FOR EACH ROW EXECUTE FUNCTION lms_project_meeting_history_capture();
--> statement-breakpoint
CREATE FUNCTION lms_project_resource_audit_capture() RETURNS trigger AS $$
DECLARE
 row_data record;
 before_state jsonb;
 after_state jsonb;
 audit_actor uuid;
BEGIN
 IF TG_OP='DELETE' THEN row_data:=OLD; ELSE row_data:=NEW; END IF;
 IF TG_OP='UPDATE' AND to_jsonb(NEW)=to_jsonb(OLD) THEN RETURN NEW; END IF;
 before_state:=NULL;
 after_state:=NULL;
 IF TG_OP<>'INSERT' THEN
  before_state:=jsonb_build_object('title',OLD.title,'type',OLD.resource_type,
   'status',OLD.status,'visibility',OLD.visibility,
   'sequence',OLD.sequence,'pinned',OLD.pinned);
 END IF;
 IF TG_OP<>'DELETE' THEN
  after_state:=jsonb_build_object('title',NEW.title,'type',NEW.resource_type,
   'status',NEW.status,'visibility',NEW.visibility,
   'sequence',NEW.sequence,'pinned',NEW.pinned);
 END IF;
 audit_actor:=NULLIF(current_setting('lms.actor_user_id',true),'')::uuid;
 INSERT INTO project_resource_audit(
  project_id,project_resource_id,resource_key,action_type,actor_user_id,
  actor_user_type,actor_name,resource_order,before_json,after_json)
 VALUES(row_data.project_id,row_data.id,
  left(coalesce(row_data.legacy_resource_key,row_data.template_key,row_data.id::text),120),
  CASE TG_OP WHEN 'INSERT' THEN 'CREATED' WHEN 'DELETE' THEN 'DELETED' ELSE 'UPDATED' END,
  audit_actor,CASE WHEN audit_actor IS NULL THEN 'SYSTEM' ELSE 'USER' END,
  CASE WHEN audit_actor IS NULL THEN 'Unattributed database write' ELSE NULL END,
  row_data.sequence,before_state,after_state);
 RETURN row_data;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER lms_project_resource_audit_capture_trg
 AFTER INSERT OR UPDATE OR DELETE ON project_resources
 FOR EACH ROW EXECUTE FUNCTION lms_project_resource_audit_capture();
