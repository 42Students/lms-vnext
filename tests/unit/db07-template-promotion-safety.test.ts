import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// These are SOURCE-ONLY guards that run under the existing standard Vitest
// suite. They do not imply any staged SQL was migrated or PostgreSQL accepted.
const read = (relativePath: string) =>
  readFileSync(join(process.cwd(), relativePath), "utf8");

const revisionSql = read("docs/planning/sql/db07-template-version-append-only-staging.sql");
const auditSql = read("docs/planning/sql/db07-w03-unrepresented-project-history-candidate.sql");
const projectService = read("src/modules/projects/template-service.ts");
const p2Integration = read("tests/integration/projects-p2-templates.test.ts");

function detailReadBlock(source: string) {
  const start = source.indexOf("export async function getAssignedProjectTemplateDetail(");
  if (start < 0) throw new Error("Missing assigned project template detail service");
  const end = source.indexOf("\nexport async function ", start + 1);
  return source.slice(start, end < 0 ? undefined : end);
}

function hasOwnerGuard(source: string) {
  const detail = detailReadBlock(source);
  return /\.innerJoin\(\s*projectTemplateVersions,\s*and\(/.test(detail) &&
    /eq\(\s*projectTemplateVersions\.id,\s*projectTemplateCollegeAssignments\.templateVersionId/.test(detail) &&
    /eq\(\s*projectTemplateVersions\.templateId,\s*projectTemplateCollegeAssignments\.templateId/.test(detail);
}

function validProjectCommentFunction(source: string, name: string) {
  const body = new RegExp(
    "CREATE FUNCTION " + name +
      "\\(\\) RETURNS trigger\\s+LANGUAGE plpgsql AS \\$w03_comments_guard\\$" +
      "[\\s\\S]*?END \\$w03_comments_guard\\$;", "i",
  );
  return body.test(source);
}

describe("DB07 immutable history and template promotion safety (source-only)", () => {
  it("keeps both history/comment PL/pgSQL dollar-quoted bodies parseable", () => {
    for (const name of [
      "w03_reject_project_comment_erasure",
      "w03_guard_project_comment_identity",
    ]) expect(validProjectCommentFunction(auditSql, name)).toBe(true);
    expect(auditSql).not.toMatch(/LANGUAGE plpgsql AS \$(?:\r?\n)/);
  });

  it("detects a regressively malformed dollar-quoted comment function", () => {
    const mutant = auditSql.replace(
      "LANGUAGE plpgsql AS $w03_comments_guard$",
      "LANGUAGE plpgsql AS $",
    );
    expect(validProjectCommentFunction(mutant, "w03_reject_project_comment_erasure")).toBe(false);
  });

  it("blocks history TRUNCATE for all three typed audit tables and soft-deleted comments", () => {
    for (const [trigger, table] of [
      ["w03_meeting_history_no_truncate", "project_meeting_history"],
      ["w03_resource_history_no_truncate", "project_resource_audit"],
      ["w03_delivery_history_no_truncate", "project_delivery_events"],
      ["w03_task_comments_no_truncate", "project_task_comments"],
    ]) {
      expect(auditSql).toMatch(new RegExp(
        "CREATE TRIGGER " + trigger + " BEFORE TRUNCATE\\s+ON " +
          table + " FOR EACH STATEMENT EXECUTE FUNCTION",
      ));
    }
    expect(auditSql).toMatch(/BEFORE DELETE\s+ON project_task_comments FOR EACH ROW/);
  });

  it("preserves immutable template revisions across both UPDATE/DELETE and TRUNCATE CASCADE", () => {
    expect(revisionSql).toMatch(
      /CREATE TRIGGER db07_project_template_versions_append_only\s+BEFORE UPDATE OR DELETE ON project_template_versions\s+FOR EACH ROW/,
    );
    expect(revisionSql).toMatch(
      /CREATE TRIGGER db07_project_template_versions_no_truncate\s+BEFORE TRUNCATE ON project_template_versions\s+FOR EACH STATEMENT/,
    );
    expect(revisionSql).toContain("IF TG_OP = 'TRUNCATE' THEN");
    expect(revisionSql.indexOf("IF TG_OP = 'TRUNCATE'")).toBeLessThan(
      revisionSql.indexOf("OLD.id"),
    );
    const mutant = revisionSql.replace(
      /CREATE TRIGGER db07_project_template_versions_no_truncate[\s\S]*?;/,
      "",
    );
    expect(mutant).not.toMatch(/CREATE TRIGGER db07_project_template_versions_no_truncate/);
  });

  it("fails closed on foreign version/template pair even before composite FK integration", () => {
    expect(hasOwnerGuard(projectService)).toBe(true);
    const mutant = projectService.replace(
      /eq\(\s*projectTemplateVersions\.templateId,\s*projectTemplateCollegeAssignments\.templateId,?\s*\),?/,
      "true,",
    );
    expect(hasOwnerGuard(mutant)).toBe(false);
  });

  it("keeps fixtures valid under either DB070 append-only or DB071 deferred pointer migration", () => {
    expect(p2Integration).toContain("db07_project_template_versions_append_only");
    expect(p2Integration).toContain("project_templates_current_version_snapshot_fk");
    expect(p2Integration).toContain("project_templates_published_version_snapshot_fk");
    expect(p2Integration).toContain("if (status.rows[0]?.retainHistory) return");
    expect(p2Integration).toContain("fixtureSuffix = randomUUID()");
    expect(p2Integration).toMatch(/finally\s*\{[\s\S]*?set template_version_id = \$1/);
  });
});
