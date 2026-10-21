import {
  buildReportModel,
  classSql,
  collegeSql,
  endpointShape,
  fence,
  pathEntities,
  renderGroup,
  renderReportMarkdown,
  reportFilename,
  shortCommit,
  sparkline,
  trendBuckets,
  userSql,
} from "../logReport";
import { normalizeSignature, sha256HexSync } from "../logSignature";

const SINCE = "2026-09-28T00:00:00.000Z";
const UNTIL = "2026-09-29T00:00:00.000Z";
const STACK = [
  'org.springframework.web.server.ResponseStatusException: 403 FORBIDDEN "Only learners can submit quizzes"',
  "\tat com._42students.lms.controller.QuizController.submit(QuizController.java:210)",
  "\tat java.base/java.lang.reflect.Method.invoke(Unknown Source)",
].join("\n");

let counter = 0;
function entry(overrides = {}) {
  counter += 1;
  const base = {
    insertId: `id${counter}`,
    severity: "ERROR",
    timestamp: "2026-09-28T10:00:00.000Z",
    message: "Unhandled exception: 403 FORBIDDEN \"Only learners can submit quizzes\"",
    logger: "c._.l.e.GlobalExceptionHandler",
    httpMethod: "POST",
    httpPath: "/api/v1/quizzes/96/submit",
    httpStatus: "403",
    userId: "15",
    userType: "FACULTY",
    collegeId: "6",
    commit: "abcdef1234567890",
    requestId: `req-${counter}`,
    exception: STACK,
  };
  return { ...base, ...overrides };
}

const withSig = (e) => ({ ...e, _sig: sha256HexSync(normalizeSignature(e.message, e.httpPath)) });

describe("helpers", () => {
  test("endpointShape collapses ids so one endpoint is one group of paths", () => {
    expect(endpointShape("/api/v1/quizzes/96/submit?x=1")).toBe("/api/v1/quizzes/:id/submit");
    expect(endpointShape("/api/v1/x/33c5d710-0557-4dcc-b165-c828cbda001b")).toBe("/api/v1/x/:id");
    expect(endpointShape(null)).toBe("");
  });

  test("sql helpers only emit lines for numeric ids and known user types", () => {
    expect(userSql("LEARNER", "7")).toBe("SELECT * FROM learner WHERE id = 7;");
    expect(userSql("FACULTY", 15)).toBe("SELECT * FROM faculty WHERE id = 15;");
    expect(userSql("FACULTY", "0")).toBeNull();
    expect(userSql("HR", "3")).toBeNull();
    expect(userSql("LEARNER", "7; DROP TABLE learner")).toBeNull();
    expect(collegeSql("6")).toBe("SELECT * FROM college WHERE id = 6;");
    expect(collegeSql("x")).toBeNull();
    expect(classSql("9")).toBe("SELECT * FROM class WHERE id = 9;");
  });

  test("path entities produce SQL only where the table is certain and never for odd characters", () => {
    expect(pathEntities("/api/v1/quizzes/96/submit")).toEqual([
      { resource: "quizzes", id: "96", sql: "SELECT * FROM quizzes WHERE id = 96;" },
    ]);
    const course = pathEntities("/api/v1/courses/crs-mig28-u9ZzYJra1M9O/lessons/12");
    expect(course[0].sql).toBe("SELECT * FROM course WHERE slug = 'crs-mig28-u9ZzYJra1M9O';");
    expect(course[1].sql).toBe("SELECT * FROM lesson WHERE id = 12;");
    expect(pathEntities("/api/v1/assignments/5")[0].sql).toBeNull();
    expect(pathEntities("/api/v1/courses/a'b")).toEqual([]);
    expect(pathEntities("")).toEqual([]);
  });

  test("fence is longer than any backtick run inside the text", () => {
    expect(fence("plain")).toBe("```\nplain\n```");
    expect(fence("has ``` inside")).toMatch(/^````\n/);
  });

  test("sparkline and trend buckets reflect a burst", () => {
    expect(sparkline([0, 0, 4, 0])).toBe("▁▁█▁");
    expect(sparkline([])).toBe("");
    const since = new Date(SINCE).getTime();
    const buckets = trendBuckets([since + 30 * 60_000, since + 90 * 60_000, since + 95 * 60_000], since, since + 3 * 3_600_000);
    expect(buckets).toEqual([1, 2, 0]);
    expect(shortCommit("abcdef1234567890")).toBe("abcdef1");
    expect(shortCommit(null)).toBe("unknown");
  });
});

describe("buildReportModel", () => {
  test("groups by signature, counts users, and ranks a regression above a bigger new error", () => {
    const boom = [1, 2, 3, 4, 5, 6].map((i) => withSig(entry({ message: "Boom in job", httpPath: "/api/v1/j", userId: String(i), userType: "LEARNER" })));
    const quiz = [withSig(entry()), withSig(entry()), withSig(entry({ userId: "16" }))];
    const knownQuiz = { id: 4, signatureHash: quiz[0]._sig, fixStatus: "FIXED", fixedInCommit: "abcdef1", regressedAt: "2026-09-28T09:00:00Z", firstSeenAt: "2026-09-20T00:00:00Z", muted: false };

    const model = buildReportModel({ entries: [...boom, ...quiz], since: SINCE, until: UNTIL, knownErrors: [knownQuiz] });

    expect(model.groups).toHaveLength(2);
    expect(model.groups[0].status).toBe("REGRESSION");
    expect(model.groups[0].count).toBe(3);
    expect(model.groups[0].distinctUsers).toBe(2);
    expect(model.groups[1].status).toBe("NEW");
    expect(model.groups[1].distinctUsers).toBe(6);
    expect(model.regressions).toBe(1);
    expect(model.newTypes).toBe(1);
    expect(model.totalEvents).toBe(9);
  });

  test("log tooling requests and muted known errors are excluded and counted", () => {
    const tooling = withSig(entry({ message: "Cloud Logging query failed", httpPath: "/api/v1/superadmin/logs/query" }));
    const mutedEntry = withSig(entry({ message: "Client aborted" , httpPath: "/api/v1/x" }));
    const real = withSig(entry({ message: "Real bug", httpPath: "/api/v1/real" }));
    const knownMuted = { id: 9, signatureHash: mutedEntry._sig, muted: true, mutedReason: "client disconnects", fixStatus: "EXPECTED", sampleMessage: "Client aborted" };

    const model = buildReportModel({ entries: [tooling, mutedEntry, mutedEntry, real], since: SINCE, until: UNTIL, knownErrors: [knownMuted] });

    expect(model.groups).toHaveLength(1);
    expect(model.groups[0].message).toBe("Real bug");
    expect(model.excluded.tooling).toBe(1);
    expect(model.excluded.mutedCount).toBe(2);
    expect(model.excluded.muted[0]).toMatchObject({ reason: "client disconnects", count: 2 });
  });

  test("a muted error that regressed is NOT excluded", () => {
    const e = withSig(entry({ message: "Came back" }));
    const known = { id: 2, signatureHash: e._sig, muted: true, fixStatus: "FIXED", regressedAt: "2026-09-28T09:00:00Z" };
    const model = buildReportModel({ entries: [e], since: SINCE, until: UNTIL, knownErrors: [known] });
    expect(model.groups).toHaveLength(1);
    expect(model.groups[0].status).toBe("REGRESSION");
  });

  test("names, classes and colleges from the context show up next to ids, with SQL lines", () => {
    const e = withSig(entry({ userId: "7", userType: "LEARNER", collegeId: "6" }));
    const context = {
      users: [{ id: 7, userType: "LEARNER", displayName: "Asha Rao", className: "CSE-A", classId: 9, collegeId: 6 }],
      colleges: [{ id: 6, name: "NSRIT" }],
    };
    const [group] = buildReportModel({ entries: [e], since: SINCE, until: UNTIL, context }).groups;

    expect(group.topUsers[0]).toMatchObject({ name: "Asha Rao", className: "CSE-A", collegeName: "NSRIT" });
    expect(group.sqlLines).toEqual(expect.arrayContaining([
      "SELECT * FROM learner WHERE id = 7;",
      "SELECT * FROM college WHERE id = 6;",
      "SELECT * FROM class WHERE id = 9;",
      "SELECT * FROM quizzes WHERE id = 96;",
    ]));
    expect(group.reproduce).toBe("POST /api/v1/quizzes/96/submit -> HTTP 403");
  });

  test("source frames, releases and frontend correlation are captured", () => {
    const a = withSig(entry());
    const fe = withSig(entry({ message: "[Frontend] Submit failed: POST /api/v1/quizzes/96/submit status=403", httpPath: "/quiz", logger: "c._.l.c.ClientErrorReportController", exception: "" }));
    const model = buildReportModel({ entries: [a, fe], since: SINCE, until: UNTIL });
    const group = model.groups.find((g) => g.message.startsWith("Unhandled"));
    expect(group.frames[0].path).toBe("src/main/java/com/_42students/lms/controller/QuizController.java");
    expect(group.latestCommit).toBe("abcdef1234567890");
    expect(group.relatedFrontend).toBe(1);
    expect(model.frontendErrorCount).toBe(1);
  });

  test("slow-request warnings become their own section, not error groups", () => {
    const slow = (ms) => withSig(entry({ severity: "WARNING", message: "http.request.slow", httpMethod: "GET", httpPath: "/api/v1/reports/5", durationMs: String(ms), exception: "" }));
    const model = buildReportModel({ entries: [slow(4000), slow(6000), withSig(entry())], since: SINCE, until: UNTIL });
    expect(model.groups).toHaveLength(1);
    expect(model.slow[0]).toMatchObject({ endpoint: "GET /api/v1/reports/:id", count: 2, avg: 5000, max: 6000 });
  });

  test("entries with no precomputed signature still group correctly", () => {
    const model = buildReportModel({ entries: [entry({ message: "Same 1" }), entry({ message: "Same 2" })], since: SINCE, until: UNTIL });
    expect(model.groups).toHaveLength(1);
    expect(model.groups[0].count).toBe(2);
  });
});

describe("renderReportMarkdown", () => {
  const model = buildReportModel({
    entries: [withSig(entry()), withSig(entry({ userId: "16" }))],
    since: SINCE,
    until: UNTIL,
    environment: "PRODUCTION",
    previousTotal: 1,
    deploys: [{ at: "2026-09-28T14:00:00Z", commit: "bbb2222aaaa", pods: 2, health: { errorsBefore: 1, errorsAfter: 9, capped: false, verdict: "JUMP" } }],
    issues: [{ publicId: "LMS-0001", status: "NEW", page: "Settings", screen: "Tenants", description: "Testing", reporterName: "Phanindra" }],
  });
  const md = renderReportMarkdown(model);

  test("opens with instructions and context so the file stands alone", () => {
    expect(md.startsWith("# 42LMS log triage report — PRODUCTION")).toBe(true);
    expect(md).toContain("## How to use this report");
    expect(md).toContain("Classify it as one of: FIXED");
    expect(md).toContain("## System context");
    expect(md).toContain("prod-2026");
  });

  test("summary, deploys, groups, noise and issues sections are all present", () => {
    expect(md).toContain("## Summary");
    expect(md).toContain("(previous period: 1, +1)");
    expect(md).toContain("## Deploys in this range");
    expect(md).toContain("**JUMP**");
    expect(md).toContain("## Error groups (highest impact first)");
    expect(md).toContain("### 1. Unhandled exception: 403 FORBIDDEN");
    expect(md).toContain("## Excluded noise");
    expect(md).toContain("## Open tracker issues");
    expect(md).toContain("**LMS-0001**");
  });

  test("a group shows impact, source link pinned to the deployed commit, and SQL", () => {
    expect(md).toContain("2 distinct users");
    // pinned to the release that logged the error (abcdef123...), not the newest deploy (bbb2222aaaa)
    expect(md).toContain("/blob/abcdef1234567890/src/main/java/com/_42students/lms/controller/QuizController.java#L210");
    expect(md).not.toContain("/blob/bbb2222aaaa/");
    expect(md).toContain("SELECT * FROM faculty WHERE id = 15;");
    expect(md).toContain("**Check the data**");
  });

  test("a stack trace containing backticks cannot break out of its code fence", () => {
    const nasty = withSig(entry({ message: "Weird ``` message", exception: "boom ```\nat x" }));
    const out = renderGroup(buildReportModel({ entries: [nasty], since: SINCE, until: UNTIL }).groups[0], 1);
    expect(out).toContain("````");
  });

  test("an empty range still renders a valid document", () => {
    const empty = renderReportMarkdown(buildReportModel({ entries: [], since: SINCE, until: UNTIL }));
    expect(empty).toContain("No error groups in this range.");
  });

  test("the filename encodes environment and range", () => {
    expect(reportFilename(model)).toBe("lms-report_PRODUCTION_20260928T0000_to_20260929T0000.md");
  });
});
