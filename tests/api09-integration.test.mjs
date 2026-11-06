// API-09-P02: Operations, notifications and outbound integration gate.
// Source-only — no database needed.
// Verifies crosswalk completeness, MAPPED file existence, auth guard coverage,
// and MISSING gap catalogue integrity for the 45 API-09 legacy endpoints.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const crosswalkPath = path.join(root, "docs/planning/api-crosswalk-api09.json");
const crosswalk = JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
const { summary, endpoints, missingGapNotes } = crosswalk;

const FROZEN_SHA = "21bad59d4dfaf2fa11fdeaf9353327ce105697d5";
const EXPECTED_TOTAL = 45;
const EXPECTED_MISSING = 15;

test("API-09 crosswalk summary integrity", () => {
  assert.equal(crosswalk.milestoneId, "API-09");
  assert.equal(summary.total, EXPECTED_TOTAL, `Expected ${EXPECTED_TOTAL} total endpoints`);
  const computed = summary.mapped + summary.redesigned + summary.retired + summary.missing;
  assert.equal(computed, summary.total,
    `Summary counts (${computed}) must equal total (${summary.total})`);
  assert.equal(summary.missing, EXPECTED_MISSING, `Expected ${EXPECTED_MISSING} missing endpoints`);
});

test("API-09 all 45 legacy endpoints have a disposition", () => {
  assert.equal(endpoints.length, EXPECTED_TOTAL,
    `Expected ${EXPECTED_TOTAL} endpoint entries, got ${endpoints.length}`);
  const valid = ["MAPPED", "REDESIGNED", "RETIRED", "MISSING"];
  for (const ep of endpoints) {
    assert.ok(valid.includes(ep.disposition),
      `${ep.legacyPath} has invalid disposition: ${ep.disposition}`);
  }
});

test("API-09 all MAPPED endpoints verified on disk", () => {
  const mapped = endpoints.filter(e => e.disposition === "MAPPED");
  assert.equal(mapped.length, summary.mapped,
    `MAPPED count mismatch: summary says ${summary.mapped}, found ${mapped.length}`);
  for (const ep of mapped) {
    assert.ok(ep.vNextPath, `MAPPED endpoint ${ep.legacyPath} missing vNextPath`);
    const full = path.join(root, ep.vNextPath);
    assert.ok(fs.existsSync(full),
      `MAPPED endpoint ${ep.legacyPath} → ${ep.vNextPath} does not exist on disk`);
  }
});

test("API-09 notification routes have auth guard", () => {
  // Scan notification route files for isSameOriginRequest or getCurrentRequestContext
  const notifDir = path.join(root, "src/app/api/notifications");
  const routeFiles = [];
  function collectRoutes(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) collectRoutes(path.join(dir, entry.name));
      else if (entry.name === "route.ts") routeFiles.push(path.join(dir, entry.name));
    }
  }
  collectRoutes(notifDir);
  assert.ok(routeFiles.length > 0, "No notification route.ts files found");

  let unguarded = [];
  for (const f of routeFiles) {
    const src = fs.readFileSync(f, "utf8");
    const hasMutation = /export async function (POST|PUT|PATCH|DELETE)/.test(src);
    if (hasMutation) {
      const hasGuard = src.includes("isSameOriginRequest") ||
        src.includes("getCurrentRequestContext") ||
        src.includes("requireAuth");
      if (!hasGuard) unguarded.push(path.relative(root, f));
    }
  }
  assert.deepEqual(unguarded, [],
    `Notification routes with mutations but no auth guard: ${unguarded.join(", ")}`);
});

test("API-09 tenant-scoped notification routes use college context", () => {
  const tenantScoped = endpoints.filter(e => e.tenantScoped && e.disposition === "MAPPED" && e.vNextPath);
  for (const ep of tenantScoped) {
    const full = path.join(root, ep.vNextPath);
    if (!fs.existsSync(full)) continue;
    const src = fs.readFileSync(full, "utf8");
    const hasTenantCtx = src.includes("getCurrentRequestContext") ||
      src.includes("collegeId") || src.includes("tenantId") || src.includes("context");
    assert.ok(hasTenantCtx,
      `Tenant-scoped route ${ep.vNextPath} has no tenant context usage`);
  }
});

test("API-09 remaining 15 missing endpoints documented with gap reasons", () => {
  const missing = endpoints.filter(e => e.disposition === "MISSING");
  assert.equal(missing.length, EXPECTED_MISSING,
    `Expected ${EXPECTED_MISSING} MISSING entries, got ${missing.length}`);
  for (const ep of missing) {
    assert.ok(ep.notes && ep.notes.length > 10,
      `MISSING endpoint ${ep.legacyPath} has insufficient gap notes`);
    assert.equal(ep.vNextPath, null,
      `MISSING endpoint ${ep.legacyPath} should have null vNextPath`);
  }
  // Verify gap notes document the major clusters
  assert.ok(missingGapNotes, "missingGapNotes array must exist");
  assert.ok(missingGapNotes.length >= 5, "At least 5 gap clusters must be documented");
  const notesText = missingGapNotes.join(" ");
  assert.ok(notesText.includes("notification-delivery") || notesText.includes("AdminNotificationDelivery"),
    "Admin notification delivery gap cluster must be documented");
  assert.ok(notesText.includes("sms") || notesText.includes("AdminSmsLog"),
    "SMS log gap cluster must be documented");
  assert.ok(notesText.includes("pin") || notesText.includes("Announcement"),
    "Announcement pin/unpin gap must be documented");
});

test("API-09 discussions redesign note present (scoped to course deliveries)", () => {
  const discussionEndpoints = endpoints.filter(e =>
    e.legacyController === "DiscussionController");
  assert.ok(discussionEndpoints.length > 0, "DiscussionController endpoints must be in crosswalk");
  // All discussion endpoints must be REDESIGNED — not mapped to a top-level /discussions resource
  for (const ep of discussionEndpoints) {
    assert.equal(ep.disposition, "REDESIGNED",
      `Discussion endpoint ${ep.legacyPath} should be REDESIGNED (scoped to deliveries/lesson content in vNext)`);
    assert.ok(ep.notes && ep.notes.length > 10,
      `Discussion endpoint ${ep.legacyPath} redesign must have descriptive notes`);
  }
  // At least one note must explicitly mention delivery scoping
  const hasDeliveryNote = discussionEndpoints.some(ep =>
    ep.notes.toLowerCase().includes("deliver") ||
    ep.notes.toLowerCase().includes("scoped") ||
    ep.notes.toLowerCase().includes("threaded") ||
    ep.notes.toLowerCase().includes("context") ||
    ep.notes.toLowerCase().includes("lesson")
  );
  assert.ok(hasDeliveryNote, "At least one discussion endpoint note must mention delivery/lesson/context scoping");
});

test("API-09 frozen legacy SHA matches expected", () => {
  assert.equal(crosswalk.frozenLegacySha, FROZEN_SHA,
    "frozenLegacySha must match canonical value");
});

test("API-09 unread list and stats are authenticated persisted-query redesigns", () => {
  const routePath = "src/app/api/notifications/route.ts";
  const src = fs.readFileSync(path.join(root,routePath),"utf8");
  const lookup = suffix => endpoints.find(e =>
    e.legacyMethod==="GET" && e.legacyPath==="/api/v1/notifications/"+suffix);
  for(const suffix of ["unread","unread-count"]){
    const row=lookup(suffix);
    assert.ok(row,"missing legacy notification "+suffix);
    assert.equal(row.disposition,"REDESIGNED");
    assert.equal(row.vNextPath,routePath);
    assert.equal(row.vNextMethod,"GET");
    assert.equal(row.authGuard,"getCurrentRequestContext");
    assert.equal(row.tenantScoped,true);
    assert.ok(row.notes.includes("no-store"));
  }
  // The query-backed contracts are real, not cosmetic aliases or SSE guesses.
  for(const fragment of [
    "await getCurrentRequestContext()",
    'unreadOnlyValue==="true"',
    'if(view==="stats")',
    "await countOwnUnreadNotifications(context)",
    "await listOwnNotifications(",
    '"Cache-Control":"private, no-store"',
  ])assert.ok(src.includes(fragment)||(fragment==="await getCurrentRequestContext()"&&src.includes("@/security/route")),"Missing notification auth/data contract: "+fragment);
});

test("API-09 skill categories and search are bounded, authorized DB10-gated redesigns",()=>{
  const route="src/app/api/skills/route.ts";
  const skillSrc=fs.readFileSync(path.join(root,route),"utf8");
  const parserSrc=fs.readFileSync(path.join(root,"src/modules/skills/catalog-validation.ts"),"utf8");
  for(const [suffix,mode] of [["categories","categories"],["search","search"]]){
    const record=endpoints.find(e=>e.legacyMethod==="GET"&&
      e.legacyPath==="/api/v1/skills/"+suffix);
    assert.ok(record,"Absent legacy skills "+suffix);
    assert.equal(record.disposition,"REDESIGNED");
    assert.equal(record.vNextPath,route);
    assert.equal(record.vNextMethod,"GET");
    assert.equal(record.authGuard,"getCurrentRequestContext");
    assert.ok(record.notes.includes("mode="+mode));
    assert.ok(record.notes.includes("503"),"Schema-ready gating must remain explicit");
    assert.ok(record.notes.includes("no direct legacy URL alias"));
  }
  for(const fragment of [
    'mode: z.enum(["search", "popular", "categories", "category"])',
    'query: z.string().trim().max(80)',
    'limit: z.coerce.number().int().min(1).max(50)',
  ])assert.ok(parserSrc.includes(fragment),"Missing bounded catalog input: "+fragment);
  for(const fragment of [
    "skillsCatalogRuntimeEnabled()",
    "await getCurrentRequestContext()",
    "canReadSkillCatalog(context)",
    "const input = parseSkillCatalogQuery(normalizedParams)",
    "const result = await readSkillCatalog(input)",
    'input.mode === "categories"',
  ])assert.ok(skillSrc.includes(fragment),"Missing authenticated skill catalog contract: "+fragment);
});
