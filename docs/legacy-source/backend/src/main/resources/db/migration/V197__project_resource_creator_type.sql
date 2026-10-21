-- Projects audit 2026-10-07, R4-01: learner and faculty ids are separate sequences, so project_resource.created_by
-- alone cannot tell learner #42 from faculty #42, and a learner could edit or delete a resource a faculty member with
-- the same numeric id had added. Record the creator's user type.
ALTER TABLE project_resource ADD COLUMN created_by_type VARCHAR(20) NULL AFTER created_by;

-- Backfill from each resource's first UPSERT audit row by the same actor id (that row is the creation). Rows with no
-- such audit row stay NULL and are never treated as learner-owned; mentors can still manage them.
UPDATE project_resource r
JOIN (
    SELECT a.project_id, a.resource_key, a.actor_user_id, a.actor_user_type
    FROM project_resource_audit a
    JOIN (
        SELECT project_id, resource_key, MIN(id) AS first_id
        FROM project_resource_audit
        WHERE action_type = 'UPSERT'
        GROUP BY project_id, resource_key
    ) f ON f.first_id = a.id
) c ON c.project_id = r.project_id AND c.resource_key = r.resource_key AND c.actor_user_id = r.created_by
SET r.created_by_type = UPPER(c.actor_user_type)
WHERE r.created_by_type IS NULL AND c.actor_user_type IS NOT NULL;

-- R4-03: the same ambiguity on meetings. A learner withdraws their own pending request only when the meeting records a
-- LEARNER creator with their id. Backfill from each meeting's first history row by the creator.
ALTER TABLE project_meeting ADD COLUMN created_by_type VARCHAR(20) NULL AFTER created_by;

UPDATE project_meeting m
JOIN (
    SELECT h.project_meeting_id, h.actor_user_id, h.actor_user_type
    FROM project_meeting_history h
    JOIN (
        SELECT project_meeting_id, MIN(id) AS first_id
        FROM project_meeting_history
        WHERE project_meeting_id IS NOT NULL
        GROUP BY project_meeting_id
    ) f ON f.first_id = h.id
) c ON c.project_meeting_id = m.id AND c.actor_user_id = m.created_by
SET m.created_by_type = UPPER(c.actor_user_type)
WHERE m.created_by_type IS NULL AND c.actor_user_type IS NOT NULL;
