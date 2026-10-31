-- DB014 forward-only direct SQL audit actor-grant integrity.
-- The registered 0318 tenant check cannot prove that an actor claiming an
-- elevated audit role actually holds that role. Lock the persisted grant.
CREATE FUNCTION db14_group_history_actor_grant_guard()
RETURNS trigger LANGUAGE plpgsql AS $db14_group_actor_grant$
DECLARE group_college uuid;
DECLARE owner_kind text;
BEGIN
  SELECT college_id,owner_scope INTO group_college,owner_kind
  FROM lms_groups WHERE id=NEW.group_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'DB014 group event parent missing' USING ERRCODE='23503';
  END IF;
  IF NEW.actor_type='SYSTEM' THEN
    IF NEW.actor_user_id IS NOT NULL THEN
      RAISE EXCEPTION 'DB014 SYSTEM actor must not claim a user' USING ERRCODE='23514';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.actor_user_id IS NULL THEN
    RAISE EXCEPTION 'DB014 group actor identity required' USING ERRCODE='23514';
  END IF;
  IF NEW.actor_type='SUPER_ADMIN' THEN
    PERFORM 1 FROM users u JOIN system_roles sr ON sr.user_id=u.id
    WHERE u.id=NEW.actor_user_id AND u.platform_status::text='ACTIVE'
      AND sr.role::text='SUPER_ADMIN' FOR SHARE OF u,sr;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'DB014 SUPER_ADMIN actor grant missing' USING ERRCODE='23514';
    END IF;
  ELSIF NEW.actor_type IN ('COLLEGE_ADMIN','FACULTY','LEARNER') THEN
    PERFORM 1 FROM users u
      JOIN college_memberships cm ON cm.user_id=u.id
      JOIN membership_roles mr ON mr.membership_id=cm.id
    WHERE u.id=NEW.actor_user_id AND u.platform_status::text='ACTIVE'
      AND cm.status::text='ACTIVE' AND mr.role::text=NEW.actor_type
      AND (owner_kind<>'COLLEGE' OR cm.college_id=group_college)
    FOR SHARE OF u,cm,mr;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'DB014 group actor role not granted' USING ERRCODE='23514';
    END IF;
  ELSE
    RAISE EXCEPTION 'DB014 group actor type invalid' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$db14_group_actor_grant$;
--> statement-breakpoint
CREATE TRIGGER db14_group_history_actor_grant_guard
BEFORE INSERT OR UPDATE OF group_id,actor_type,actor_user_id
ON lms_group_member_events
FOR EACH ROW EXECUTE FUNCTION db14_group_history_actor_grant_guard();
