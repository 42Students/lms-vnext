import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(path, "utf8");
const path = root => "src/" + root;
test("UX-AUDIT2-A2-01 recruiter applicant review uses the shared native dialog and route history", () => {
  const page = read(path("app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx"));
  const drawer = read(path("components/hr/recruiter-applicant-review-drawer.tsx"));
  assert.match(page, /RecruiterApplicantReviewDrawer/);
  assert.doesNotMatch(page, /id="recruiter-focused-review-dialog"/);
  assert.match(drawer, /historyMode="route"/);
  assert.match(drawer, /router.replace\(closeHref\)/);
});
test("UX-AUDIT2-A2-02 nested cleanup pops are owned and pending transitions do not unregister listeners", () => {
  const hook = read(path("components/ui/use-overlay-webview.ts"));
  assert.match(hook, /consumeOverlayCleanupPop\(event\)/);
  assert.match(hook, /queueOverlayCleanupPop\(\)/);
  assert.match(hook, /\[open, id, historyMode\]/);
  assert.doesNotMatch(hook, /Math\.max\(240/);
});
test("UX-AUDIT2-C-02/C-03 mobile student actions and signed external resources", () => {
  const roster = read(path("components/tpo/tpo-students-spreadsheet.tsx"));
  assert.doesNotMatch(roster, /<TpoSpreadsheetGrid mobileActionsCollapsible/);
  for (const p of [
    "app/(authenticated)/learn/allAssignments/[assignmentId]/page.tsx",
    "components/placements/placement-drive-workspace.tsx",
  ]) assert.doesNotMatch(read(path(p)), /target\s*=\s*["']_blank["']/);
});
test("UX-AUDIT2-E-02 independent TPO Home service failures retain healthy content", () => {
  const source = read(path("app/(authenticated)/tpo/home/page.tsx"));
  for (const name of ["getPendingTpoRequestsCount","getTpoStudentsIntelligence","countTpoUnreadRecruiterMessages",
    "tpoCrmTablesReady","getCollegePlacementRules","getTpoPlacementTeam","listMyTpoInternalThreads"]) {
    assert.match(source, new RegExp(name + "[\\s\\S]*?\\.catch\\(\\(\\)=>", "m"), name);
  }
  assert.match(source, /optionalDataUnavailable/);
});
test("UX-AUDIT2-A2-03/04/09 44px touch targets and 16px mentor inputs", () => {
  const calendar=read(path("app/(authenticated)/mentor/calendar/page.tsx"));
  assert.match(calendar, /FilterBar/);
  assert.match(calendar, /<Input/);
  assert.match(calendar, /<Select/);
  for(const p of [
    "app/(authenticated)/mentor/calendar/page.tsx",
    "app/(authenticated)/tpo/messages/page.tsx",
    "app/(authenticated)/admin/module-access/page.tsx",
    "components/tpo/tpo-spreadsheet-grid.tsx",
  ]) assert.doesNotMatch(read(path(p)), /min-h-10/, p);
});
test("UX-AUDIT2-A2-05/06 permission and shell provide visible fallback and safe areas", () => {
  assert.match(read(path("components/ui/permission-action.tsx")), /deniedMode/);
  const shell=read(path("components/shell/app-shell.tsx"));
  assert.doesNotMatch(shell, /min-h-screen/);
  assert.match(shell, /safe-area-inset-top/);
});
test("UX-AUDIT2-A2-07 secure external URLs visible before user navigation", () => {
  const ext=read(path("components/ui/third-party-link.tsx"));
  assert.match(ext, /url\.protocol === "https:"/);
  assert.doesNotMatch(ext, /url\.protocol === "http:"/);
  assert.match(ext, /Destination URL/);
});
test("UX-AUDIT2-A2-08 guarded form calls real versioned mutation, never a no-op", () => {
  const playbook=read("docs/design-system/UX-PLAYBOOK.md");
  const form=playbook.split("### 15.5.")[1]?.split("### 15.6.")[0] ?? "";
  assert.match(form, /await onSave\(/);
  assert.match(form, /expectedVersion/);
  assert.match(form, /result\.reason === "CONFLICT"/);
  assert.doesNotMatch(form, /await authorized version-aware server mutation/);
});
test("UX-AUDIT2-A2-10/11 visual viewport and filter id regression", () => {
  const hook=read(path("components/ui/use-overlay-webview.ts"));
  assert.match(hook,/viewport\?\.offsetTop/);
  assert.doesNotMatch(hook,/Math\.max\(240/);
  const filter=read(path("components/ui/filter-bar.tsx"));
  assert.match(filter,/const panelId = useId\(\)/);
  assert.doesNotMatch(filter,/id="lms-filter-panel"/);
});
test("UX-AUDIT2-A2-12/13/14 explicit empty state, named info and persistent errors", () => {
  const table=read(path("components/ui/data-table.tsx"));
  assert.doesNotMatch(table,/No records found/);
  assert.match(table,/empty: ReactNode/);
  assert.match(read(path("components/ui/tooltip.tsx")), /aria-label=\{label/);
  const toast=read(path("components/ui/toast.tsx"));
  assert.match(toast,/input\.tone !== "error"/);
});
test("UX-AUDIT2-F-02 AST guard covers the entire tracked UI tree with pinned waivers", () => {
  const guard=read("scripts/check-ux-anti-drift.mjs");
  assert.match(guard,/ls-files/);
  assert.match(guard,/UX-GUARD-WAIVERS/);
  assert.doesNotMatch(guard,/origin\/main\.\.\.HEAD/);
  assert.match(guard,/src\/app/);
  assert.match(guard,/src\/components/);
  assert.match(guard,/baselineFor/);
});
test("UX-AUDIT2-E-01/E-04/F-03 screenshot commands require real state and affected callsite fixtures",()=>{
  const ref=read("scripts/ux-capture-references.mjs");
  assert.match(ref,/UX_REFERENCE_SCENARIOS_FILE/);
  assert.match(ref,/data-ux-state/);
  assert.match(ref,/requiredStates/);
  const sites=read("scripts/ux-capture-affected-callsites.mjs");
  assert.match(sites,/UX_AFFECTED_CALLSITES_MANIFEST/);
  assert.match(sites,/cases.length<30/);
  assert.match(sites,/keyboardFocusChecked/);
});

test("RV-01 and RV-05 enforce real roster actions and column-specific mobile detail recovery",()=>{
  const roster=read("src/components/tpo/tpo-students-spreadsheet.tsx");
  assert.doesNotMatch(roster,/<TpoSpreadsheetGrid mobileActionsCollapsible/);
  const table=read("src/components/ui/data-table.tsx");
  assert.match(table,/empty: ReactNode/);
  assert.doesNotMatch(table,/No records to show/);
  assert.match(table,/col\.mobileDetail/);
  assert.match(table,/col\.mobileDetail\?\.canView/);
});
test("RV-02 protects multiple persistent errors from timed queue eviction",()=>{
  const toast=read("src/components/ui/toast.tsx");
  assert.match(toast,/enqueueToast/);
  assert.doesNotMatch(toast,/current\.slice\(-3\)/);
  assert.match(toast,/evictedIds/);
});
test("RV-03 clears parent on capability and disabled transitions",()=>{
  const upload=read("src/components/ui/file-upload.tsx");
  assert.match(upload,/\[pickerUnavailable, disabled\]/);
  assert.match(upload,/onFilesRef\.current\(null\)/);
});
test("RV-04 marker specific Back handling and StrictMode safe effect",()=>{
  const overlay=read("src/components/ui/use-overlay-webview.ts");
  assert.match(overlay,/ownsOverlayHistoryEntry\(event\.state, marker\)/);
  assert.doesNotMatch(overlay,/pendingCleanupPops|queueOverlayCleanupPop/);
  assert.match(overlay,/previouslyOpen\.current/);
});
test("RV-06 immutable baseline waivers, dynamic target detection across tracked UI",()=>{
  const guard=read("scripts/check-ux-anti-drift.mjs");
  assert.match(guard,/ls-files/);
  assert.match(guard,/waiver\.baselineCommit/);
  const rules=read("scripts/ux-guard-rules.mjs");
  assert.match(rules,/isStaticSafeTarget/);
  assert.match(rules,/unsafe-target/);
});
