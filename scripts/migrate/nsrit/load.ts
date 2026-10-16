/**
 * NSRIT legacy -> vNext loader: stage 2a (foundation + people, default) and
 * stage 2b-i (academics, --stage=2b; needs stage 2a applied first) and stage 2b-ii
 * (placements, projects, learner in-app notifications, --stage=2bii; needs 2a and 2b).
 *
 *   tsx scripts/migrate/nsrit/load.ts --snapshot=<dir>                 dry-run (default)
 *   tsx scripts/migrate/nsrit/load.ts --snapshot=<dir> --apply         write
 *   tsx scripts/migrate/nsrit/load.ts --snapshot=<dir> --rollback=<batch-id>
 *   tsx scripts/migrate/nsrit/load.ts --snapshot=<dir> --stage=2b [--apply]
 *   tsx scripts/migrate/nsrit/load.ts --snapshot=<dir> --stage=2bii [--apply]
 *
 * Options: --out=<report dir> (default <snapshot>/reports), --allow-remote-dev,
 * --stage=2a|2b|2bii, --rehearsal-keep-demo (local rehearsal only: keeps the
 * "Demo Attendance Session" schedule rows that real-data-only mode rejects).
 * Roll back stage 2b-ii before 2b-i and 2b-i before 2a (later stages reference earlier rows).
 * Environment: DATABASE_URL (required), ALLOW_NSRIT_IMPORT=I_ACCEPT for
 * --apply/--rollback. A non-loopback database additionally needs
 * --allow-remote-dev and ALLOW_NSRIT_REMOTE_DEV (do not use outside dev).
 *
 * The loader reads ONLY the verified snapshot (manifest hashes must match),
 * performs plain SQL writes on an allowlist of tables, and never writes
 * outbox, notification or messaging rows. Reports contain counts and masked
 * references only.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { LOADER_VERSION, LOADER_VERSION_2B, LOADER_VERSION_2BII, nsritId } from "./common";
import {
  LoadContext,
  LoadAbort,
  NSRIT_COLLEGE_ID,
  createBatch,
  finishBatch,
  findExternalConflicts,
  guardedTx,
  loadAcademics,
  loadFoundation,
  loadPeople,
  preflight,
  rollbackBatch,
  validate,
  type Tx,
  type Validation,
} from "./db";
import {
  GuardError,
  assertApplyAllowed,
  assertTargetAllowed,
  safeErrorMessage,
} from "./guards";
import { buildPlan, type Plan } from "./plan";
import { loadAcademics2b, preflightAcademics, validateAcademics } from "./db-academics";
import { findExistingCompanies, loadPlacementsProjects2bii, preflight2bii, validate2bii } from "./db-2bii";
import { buildPlan2bii } from "./plan-2bii";
import { reconcile2bii, type Reconciliation2bii } from "./reconcile-2bii";
import { buildReconciliation2bii, reconciliationMarkdown2bii, rejectionReportMarkdown2bii } from "./reports-2bii";
import { buildAcademicsPlan } from "./plan-academics";
import { compareFacts, computeVnextFacts, type ReconciliationOutcome } from "./reconcile";
import {
  academicsReconciliationMarkdown,
  academicsRejectionReportMarkdown,
  buildAcademicsReconciliation,
} from "./reports-academics";
import {
  buildReconciliation,
  reconciliationMarkdown,
  rejectionReportMarkdown,
  reviewListCsv,
  reviewListMarkdown,
  type LoadCounts,
} from "./reports";
import { readSnapshot } from "./snapshot";

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  return hit.includes("=") ? hit.slice(name.length + 3) : "true";
}

function writeReports(outDir: string, mode: string, plan: Plan, name: string, body: { json: unknown; md: string }) {
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  writeFileSync(path.join(outDir, `${name}-${mode}-${stamp}.json`), JSON.stringify(body.json, null, 2), "utf8");
  writeFileSync(path.join(outDir, `${name}-${mode}-${stamp}.md`), body.md, "utf8");
  writeFileSync(path.join(outDir, "rejected-rows-report.md"), rejectionReportMarkdown(plan), "utf8");
  writeFileSync(path.join(outDir, "contact-review-list.md"), reviewListMarkdown(plan), "utf8");
  writeFileSync(path.join(outDir, "contact-review-list.csv"), reviewListCsv(plan), "utf8");
}

async function main() {
  const started = Date.now();
  const snapshotDir = arg("snapshot");
  if (!snapshotDir) throw new GuardError("--snapshot=<dir> is required");
  const rollbackId = arg("rollback");
  const apply = arg("apply") === "true";
  if (rollbackId && apply) throw new GuardError("Use either --apply or --rollback, not both");
  const mode = rollbackId ? "rollback" : apply ? "apply" : "dry-run";
  const stage = arg("stage") ?? "2a";
  if (stage !== "2a" && stage !== "2b" && stage !== "2bii") throw new GuardError("--stage must be 2a, 2b or 2bii");

  const target = assertTargetAllowed(process.env.DATABASE_URL, {
    allowRemoteDev: arg("allow-remote-dev") === "true",
    env: process.env,
  });
  if (mode !== "dry-run") assertApplyAllowed(process.env);

  // Verify the snapshot BEFORE any connection is opened.
  const snapshot = readSnapshot(path.resolve(snapshotDir));
  const outDir = path.resolve(arg("out") ?? path.join(snapshotDir, "reports"));
  const timings: Record<string, number> = {};
  const tick = (label: string, since: number) => {
    timings[label] = Date.now() - since;
  };
  process.stdout.write(
    `NSRIT loader ${LOADER_VERSION} mode=${mode} target=${target.host}/${target.database} snapshot=${snapshot.manifest.snapshotSha256.slice(0, 12)}\n`,
  );

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const tx = guardedTx(client);

    if (mode === "rollback") {
      const t0 = Date.now();
      await client.query("BEGIN");
      try {
        const deleted = await rollbackBatch(tx, rollbackId!, NSRIT_COLLEGE_ID);
        await client.query("COMMIT");
        tick("rollback", t0);
        process.stdout.write(`rollback ${rollbackId} deleted: ${JSON.stringify(deleted)}\n`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
      return;
    }

    if (stage === "2bii") {
      await runPlacementsProjects({
        client,
        tx,
        snapshot,
        mode: mode as "dry-run" | "apply",
        outDir,
        timings,
        started,
      });
      return;
    }

    if (stage === "2b") {
      await runAcademics({
        client,
        tx,
        snapshot,
        mode: mode as "dry-run" | "apply",
        outDir,
        timings,
        started,
        keepDemo: arg("rehearsal-keep-demo") === "true",
        local: target.local,
      });
      return;
    }

    const plan0 = buildPlan(snapshot);
    const problems = await preflight(client, plan0);
    if (problems.length) throw new LoadAbort(`Preflight failed: ${problems.join("; ")}`);
    const externalConflicts = await findExternalConflicts(client, plan0);
    const plan = buildPlan(snapshot, { externalConflicts });
    const collegeId = plan.college.newId;
    if (collegeId !== NSRIT_COLLEGE_ID) throw new LoadAbort("Unexpected college id derivation");

    const counts: LoadCounts = {};
    const merge = (from: LoadCounts) => {
      for (const [table, c] of Object.entries(from)) {
        const into = (counts[table] ??= { inserted: 0, updated: 0, unchanged: 0 });
        into.inserted += c.inserted;
        into.updated += c.updated;
        into.unchanged += c.unchanged;
      }
    };
    let validation: Validation[] = [];
    let batchId: string | null = null;

    if (mode === "dry-run") {
      const t0 = Date.now();
      await client.query("BEGIN");
      try {
        const ctx = new LoadContext(tx, collegeId, null);
        await loadFoundation(ctx, plan);
        batchId = await createBatch(tx, collegeId, snapshot.manifest.snapshotSha256, "NSRIT stage 2a dry-run");
        await ctx.attachBatch(batchId);
        await loadAcademics(ctx, plan);
        await loadPeople(ctx, plan);
        validation = await validate(ctx, plan);
        merge(ctx.counts);
      } finally {
        await client.query("ROLLBACK");
      }
      tick("dry-run (rolled back)", t0);
      batchId = null;
    } else {
      const t0 = Date.now();
      await client.query("BEGIN");
      let ctx0!: LoadContext;
      try {
        ctx0 = new LoadContext(tx, collegeId, null);
        await loadFoundation(ctx0, plan);
        batchId = await createBatch(tx, collegeId, snapshot.manifest.snapshotSha256, "NSRIT stage 2a");
        await ctx0.attachBatch(batchId);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
      merge(ctx0.counts);
      tick("foundation", t0);
      const t1 = Date.now();
      await client.query("BEGIN");
      try {
        const ctx = new LoadContext(tx, collegeId, batchId);
        await loadAcademics(ctx, plan);
        await loadPeople(ctx, plan);
        validation = await validate(ctx, plan);
        if (validation.some((v) => !v.ok)) {
          throw new LoadAbort(
            `Validation failed: ${validation.filter((v) => !v.ok).map((v) => v.check).join("; ")}`,
          );
        }
        merge(ctx.counts);
        await finishBatch(tx, batchId, "COMPLETED", {
          loaderVersion: LOADER_VERSION,
          tables: counts,
          rejected: plan.rejections.length,
          blockedDuplicate: plan.blocked.length,
          deferred: plan.deferred.length,
        });
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        // Record the failure on the batch in its own transaction.
        await client.query("BEGIN");
        try {
          await finishBatch(tx, batchId, "FAILED", { error: safeErrorMessage(error).slice(0, 300) });
          await client.query("COMMIT");
        } catch {
          await client.query("ROLLBACK");
        }
        throw error;
      }
      tick("academics+people", t1);
    }
    tick("total", started);

    const reconciliation = buildReconciliation(plan, counts, {
      mode: mode as "dry-run" | "apply",
      batchId,
      snapshotSha256: snapshot.manifest.snapshotSha256,
      loaderVersion: LOADER_VERSION,
      validation,
      timingsMs: timings,
    });
    writeReports(outDir, mode, plan, "reconciliation", {
      json: reconciliation,
      md: reconciliationMarkdown(reconciliation),
    });
    process.stdout.write(reconciliationMarkdown(reconciliation));
    if (validation.some((v) => !v.ok)) process.exitCode = 2;
  } finally {
    await client.end();
  }
}

async function runAcademics(args: {
  client: Client;
  tx: Tx;
  snapshot: ReturnType<typeof readSnapshot>;
  mode: "dry-run" | "apply";
  outDir: string;
  timings: Record<string, number>;
  started: number;
  keepDemo: boolean;
  local: boolean;
}) {
  const { client, tx, snapshot, mode, outDir, timings, started } = args;
  if (args.keepDemo && !args.local) throw new GuardError("--rehearsal-keep-demo is only allowed on a local database");
  const base0 = buildPlan(snapshot);
  const externalConflicts = await findExternalConflicts(client, base0);
  const base = buildPlan(snapshot, { externalConflicts });
  const collegeId = base.college.newId;
  if (collegeId !== NSRIT_COLLEGE_ID) throw new LoadAbort("Unexpected college id derivation");
  const asOf = new Date(snapshot.manifest.exportedAt);
  const plan = buildAcademicsPlan(snapshot, base, {
    asOf,
    keepNameJunkFor: args.keepDemo ? ["class_schedule"] : [],
  });
  const problems = await preflightAcademics(client, base, plan);
  const college = await client.query(`SELECT 1 FROM colleges WHERE id = $1`, [collegeId]);
  if (college.rowCount === 0) problems.push("NSRIT college row is missing: apply stage 2a first");
  if (problems.length) throw new LoadAbort(`Preflight failed: ${problems.join("; ")}`);

  const label = `NSRIT stage 2b-i${mode === "dry-run" ? " dry-run" : ""}${args.keepDemo ? " (rehearsal demo rows)" : ""}`;
  let validation: Validation[] = [];
  let derived: ReconciliationOutcome | null = null;
  let batchId: string | null = null;
  const counts: LoadCounts = {};
  const t0 = Date.now();
  await client.query("BEGIN");
  try {
    const bid = await createBatch(tx, collegeId, snapshot.manifest.snapshotSha256, label);
    batchId = bid;
    const ctx = new LoadContext(tx, collegeId, bid);
    await loadAcademics2b(ctx, plan);
    validation = await validateAcademics(ctx, plan);
    derived = compareFacts(plan.legacyFacts, await computeVnextFacts(tx, base, collegeId, asOf.toISOString()));
    for (const [table, c] of Object.entries(ctx.counts)) counts[table] = c;
    if (mode === "apply") {
      if (validation.some((v) => !v.ok)) {
        throw new LoadAbort(`Validation failed: ${validation.filter((v) => !v.ok).map((v) => v.check).join("; ")}`);
      }
      await finishBatch(tx, bid, "COMPLETED", {
        loaderVersion: LOADER_VERSION_2B,
        stage: "2b-i",
        tables: counts,
        rejected: plan.rejections.length,
        deferred: plan.deferred.length,
        derivedMismatches: derived.mismatches.length,
      });
      await client.query("COMMIT");
    } else {
      await client.query("ROLLBACK");
      batchId = null;
    }
  } catch (error) {
    await client.query("ROLLBACK");
    if (mode === "apply" && batchId) {
      await client.query("BEGIN");
      try {
        await finishBatch(tx, batchId, "FAILED", { error: safeErrorMessage(error).slice(0, 300) });
        await client.query("COMMIT");
      } catch {
        await client.query("ROLLBACK");
      }
    }
    throw error;
  }
  timings[mode === "apply" ? "academics apply" : "academics dry-run (rolled back)"] = Date.now() - t0;
  timings.total = Date.now() - started;
  const reconciliation = buildAcademicsReconciliation(plan, counts, {
    mode,
    batchId,
    snapshotSha256: snapshot.manifest.snapshotSha256,
    loaderVersion: LOADER_VERSION_2B,
    validation,
    derived,
    timingsMs: timings,
  });
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  writeFileSync(path.join(outDir, `reconciliation-2b-${mode}-${stamp}.json`), JSON.stringify(reconciliation, null, 2), "utf8");
  writeFileSync(path.join(outDir, `reconciliation-2b-${mode}-${stamp}.md`), academicsReconciliationMarkdown(reconciliation), "utf8");
  writeFileSync(path.join(outDir, "rejected-rows-report-2b.md"), academicsRejectionReportMarkdown(plan), "utf8");
  process.stdout.write(academicsReconciliationMarkdown(reconciliation));
  if (validation.some((v) => !v.ok)) process.exitCode = 2;
}

async function runPlacementsProjects(args: {
  client: Client;
  tx: Tx;
  snapshot: ReturnType<typeof readSnapshot>;
  mode: "dry-run" | "apply";
  outDir: string;
  timings: Record<string, number>;
  started: number;
}) {
  const { client, tx, snapshot, mode, outDir, timings, started } = args;
  const base0 = buildPlan(snapshot);
  const externalConflicts = await findExternalConflicts(client, base0);
  const base = buildPlan(snapshot, { externalConflicts });
  const collegeId = base.college.newId;
  if (collegeId !== NSRIT_COLLEGE_ID) throw new LoadAbort("Unexpected college id derivation");
  const asOf = new Date(snapshot.manifest.exportedAt);

  // Pass 1 finds the companies this loader owns; pass 2 reuses global companies that already exist under other owners.
  const pass1 = buildPlan2bii(snapshot, base, { asOf });
  const owned = new Set(pass1.placements.companies.map((x) => x.newId));
  const externalCompanies = await findExistingCompanies(client, owned);
  const ownIds = new Set([
    ...base.people.map((p) => p.newId),
    ...(snapshot.tables.recruiter ?? []).map((r) => nsritId("users", "recruiter", String(r.id))),
  ]);
  const phones = (snapshot.tables.recruiter ?? []).map((r) => String(r.contact_mobile ?? "")).filter(Boolean);
  const emails = (snapshot.tables.recruiter ?? []).map((r) => String(r.contact_mail ?? "").toLowerCase()).filter(Boolean);
  const externalContacts = { phones: new Set<string>(), emails: new Set<string>() };
  if (phones.length || emails.length) {
    const res = await client.query<{ id: string; phone_e164: string | null; email: string | null }>(
      `SELECT id, phone_e164, lower(email) AS email FROM users WHERE right(coalesce(phone_e164, ''), 10) = ANY($1::text[]) OR lower(email) = ANY($2::text[])`,
      [phones.map((p) => p.replace(/\D/g, "").slice(-10)), emails],
    );
    for (const row of res.rows) {
      if (ownIds.has(row.id)) continue;
      if (row.phone_e164) externalContacts.phones.add(row.phone_e164);
      if (row.email) externalContacts.emails.add(row.email);
    }
  }
  const plan = buildPlan2bii(snapshot, base, { asOf, externalCompanies, externalContacts });
  const problems = await preflight2bii(client, plan);
  if (problems.length) throw new LoadAbort(`Preflight failed: ${problems.join("; ")}`);

  const label = `NSRIT stage 2b-ii${mode === "dry-run" ? " dry-run" : ""}`;
  let validation: Validation[] = [];
  let derived: Reconciliation2bii | null = null;
  let batchId: string | null = null;
  const counts: LoadCounts = {};
  const t0 = Date.now();
  await client.query("BEGIN");
  try {
    const bid = await createBatch(tx, collegeId, snapshot.manifest.snapshotSha256, label, LOADER_VERSION_2BII);
    batchId = bid;
    const ctx = new LoadContext(tx, collegeId, bid);
    await loadPlacementsProjects2bii(ctx, plan);
    validation = await validate2bii(ctx, plan);
    derived = await reconcile2bii(tx, plan, collegeId);
    for (const [table, c] of Object.entries(ctx.counts)) counts[table] = c;
    if (mode === "apply") {
      if (validation.some((v) => !v.ok)) {
        throw new LoadAbort(`Validation failed: ${validation.filter((v) => !v.ok).map((v) => v.check).join("; ")}`);
      }
      await finishBatch(tx, bid, "COMPLETED", {
        loaderVersion: LOADER_VERSION_2BII,
        stage: "2b-ii",
        tables: counts,
        rejected: plan.rejections.length,
        derivedMismatches: derived.mismatches.length,
      });
      await client.query("COMMIT");
    } else {
      await client.query("ROLLBACK");
      batchId = null;
    }
  } catch (error) {
    await client.query("ROLLBACK");
    if (mode === "apply" && batchId) {
      await client.query("BEGIN");
      try {
        await finishBatch(tx, batchId, "FAILED", { error: safeErrorMessage(error).slice(0, 300) });
        await client.query("COMMIT");
      } catch {
        await client.query("ROLLBACK");
      }
    }
    throw error;
  }
  timings[mode === "apply" ? "placements+projects apply" : "placements+projects dry-run (rolled back)"] = Date.now() - t0;
  timings.total = Date.now() - started;
  const reconciliation = buildReconciliation2bii(plan, counts, {
    mode,
    batchId,
    snapshotSha256: snapshot.manifest.snapshotSha256,
    loaderVersion: LOADER_VERSION_2BII,
    validation,
    derived,
    timingsMs: timings,
  });
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  writeFileSync(path.join(outDir, `reconciliation-2bii-${mode}-${stamp}.json`), JSON.stringify(reconciliation, null, 2), "utf8");
  writeFileSync(path.join(outDir, `reconciliation-2bii-${mode}-${stamp}.md`), reconciliationMarkdown2bii(reconciliation), "utf8");
  writeFileSync(path.join(outDir, "rejected-rows-report-2bii.md"), rejectionReportMarkdown2bii(plan), "utf8");
  process.stdout.write(reconciliationMarkdown2bii(reconciliation));
  if (validation.some((v) => !v.ok)) process.exitCode = 2;
}

main().catch((error) => {
  process.stderr.write(`NSRIT loader stopped: ${safeErrorMessage(error)}\n`);
  process.exitCode = 1;
});
