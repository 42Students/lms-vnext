-- DB-039 / DB10 admin audit actor + request-context fidelity.
-- STAGING ONLY, NOT A DRIZZLE MIGRATION. Chat 1 owns migration registration.
--
-- Legacy runtime oracle:
--   42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
--   V61__admin_audit_log.sql
--   AdminAuditLog.java
--   AdminAuditLogService.java
--
-- Current vNext already maps 10/13 legacy audit columns into activity_events:
-- id, actor_user_id, action_key, entity_type, entity_id, organization_id,
-- college_id, payload_json, created_at, and actor identity via the user FK.
--
-- Three active source semantics are missing from persisted activity events:
-- historical actor role/type, request IP and User-Agent.
--
-- Privacy redesign:
-- * do NOT duplicate legacy actor_contact_mobile in every audit row;
-- * canonical actor contact remains users.phone_e164 via actor_user_id;
-- * request IP/User-Agent are explicit forensic columns, not arbitrary metadata;
-- * ordinary event metadata must stay free of request-header copies.

ALTER TABLE activity_events
  ADD COLUMN actor_role_snapshot varchar(40)[] NULL,
  ADD COLUMN request_ip inet NULL,
  ADD COLUMN user_agent varchar(512) NULL;

ALTER TABLE activity_events
  ADD CONSTRAINT db39_activity_actor_role_snapshot_ck CHECK (
    actor_role_snapshot IS NULL OR (
      cardinality(actor_role_snapshot) BETWEEN 1 AND 16
      AND array_position(actor_role_snapshot, NULL) IS NULL
    )
  ),
  ADD CONSTRAINT db39_activity_user_agent_ck CHECK (
    user_agent IS NULL OR length(btrim(user_agent)) BETWEEN 1 AND 512
  );

COMMENT ON COLUMN activity_events.actor_role_snapshot IS
  'Effective actor roles captured at event write time. Historical snapshot; do not reconstruct from current memberships/roles.';

COMMENT ON COLUMN activity_events.request_ip IS
  'Forensic request IP captured from trusted server/proxy context only. Never accept an arbitrary browser-supplied X-Forwarded-For value.';

COMMENT ON COLUMN activity_events.user_agent IS
  'Forensic request User-Agent capped at 512 characters; privileged support/audit context, not ordinary feed metadata.';

-- Optional query support for later super-admin forensic filters.
CREATE INDEX db39_activity_actor_roles_gin_idx
  ON activity_events USING gin (actor_role_snapshot)
  WHERE actor_role_snapshot IS NOT NULL;

-- Deliberate non-columns / normalized mappings:
-- * legacy actor_contact_mobile -> users.phone_e164 through actor_user_id;
--   no repeated historical phone snapshot is staged because that expands PII.
-- * legacy payload_json -> existing activity_events.metadata.
-- * legacy created_at -> existing activity_events.occurred_at timestamptz.
--
-- API/runtime follow-on must:
-- * derive actor_role_snapshot from authenticated RequestContext on the server;
-- * capture request_ip only from framework/trusted reverse-proxy provenance;
-- * cap user_agent before persistence;
-- * never trust client JSON for any of these three fields;
-- * keep request context out of list responses unless explicitly authorized;
-- * define retention/access policy for request_ip + user_agent before activation.
