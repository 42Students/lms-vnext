import { interleaveDeploys, issuePayloadFor, singleGroupPrompt, statusChip } from "../logListModel";

const row = (timestamp, message = "m") => ({ entry: { timestamp, message }, count: 1 });
const deploy = (at, commit = "abcdef1234") => ({ at, commit, pods: 2 });

describe("interleaveDeploys", () => {
  const rows = [row("2026-09-28T12:00:00Z"), row("2026-09-28T10:00:00Z"), row("2026-09-28T08:00:00Z")];

  test("a deploy lands between the entries that straddle it", () => {
    const out = interleaveDeploys(rows, [deploy("2026-09-28T09:00:00Z")]);
    expect(out.map((x) => x.type)).toEqual(["entry", "entry", "deploy", "entry"]);
  });

  test("deploys newer than everything shown are left out and older ones inside the span go last", () => {
    const out = interleaveDeploys(rows, [deploy("2026-09-28T13:00:00Z"), deploy("2026-09-28T08:00:00Z")]);
    expect(out.filter((x) => x.type === "deploy")).toHaveLength(1);
    expect(out[out.length - 1].type).toBe("deploy");
  });

  test("several deploys keep their order, newest first", () => {
    const out = interleaveDeploys(rows, [deploy("2026-09-28T09:00:00Z", "older"), deploy("2026-09-28T11:00:00Z", "newer")]);
    const commits = out.filter((x) => x.type === "deploy").map((x) => x.deploy.commit);
    expect(commits).toEqual(["newer", "older"]);
  });

  test("a deploy newer than every group head but inside the loaded span still shows, after the last row", () => {
    // Grouped view: only the newest occurrence of each group is a row, older ones are folded in.
    const grouped = [row("2026-09-28T12:00:00Z"), row("2026-09-28T11:30:00Z")];
    const oldestLoaded = new Date("2026-09-28T08:00:00Z").getTime();
    const out = interleaveDeploys(grouped, [deploy("2026-09-28T10:00:00Z")], oldestLoaded);
    expect(out.map((x) => x.type)).toEqual(["entry", "entry", "deploy"]);
    // and one older than everything loaded is not part of this view
    expect(interleaveDeploys(grouped, [deploy("2026-09-28T07:00:00Z")], oldestLoaded).some((x) => x.type === "deploy")).toBe(false);
  });

  test("no deploys or no rows is a no-op", () => {
    expect(interleaveDeploys(rows, []).every((x) => x.type === "entry")).toBe(true);
    expect(interleaveDeploys([], [deploy("2026-09-28T09:00:00Z")])).toEqual([]);
    expect(interleaveDeploys(rows, [deploy("garbage")]).every((x) => x.type === "entry")).toBe(true);
  });
});

describe("statusChip", () => {
  test("nothing tracked shows no chip", () => {
    expect(statusChip(null)).toBeNull();
  });

  test("a regression outranks a fixed decision", () => {
    expect(statusChip({ fixStatus: "FIXED", fixedInCommit: "abcdef1234", regressedAt: "2026-09-28T00:00:00Z" })).toMatchObject({ label: "Regression", tone: "danger" });
  });

  test("fixed, expected, muted and open each read differently", () => {
    expect(statusChip({ fixStatus: "FIXED", fixedInCommit: "abcdef1234" })).toMatchObject({ label: "Fixed abcdef1", tone: "success" });
    expect(statusChip({ fixStatus: "EXPECTED", mutedReason: "client aborts" })).toMatchObject({ label: "Expected", title: "client aborts" });
    expect(statusChip({ fixStatus: "OPEN", muted: true, mutedReason: "noise" })).toMatchObject({ label: "Muted", title: "noise" });
    expect(statusChip({ fixStatus: "OPEN" })).toMatchObject({ label: "Open", tone: "warning" });
  });
});

describe("singleGroupPrompt", () => {
  test("wraps one error in instructions, with ids, sql and a pinned source link", () => {
    const occurrences = [
      {
        timestamp: "2026-09-28T10:00:00Z", severity: "ERROR", message: "Boom", httpMethod: "POST", httpPath: "/api/v1/quizzes/96/submit",
        httpStatus: "403", userId: "15", userType: "FACULTY", collegeId: "6", commit: "abcdef1234",
        exception: "x\n\tat com._42students.lms.controller.QuizController.submit(QuizController.java:210)",
      },
    ];
    const text = singleGroupPrompt(occurrences, { deploys: [{ at: "2026-09-28T09:00:00Z", commit: "bbb2222aaaa", pods: 2 }] });
    expect(text).toContain("Investigate this production error");
    expect(text).toContain("SELECT * FROM faculty WHERE id = 15;");
    expect(text).toContain("SELECT * FROM quizzes WHERE id = 96;");
    expect(text).toContain("/blob/abcdef1234/src/main/java/com/_42students/lms/controller/QuizController.java#L210");
  });

  test("nothing to say about no entries", () => {
    expect(singleGroupPrompt([])).toBe("");
  });
});

describe("issuePayloadFor", () => {
  const group = {
    count: 12,
    entry: { message: "Boom", httpMethod: "GET", httpPath: "/api/v1/x?y=1", httpStatus: "500", logger: "c.x.Y", userId: "7", userType: "LEARNER", collegeId: "6", commit: "abcdef1234567", timestamp: "2026-09-28T10:00:00Z" },
  };

  test("fills every field the public report endpoint requires, within its limits", () => {
    const payload = issuePayloadFor(group, { environment: "PRODUCTION", permalink: "https://42lms.com/tracker/logs?insertId=a" });
    ["reporterName", "accountRole", "environment", "page", "issueType", "description", "severity"].forEach((key) => expect(String(payload[key] || "").length).toBeGreaterThan(0));
    expect(payload.page).toBe("Backend logs");
    expect(payload.screen).toBe("/api/v1/x");
    expect(payload.issueType).toBe("Server Error / 500");
    expect(payload.severity).toBe("MAJOR");
    expect(payload.evidenceLink).toContain("insertId=a");
    expect(payload.description).toContain("Occurrences in the loaded window: 12");
    expect(payload.description).toContain("LEARNER #7, college #6");
    expect(payload.description.length).toBeLessThanOrEqual(4000);
  });

  test("a rare non-5xx error is a minor crash report", () => {
    const payload = issuePayloadFor({ count: 1, entry: { message: "Odd", httpStatus: "400" } });
    expect(payload.severity).toBe("MINOR");
    expect(payload.issueType).toBe("Crash / Error");
    expect(payload.screen).toBeNull();
  });
});
