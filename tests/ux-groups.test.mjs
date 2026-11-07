import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { inspectUxGroups, isCompletionEvidence, transitionUxGroup } from "../scripts/ux-groups.mjs";

const tracker = JSON.parse(fs.readFileSync(new URL("../docs/tracker.json", import.meta.url), "utf8"));
const registry = JSON.parse(fs.readFileSync(new URL("../docs/audit/ui-surfaces/ui-surfaces.json", import.meta.url), "utf8"));
const routes = fs.readFileSync(new URL("../docs/planning/ui-surfaces.md", import.meta.url), "utf8");
const fixture = () => JSON.parse(JSON.stringify(tracker));
const newProof = () => ({
  commitSha: "0123456789abcdef0123456789abcdef01234567",
  parityDoc: "docs/parity/learner.md",
  tests: [{ command: "node --test tests/ux-groups.test.mjs", passed: true, proof: "local transcript for exact SHA" }],
  browser: [
    { viewport: "desktop", proof: "capture at 1280px for exact SHA" },
    { viewport: "mobile", proof: "capture at 375px for exact SHA" },
  ],
  regressionReview: "Shared navigation and dependent call sites reviewed",
  securityReview: "No auth/tenant permission changes; negative states covered",
});

test("canonical UX board accounts for exactly the snapshot registry entries and newer routes", () => {
  const report = inspectUxGroups(tracker, {registry,routes});
  assert.deepEqual(report.errors, []);
  assert.equal(report.referencedRegistry, registry.surfaces.length);
  assert.equal(report.additionalRouteOnly, 83);
  assert.equal(report.coveredEntries, 2163);
  // Multiple chats move groups concurrently; the valid-state sum is stable,
  // but exact DOING/DONE snapshots are deliberately not.
  assert.equal(Object.values(report.counts).reduce((sum, n) => sum + n, 0), report.totalGroups);
  assert.ok(report.groups.every(g => ["UNPICKED", "PICKED", "DOING", "DONE"].includes(g.status)));
});

test("unpicked group can be reserved, started and released without touching other groups", () => {
  const doc = fixture();
  const group = doc.uxReview.groups.find(g => g.status === "UNPICKED");
  const id = group.id;
  transitionUxGroup(doc, {action:"pick",id,by:"chat-A",now:"2026-11-07T12:00:00Z"});
  assert.equal(group.status,"PICKED");
  assert.equal(group.pickedBy,"chat-A");
  assert.throws(() => transitionUxGroup(doc,{action:"pick",id,by:"chat-B"}), /already PICKED/);
  assert.throws(() => transitionUxGroup(doc,{action:"start",id,by:"chat-B"}), /assigned to chat-A/);
  transitionUxGroup(doc,{action:"start",id,by:"chat-A"});
  assert.equal(group.status,"DOING");
  transitionUxGroup(doc,{action:"release",id,by:"chat-A"});
  assert.equal(group.status,"UNPICKED");
  assert.equal(group.pickedBy,null);
  assert.equal(doc.uxReview.groups.find(g => g.id === "UX-G001").status,"DOING");
});

test("DONE refuses missing execution/browser evidence and requires DOING with same owner", () => {
  const doc=fixture(),g=doc.uxReview.groups.find(g=>g.status==="UNPICKED"),id=g.id;
  assert.equal(isCompletionEvidence({commitSha:"invalid"}),false);
  transitionUxGroup(doc,{action:"pick",id,by:"chat-A"});
  assert.throws(()=>transitionUxGroup(doc,{action:"done",id,by:"chat-A",evidence:newProof()}),/must be DOING/);
  transitionUxGroup(doc,{action:"start",id,by:"chat-A"});
  const missingMobile=newProof();missingMobile.browser.pop();
  assert.throws(()=>transitionUxGroup(doc,{action:"done",id,by:"chat-A",evidence:missingMobile}),/DONE requires/);
  transitionUxGroup(doc,{action:"done",id,by:"chat-A",evidence:newProof()});
  assert.equal(g.status,"DONE");
  assert.equal(g.evidence.length,1);
  assert.throws(()=>transitionUxGroup(doc,{action:"release",id,by:"chat-A"}),/Only PICKED\/DOING/);
});

test("registry drift or duplicated entry cannot silently be called fully grouped", () => {
  const doc=fixture();
  doc.uxReview.groups[1].surfaceIds[0]=doc.uxReview.groups[0].surfaceIds[0];
  const report=inspectUxGroups(doc,{registry,routes});
  assert.ok(report.errors.includes("DUPLICATE_REGISTRY_ENTRY"));
  assert.ok(report.errors.some(e=>e.startsWith("REGISTRY_ENTRY_CHANGED")));
});
