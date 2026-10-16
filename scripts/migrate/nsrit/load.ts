/**
 * NSRIT legacy -> vNext loader, stage 2a (foundation + people).
 *
 *   tsx scripts/migrate/nsrit/load.ts --snapshot=<dir>                 dry-run (default)
 *   tsx scripts/migrate/nsrit/load.ts --snapshot=<dir> --apply         write
 *   tsx scripts/migrate/nsrit/load.ts --snapshot=<dir> --rollback=<batch-id>
 *
 * Options: --out=<report dir> (default <snapshot>/reports), --allow-remote-dev.
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
import { LOADER_VERSION } from "./common";
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
  type Validation,
} from "./db";
import {
  GuardError,
  assertApplyAllowed,
  assertTargetAllowed,
  safeErrorMessage,
} from "./guards";
import { buildPlan, type Plan } from "./plan";
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

main().catch((error) => {
  process.stderr.write(`NSRIT loader stopped: ${safeErrorMessage(error)}\n`);
  process.exitCode = 1;
});
