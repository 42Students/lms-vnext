import test from "node:test";
import assert from "node:assert/strict";
import { ACCOUNTS, parseAccount, validateReceipt, nextFamily, reportFromFiles, nextPhaseTask } from "../scripts/page-closure.mjs";

const SHA = "a".repeat(40);
const evidence = kind => ({ kind, sha: SHA, result: "passed",
  url: "https://github.com/42Students/lms-vnext/actions/runs/123" });
const receipt = (id, change = {}) => ({ id, implementation: {
  status: "green", legacyFeSha: SHA, legacyBeSha: SHA, vnextSha: SHA,
  inventoryComplete: true, unmappedRequired: 0, openP0P1: 0,
  surfaces: ["modal"], actions: ["save"], states: ["empty", "error"],
  evidence: ["functional", "authorization", "browser-desktop", "browser-mobile"].map(evidence),
  ...change,
}});
const section = r => "## Page: Attendance\n- [x] Save works\n<!-- page-closure\n" +
  JSON.stringify(r) + "\n-->\n";
test("all eight account/shared scopes are declared", () => assert.equal(ACCOUNTS.length, 8));
test("historic checked rows are not green", () => {
  const p = parseAccount("## Page: Attendance\n- [x] Looks complete", "faculty", "faculty.md");
  assert.equal(p[0].implementationGreen, false);
});
test("valid evidence means implementation green, not design/release", () => {
  const p = parseAccount(section(receipt("faculty:attendance")), "faculty", "faculty.md")[0];
  assert.equal(p.implementationGreen, true);
  assert.equal(p.designGreen, false);
  assert.equal(p.releaseGreen, false);
});
test("reject incomplete checklist, missing authorization, changed oracle and unmapped child", () => {
  const invalid = [
    { evidence: ["functional", "browser-desktop", "browser-mobile"].map(evidence) },
    { legacyFeSha: "outdated" }, { unmappedRequired: 1 }, { openP0P1: 1 },
    { evidence: ["functional", "authorization", "browser-desktop", "browser-mobile"]
      .map(k => ({ ...evidence(k), sha: "b".repeat(40) })) },
    { changedLegacyBehavior: true },
  ];
  for (const variation of invalid)
    assert.equal(validateReceipt("faculty:attendance", receipt("faculty:attendance", variation), 1, 0).implementationGreen, false);
  assert.equal(parseAccount(section(receipt("faculty:attendance")).replace("- [x]", "- [ ]"), "faculty", "faculty.md")[0].implementationGreen, false);
});
test("blocked family is not green and next skips blocked + accepted", () => {
  const md = section(receipt("faculty:attendance")) + "## Page: Discussions\n- [ ] chat\n" +
    "<!-- page-closure\n" + JSON.stringify({ id: "faculty:discussions",
      implementation: { status: "blocked", blockers: ["Specific DB migration missing"] } }) +
    "\n-->\n## Page: Students\n- [ ] students\n";
  const report = reportFromFiles([{ account: "faculty", file: "faculty.md", markdown: md }]);
  assert.equal(report.accounts.find(a => a.account === "faculty").blocked, 1);
  assert.equal(nextFamily(report, "faculty").id, "faculty:students");
});
test("duplicate historic headings reconcile into one family, excluding unrelated notes", () => {
  const x = parseAccount("## Page: Courses\n- [ ] action\n## 2026-10-14 note\n" +
    "- [x] historic\n## Page: Courses\n- [ ] different\n", "faculty", "faculty.md");
  assert.equal(x.length, 1);
  assert.deepEqual(x[0].locations, [1, 5]);
  assert.equal(x[0].checked, 0);
  assert.equal(x[0].unchecked, 2);
  assert.deepEqual(x[0].problems, []);
});
test("standalone, workspace and report surfaces with the same label stay distinct", () => {
  const x = parseAccount("## Page: Resources\n- [ ] a\n" +
    "## Workspace section: Resources\n- [ ] b\n" +
    "## Report: Resources\n- [ ] c\n", "college-admin", "college-admin.md");
  assert.deepEqual(x.map(a => a.id), ["college-admin:resources", "college-admin:workspace-resources", "college-admin:report-resources"]);
});
test("unscoped continuation respects current phase dependencies", () => {
  const x = nextPhaseTask({ currentPhase: "DATABASE", tasks: [
    { id: "DB-A", phase: "DATABASE", done: false, dependsOn: ["DB-B"] },
    { id: "DB-B", phase: "DATABASE", done: false },
    { id: "UI-A", phase: "UI", done: false },
  ]});
  assert.equal(x.next.id, "DB-B");
});
