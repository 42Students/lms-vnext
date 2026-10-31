-- DB014 event-retention invariant. A prior activity event is an audit fact;
-- changing its tenant, actor, subject, or idempotency key after notifications
-- reference it must not reclassify someone else's notification/history.
-- Legitimate delivery/status updates to metadata remain supported.
CREATE FUNCTION db14_activity_event_identity_immutable()
RETURNS trigger LANGUAGE plpgsql AS $db14_event_identity$
BEGIN
  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.college_id IS DISTINCT FROM OLD.college_id
     OR NEW.actor_user_id IS DISTINCT FROM OLD.actor_user_id
     OR NEW.actor_membership_id IS DISTINCT FROM OLD.actor_membership_id
     OR NEW.module IS DISTINCT FROM OLD.module
     OR NEW.event_type IS DISTINCT FROM OLD.event_type
     OR NEW.subject_type IS DISTINCT FROM OLD.subject_type
     OR NEW.subject_id IS DISTINCT FROM OLD.subject_id
     OR NEW.dedupe_key IS DISTINCT FROM OLD.dedupe_key
     OR NEW.occurred_at IS DISTINCT FROM OLD.occurred_at
     OR NEW.actor_role_snapshot IS DISTINCT FROM OLD.actor_role_snapshot
     OR NEW.actor_name_snapshot IS DISTINCT FROM OLD.actor_name_snapshot THEN
    RAISE EXCEPTION 'DB014 activity event identity and tenant scope are immutable'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$db14_event_identity$;
--> statement-breakpoint
CREATE TRIGGER db14_activity_event_identity_immutable_guard
BEFORE UPDATE OF organization_id,college_id,actor_user_id,actor_membership_id,
  module,event_type,subject_type,subject_id,dedupe_key,occurred_at,
  actor_role_snapshot,actor_name_snapshot
ON activity_events
FOR EACH ROW EXECUTE FUNCTION db14_activity_event_identity_immutable();
