import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const schema = readFileSync("src/db/schema/db10-general-notices.draft.ts", "utf8");
const sql = readFileSync("scripts/sql/db10-general-notices-staging.sql", "utf8");
const spec = readFileSync("docs/planning/database-parity-db10-general-notices-contract.md", "utf8");

test("DB24 exists only as a staged candidate; no CI or DB passing evidence is invented", () => {
  assert.match(schema, /DRAFT ONLY/);
  assert.match(sql, /STAGING ONLY, NOT REGISTERED/);
  assert.match(spec, /STAGED_UNREGISTERED \/ DB_NOT_RUN/);
  for (let i=1;i<=12;i++) {
    assert.ok(spec.includes("DB24-"+String(i).padStart(2,"0")));
  }
});
test("DB24 reconciles all 13 legacy notification_outbox fields explicitly", () => {
  for (const field of [
    "id","event","recipient_type","recipient_id","channel","payload_json",
    "send_after","status","undo_group_id","claimed_at","sent_at",
    "failure_reason","created_at",
  ]) {
    assert.ok(new RegExp("^\\\\|\\\\s*" + field + "\\\\s*\\\\|", "m").test(spec),
      "Missing legacy field table row "+field);
  }
  for (const field of [
    "organization_id","college_id","source_event_id","recipient_user_id",
    "recipient_membership_id","safe_payload_json","send_after","status",
    "undo_group_id","hold_for_undo","digest_local_date","digest_timezone",
    "claim_fence","idempotency_key",
  ]) {
    assert.ok(sql.includes(field), "Missing staged SQL field "+field);
  }
  assert.match(schema, /export const db10GeneralNotices = pgTable/);
});
test("DB24 distinguishes delayed APP visibility from external provider handoff", () => {
  assert.match(sql, /channel IN \('APP','EMAIL','SMS'\)/);
  assert.match(sql, /status IN \('PENDING','CLAIMED','HANDED_OFF','SENT','CANCELLED','FAILED'\)/);
  assert.match(sql, /status <> 'HANDED_OFF' OR channel IN \('EMAIL','SMS'\)/);
  assert.match(sql, /status = 'SENT' AND sent_at IS NOT NULL/);
  assert.match(spec, /in_app_notifications/);
  assert.match(spec, /HANDOFF is distinct from delivery/);
});
test("DB24 cannot bypass the 30-second undo hold or cross-college membership check", () => {
  assert.match(sql, /interval '30 seconds'/);
  assert.match(sql, /NOT hold_for_undo OR/);
  assert.match(sql, /NOTIFICATION_COLLEGE_SCOPE_INVALID/);
  assert.match(sql, /NOTIFICATION_MEMBERSHIP_SCOPE_INVALID/);
  assert.match(sql, /NOTIFICATION_SOURCE_EVENT_SCOPE_INVALID/);
  assert.match(sql, /JOIN membership_roles mr ON mr\.membership_id = m\.id/);
  assert.match(sql, /mr\.role::text = NEW\.recipient_type/);
  assert.match(sql, /NOTIFICATION_RECRUITER_GRANT_GUARD_NOT_REGISTERED/);
  assert.match(sql, /m.user_id = NEW.recipient_user_id/);
  assert.match(sql, /m.college_id = NEW.college_id\s+AND m.status = 'ACTIVE'/);
  assert.match(sql, /FOR EACH ROW EXECUTE FUNCTION db10_general_notice_scope_guard/);
});
test("DB24 digest scheduling, claim shape, fence, idempotency are staged", () => {
  for(const name of [
    "db10_general_notices_digest_ck","db10_general_notices_claim_ck",
    "db10_general_notices_fence_ck","db10_general_notices_undo_ck",
    "db10_general_notices_sent_ck","db10_general_notices_idempotency_uq",
    "db10_general_notices_source_recipient_channel_uq",
    "db10_general_notices_due_idx","db10_general_notices_undo_idx",
  ]){
    assert.ok(sql.includes(name),"Missing SQL "+name);
    assert.ok(schema.includes(name),"Missing schema "+name);
  }
  assert.match(sql, /digest_timezone = 'Asia\/Kolkata'/);
  assert.match(sql, /idempotency_key ~ '\^\[0-9a-f\]\{64\}\$'/);
  assert.match(spec, /08:00 Asia\/Kolkata/);
});
test("DB24 does not overwrite the recruiter encrypted outbound stage", () => {
  assert.doesNotMatch(sql, /CREATE TABLE outbound_messages\s*\(/);
  assert.doesNotMatch(schema, /export const db10OutboundMessages/);
  assert.match(spec, /outbound_messages/);
  assert.doesNotMatch(sql, /^\s*(?:TRUNCATE|DROP TABLE|DELETE FROM)\b/im);
});


test("DB24 source event, idempotency and claim audit hardening stay aligned", () => {
  assert.match(sql, /source_event_id uuid NOT NULL REFERENCES activity_events\(id\) ON DELETE RESTRICT/);
  assert.match(schema, /sourceEventId: uuid\("source_event_id"\)\.notNull\(\)[\s\S]*activityEvents\.id/);
  assert.match(spec, /HMAC input MUST include `sourceEventId`/);
  assert.match(sql, /\(source_event_id,recipient_user_id,recipient_type,channel\)/);
  assert.match(schema, /\.on\(t\.sourceEventId, t\.recipientUserId, t\.recipientType, t\.channel\)/);
  assert.doesNotMatch(sql, /\(source_event_id,recipient_user_id,channel\)/);
  assert.doesNotMatch(schema, /\.on\(t\.sourceEventId, t\.recipientUserId, t\.channel\)/);
  assert.match(sql, /safe_failure_reason varchar\(500\)/);
  assert.match(schema, /safeFailureReason: varchar\("safe_failure_reason", \{ length: 500 \}\)/);
  assert.match(sql, /status <> 'CLAIMED' AND claimed_by IS NULL\s+AND claim_expires_at IS NULL/);
  assert.doesNotMatch(sql, /status <> 'CLAIMED' AND claimed_by IS NULL\s+AND claimed_at IS NULL/);
  assert.match(spec, /V193 explicitly rewrites stored `recipient_type='HR'` to `RECRUITER`/);
});

test("DB24 dual-role fanout preserves same-role deduplication and requires DB witness", () => {
  assert.match(
    sql,
    /CREATE UNIQUE INDEX db10_general_notices_source_recipient_channel_uq\s+ON general_notification_outbox \(source_event_id,recipient_user_id,recipient_type,channel\)/,
  );
  assert.match(
    schema,
    /uniqueIndex\("db10_general_notices_source_recipient_channel_uq"\)\s+\.on\(t\.sourceEventId, t\.recipientUserId, t\.recipientType, t\.channel\)/,
  );
  assert.match(sql, /CREATE UNIQUE INDEX db10_general_notices_idempotency_uq\s+ON general_notification_outbox \(idempotency_key\)/);
  assert.match(spec, /\*\*DB24-13:\*\*/);
  assert.match(spec, /DB24-13:[\s\S]*?NOT_RUN/);
  // Source guards cannot substitute for two direct PostgreSQL INSERTs against
  // distinct valid LEARNER and FACULTY memberships, followed by duplicate writes.
});

test("DB24 authorization witness rows remain locked during enqueue", () => {
  assert.match(
    sql,
    /JOIN membership_roles mr ON mr\.membership_id = m\.id[\s\S]*?mr\.role::text = NEW\.recipient_type[\s\S]*?FOR SHARE OF m, mr;/,
    "both membership status and matching role must be protected from concurrent updates",
  );
  assert.doesNotMatch(
    sql,
    /mr\.role::text = NEW\.recipient_type\s+FOR SHARE OF m;/,
    "membership-only lock does not protect role-row revocation",
  );
  assert.match(spec, /DB24-14/);
  // PostgreSQL race proof still requires two actual transactions.
});
