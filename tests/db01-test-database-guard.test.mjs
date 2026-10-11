import assert from "node:assert/strict";
import test from "node:test";
import { assertSafeDb01TestTarget } from "../scripts/db01-test-database-guard.mjs";

const local = "postgresql://test_user:secret@127.0.0.1:5432/lms_vnext_test";
test("DB01 guard refuses missing TEST_DATABASE_URL", () => {
  assert.throws(() => assertSafeDb01TestTarget({ DATABASE_URL: local }), /TEST_DATABASE_URL must be explicitly set/);
});
test("DB01 guard allows a local isolated test target", () => {
  assert.deepEqual(assertSafeDb01TestTarget({ TEST_DATABASE_URL: local }),
    {host:"127.0.0.1",database:"lms_vnext_test",mode:"local"});
});
test("DB01 guard refuses a production database name", () => {
  assert.throws(() => assertSafeDb01TestTarget({ TEST_DATABASE_URL:"postgres://x:x@127.0.0.1/lms_production" }),
    /not explicitly a test database/);
});
test("DB01 guard rejects same app target with different credentials", () => {
  assert.throws(() => assertSafeDb01TestTarget({
    TEST_DATABASE_URL:local, DATABASE_URL:"postgres://other:pass@127.0.0.1/lms_vnext_test"
  }), /configured application database/);
});
test("DB01 guard rejects non-PostgreSQL URL schemes", () => {
  assert.throws(() => assertSafeDb01TestTarget({ TEST_DATABASE_URL:"https://127.0.0.1/lms_vnext_test" }),
    /PostgreSQL URL/);
});
test("DB01 guard rejects remote hosts without exact confirmation", () => {
  const TEST_DATABASE_URL="postgres://p:secret@pg.internal/lms_vnext_test";
  assert.throws(() => assertSafeDb01TestTarget({ TEST_DATABASE_URL }), /Remote test database requires/);
  assert.throws(() => assertSafeDb01TestTarget({
    TEST_DATABASE_URL, DB01_REMOTE_TEST_DATABASE_CONFIRM:"RESET:other/lms_vnext_test"
  }), /Remote test database requires/);
});
test("DB01 guard permits only confirmed remote test host/name", () => {
  assert.deepEqual(assertSafeDb01TestTarget({
    TEST_DATABASE_URL:"postgres://p:secret@pg.internal/lms_vnext_test",
    DB01_REMOTE_TEST_DATABASE_CONFIRM:"RESET:pg.internal/lms_vnext_test"
  }), {host:"pg.internal",database:"lms_vnext_test",mode:"explicit-remote"});
});
test("DB01 guard redacts secrets and rejects multiple path segments", () => {
  assert.throws(() => assertSafeDb01TestTarget({
    TEST_DATABASE_URL:"postgres://p:secret@localhost/lms_vnext_test/schema"
  }), /simple database name/);
  assert.throws(() => assertSafeDb01TestTarget({
    TEST_DATABASE_URL:"postgres://u:mySecret@pg.internal/test_db"
  }), error => !error.message.includes("mySecret"));
});
