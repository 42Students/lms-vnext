import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Source-only promotion candidate, not an active table until W01 journalizes
// and executes it. This suite is intentionally part of the standard vitest run.
const sql = readFileSync(
  join(process.cwd(), "docs/planning/sql/db07-w03-unrepresented-project-history-candidate.sql"),
  "utf8",
);
const drizzle = readFileSync(
  join(process.cwd(), "src/db/schema/project-audit-staged.ts"),
  "utf8",
);

describe("W03 DB07 staged history/comment retention", () => {
  it("rejects both row mutations and statement TRUNCATE on every append-only audit family", () => {
    for (const [table, row, truncate] of [
      ["project_meeting_history", "w03_meeting_history_immutable", "w03_meeting_history_no_truncate"],
      ["project_resource_audit", "w03_resource_history_immutable", "w03_resource_history_no_truncate"],
      ["project_delivery_events", "w03_delivery_history_immutable", "w03_delivery_history_no_truncate"],
    ]) {
      expect(sql).toMatch(new RegExp(
        "CREATE TRIGGER " + row + " BEFORE UPDATE OR DELETE\\s+ON " + table +
          " FOR EACH ROW EXECUTE FUNCTION w03_reject_project_history_mutation",
      ));
      expect(sql).toMatch(new RegExp(
        "CREATE TRIGGER " + truncate + " BEFORE TRUNCATE\\s+ON " + table +
          " FOR EACH STATEMENT EXECUTE FUNCTION w03_reject_project_history_mutation",
      ));
    }
  });

  it("preserves comment soft-delete instead of permitting physical erasure", () => {
    expect(sql).toMatch(
      /CREATE TRIGGER w03_task_comments_no_delete BEFORE DELETE\s+ON project_task_comments FOR EACH ROW\s+EXECUTE FUNCTION w03_reject_project_comment_erasure/,
    );
    expect(sql).toMatch(
      /CREATE TRIGGER w03_task_comments_no_truncate BEFORE TRUNCATE\s+ON project_task_comments FOR EACH STATEMENT\s+EXECUTE FUNCTION w03_reject_project_comment_erasure/,
    );
    expect(sql).toContain("deleted_at timestamptz");
  });

  it("keeps project/task/author identity immutable across comment updates", () => {
    expect(sql).toMatch(
      /CREATE TRIGGER w03_task_comments_identity_immutable BEFORE UPDATE\s+ON project_task_comments FOR EACH ROW\s+EXECUTE FUNCTION w03_guard_project_comment_identity/,
    );
    for (const col of ["id", "project_id", "project_task_id", "commenter_user_id", "created_at"]) {
      expect(sql).toContain("NEW." + col + " IS DISTINCT FROM OLD." + col);
    }
  });

  it("maintains SQL and Drizzle chronology checks with matching identifiers", () => {
    for (const name of [
      "w03_task_comments_updated_after_created_ck",
      "w03_task_comments_deleted_after_created_ck",
    ]) {
      expect(sql).toContain(name);
      expect(drizzle).toContain('check("' + name + '"');
    }
  });

  it("does not confuse staging with registered PostgreSQL acceptance", () => {
    expect(sql).toContain("NOT registered in drizzle/meta/_journal.json");
    expect(drizzle).toContain("Meeting/resource audits promoted by 0196;");
  });
});
