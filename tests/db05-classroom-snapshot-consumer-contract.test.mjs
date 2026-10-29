import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const service = read("src/modules/courses/discussion-service.ts");
const schema = read("src/db/schema/discussions.ts");
const migration = read("drizzle/0307_db05_progress_and_classroom_history_integrity.sql");
const integration = read("tests/integration/learner-course-discussion-actions.test.ts");

test("DB05 trusted sender snapshot is used by timeline, first pin and delta feed", () => {
  assert.equal((service.match(/senderName:\s*immutableDiscussionSenderName,/g) ?? []).length, 4,
    "Timeline, pin, delta and content-scoped readers must use persisted sender attribution");
  assert.doesNotMatch(service, /senderName:\s*users\.displayName/);
  assert.match(service, /nullif\(\$\{courseDiscussionMessages\.senderNameSnapshot\}, ''\)/);
  assert.match(service, /\$\{users\.displayName\}/);
  assert.match(schema, /senderNameSnapshot: varchar\("sender_name_snapshot"/);
});

test("DB05 database persists a trusted name and rejects later sender spoofing", () => {
  assert.match(service, /senderNameSnapshot:senderName/);
  assert.match(migration, /NEW\.sender_name_snapshot := left\(trusted_display_name, 160\)/);
  assert.match(migration, /NEW\.sender_name_snapshot IS DISTINCT FROM OLD\.sender_name_snapshot/);
  assert.match(migration, /classroom sender attribution is immutable/);
  assert.match(integration, /preserves send-time attribution through profile renames/);
  assert.match(integration, /UPDATE course_discussion_messages SET sender_name_snapshot/);
  assert.match(integration, /code: "23514"/);
});
