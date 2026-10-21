import { attachSignatures, contextRequestFor, generateReport, parseEntries } from "../logReportSource";
import { normalizeSignature, sha256Hex } from "../logSignature";

const SINCE = "2026-09-28T00:00:00.000Z";
const UNTIL = "2026-09-28T12:00:00.000Z";

const line = (o) => JSON.stringify(o);
const ndjson = (entries, meta = {}) =>
  entries.map(line).join("\n") + "\n" + line({ _meta: true, environment: "PRODUCTION", count: entries.length, truncated: false, ...meta }) + "\n";
const blobOf = (text) => ({ blob: { text: async () => text } });

const boom = (extra = {}) => ({
  insertId: Math.random().toString(36).slice(2),
  severity: "ERROR",
  timestamp: "2026-09-28T06:00:00.000Z",
  message: "Boom 42",
  httpMethod: "GET",
  httpPath: "/api/v1/x/5",
  httpStatus: "500",
  userId: "7",
  userType: "LEARNER",
  collegeId: "6",
  commit: "abcdef1234567",
  ...extra,
});

function fakeApi(overrides = {}) {
  return {
    exportLogs: jest.fn().mockResolvedValue(blobOf(ndjson([boom(), boom({ userId: "8" })]))),
    getKnownErrors: jest.fn().mockResolvedValue([]),
    getDeploys: jest.fn().mockResolvedValue([]),
    getDeployHealth: jest.fn().mockResolvedValue({ errorsBefore: 0, errorsAfter: 0, verdict: "OK" }),
    getLogContext: jest.fn().mockResolvedValue({ users: [], colleges: [] }),
    listBugReports: jest.fn().mockResolvedValue({ content: [] }),
    ...overrides,
  };
}

describe("parsing and signatures", () => {
  test("parseEntries skips broken lines and returns the metadata separately", () => {
    const text = `${line(boom())}\nnot json\n${line({ _meta: true, truncated: true })}\n`;
    const { entries, meta } = parseEntries(text);
    expect(entries).toHaveLength(1);
    expect(meta.truncated).toBe(true);
  });

  test("attachSignatures gives identical messages one signature and different ones another", async () => {
    const entries = await attachSignatures([boom(), boom({ message: "Boom 43" }), boom({ message: "Other" })]);
    expect(entries[0]._sig).toBe(entries[1]._sig);
    expect(entries[0]._sig).not.toBe(entries[2]._sig);
    expect(entries[0]._sig).toBe(await sha256Hex(normalizeSignature("Boom 42", "/api/v1/x/5")));
  });

  test("contextRequestFor asks for the busiest real users and colleges, never the super admin", () => {
    const entries = [
      boom({ userId: "7" }), boom({ userId: "7" }), boom({ userId: "9", userType: "FACULTY" }),
      boom({ userId: "0", userType: "FACULTY" }), boom({ userId: "3", userType: "RECRUITER" }), boom({ userId: "", collegeId: "" }),
    ];
    const request = contextRequestFor(entries);
    expect(request.users).toEqual([{ id: 7, userType: "LEARNER" }, { id: 9, userType: "FACULTY" }]);
    expect(request.collegeIds).toEqual([6]);
  });
});

describe("generateReport", () => {
  test("produces a markdown report and reports progress through the phases", async () => {
    const phases = [];
    const result = await generateReport({ since: SINCE, until: UNTIL, api: fakeApi(), onProgress: (p) => phases.push(p.phase) });

    expect(result.entryCount).toBe(2);
    expect(result.model.groups).toHaveLength(1);
    expect(result.model.groups[0].distinctUsers).toBe(2);
    expect(result.markdown).toContain("# 42LMS log triage report — PRODUCTION");
    expect(result.filename).toMatch(/^lms-report_PRODUCTION_.*\.md$/);
    expect(result.rawText).toContain('"_meta":true');
    expect(phases).toEqual(expect.arrayContaining(["logs", "context", "building"]));
  });

  test("a supporting lookup failing degrades the report instead of failing it", async () => {
    const api = fakeApi({
      getKnownErrors: jest.fn().mockRejectedValue(new Error("boom")),
      getDeploys: jest.fn().mockRejectedValue(new Error("boom")),
      getLogContext: jest.fn().mockRejectedValue(new Error("boom")),
      listBugReports: jest.fn().mockRejectedValue(new Error("boom")),
    });
    const result = await generateReport({ since: SINCE, until: UNTIL, api });
    expect(result.model.groups).toHaveLength(1);
    expect(result.model.deploys).toEqual([]);
    expect(result.model.issues).toEqual([]);
  });

  test("a failing log export is fatal, because there is nothing to report without it", async () => {
    const api = fakeApi({ exportLogs: jest.fn().mockRejectedValue(Object.assign(new Error("forbidden"), { status: 403 })) });
    await expect(generateReport({ since: SINCE, until: UNTIL, api })).rejects.toThrow("forbidden");
  });

  test("known errors are matched to groups by signature, and deploys get a health check", async () => {
    const sig = await sha256Hex(normalizeSignature("Boom 42", "/api/v1/x/5"));
    const api = fakeApi({
      getKnownErrors: jest.fn().mockResolvedValue([{ id: 3, signatureHash: sig, fixStatus: "FIXED", fixedInCommit: "abcdef1", regressedAt: "2026-09-28T07:00:00Z", firstSeenAt: "2026-09-01T00:00:00Z" }]),
      getDeploys: jest.fn().mockResolvedValue([
        { at: "2026-09-28T05:00:00Z", commit: "abcdef1234567", pods: 2 },
        { at: "2026-09-10T05:00:00Z", commit: "old", pods: 2 },
      ]),
    });
    const result = await generateReport({ since: SINCE, until: UNTIL, api });

    expect(result.model.groups[0].status).toBe("REGRESSION");
    expect(result.model.deploys).toHaveLength(1);
    expect(result.model.deploys[0].health.verdict).toBe("OK");
    expect(api.getDeployHealth).toHaveBeenCalledTimes(1);
    expect(result.markdown).toContain("REGRESSION");
  });

  test("only open issues for this environment are included", async () => {
    const api = fakeApi({
      listBugReports: jest.fn().mockResolvedValue({ content: [
        { publicId: "LMS-1", status: "NEW", environment: "PRODUCTION", description: "a" },
        { publicId: "LMS-2", status: "CLOSED", environment: "PRODUCTION", description: "b" },
        { publicId: "LMS-3", status: "NEW", environment: "DEVELOPMENT", description: "c" },
      ] }),
    });
    const result = await generateReport({ since: SINCE, until: UNTIL, api });
    expect(result.model.issues.map((i) => i.publicId)).toEqual(["LMS-1"]);
  });

  test("the previous-period comparison fetches the equal span before the range", async () => {
    const exportLogs = jest.fn()
      .mockResolvedValueOnce(blobOf(ndjson([boom(), boom()])))
      .mockResolvedValue(blobOf(ndjson([boom()])));
    const result = await generateReport({ since: SINCE, until: UNTIL, includePrevious: true, api: fakeApi({ exportLogs }) });
    expect(result.model.previousTotal).toBe(1);
    const previousCall = exportLogs.mock.calls.find(([args]) => new Date(args.until).getTime() <= new Date(SINCE).getTime() + 1);
    expect(previousCall).toBeTruthy();
  });

  test("cancelling stops the export early", async () => {
    await expect(generateReport({ since: SINCE, until: UNTIL, api: fakeApi(), isCancelled: () => true })).rejects.toThrow("cancelled");
  });
});
