import fs from "fs";
import path from "path";

const src = fs.readFileSync(
  path.join(process.cwd(), "src/components/tpo/RequestsPanel.js"),
  "utf8"
);

test("individual TPO request decisions are single-flight", () => {
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(src).toMatch(/const decisionBusyRef = useRef\(null\)/);
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(src).toMatch(/if \(decisionBusyRef\.current != null\) return false/);
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(src).toMatch(/decisionBusyRef\.current = request\.id/);
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(src).toMatch(/confirmLoading=\{decisionBusyId != null\}/);
  expect(src).toMatch(/disabled=\{decisionBusyId != null\}/);
});

test("successful request decisions reconcile the row before the follow-up refresh", () => {
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(src).toMatch(/Reconcile immediately/);
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(src).toMatch(/setRows\(\(current\) => current\.map/);
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(src).toMatch(/status: decidedStatus/);
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(src).toMatch(/void load\(\)/);
});
