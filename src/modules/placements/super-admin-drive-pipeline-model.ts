import { hiringFunnel, type HiringStageCounts } from "@/modules/admin-ui/super-admin-hiring-funnel-model";

export function projectSuperAdminDrivePipeline(rows: readonly {stage: string; total: number}[]) {
  const counts: HiringStageCounts = {
    applied: 0, shortlisted: 0, assessment: 0,
    interview: 0, offered: 0, hired: 0,
  };
  let rejected = 0;
  let waitlisted = 0;
  for (const row of rows) {
    if (!Number.isSafeInteger(row.total) || row.total < 0) {
      throw new Error("Invalid persisted placement stage totals");
    }
    const key = row.stage.toLowerCase() as keyof HiringStageCounts;
    if (Object.prototype.hasOwnProperty.call(counts, key)) {
      counts[key] += row.total;
    } else if (row.stage === "REJECTED") {
      rejected += row.total;
    } else if (row.stage === "WAITLISTED") {
      waitlisted += row.total;
    }
  }
  return {
    counts, rejected, waitlisted,
    total: Object.values(counts).reduce((sum, n) => sum + n, 0) + rejected + waitlisted,
    // Six independent CURRENT-status buckets, not cumulative conversions.
    // Do not imply a prior-stage drop-off when an applicant has already moved.
    // Legacy pipeline is a six-stage, current-status snapshot, not a
    // conversion/drop-off chart. Consumers must never infer completion rates.
    snapshotOnly: true as const,
    funnel: hiringFunnel(counts).map(stage => ({
      key:stage.key,label:stage.label,count:stage.count,
      percentPrevious:null,
    })),
  };
}
