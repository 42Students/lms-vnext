/**
 * Additive, pure projections for the remaining TPO reports.
 * Neither model reads a database, clock or browser state.
 */

export type PlacementFailureKind =
  | "SCREENING_REJECTED"
  | "ROUND_FAILED"
  | "APPLICATION_WITHDRAWN"
  | "OFFER_DECLINED"
  | "OFFER_WITHDRAWN";

export const FAILURE_KIND_LABELS: Record<
  PlacementFailureKind,
  string
> = {
  SCREENING_REJECTED: "Screening rejected",
  ROUND_FAILED: "Round failed",
  APPLICATION_WITHDRAWN: "Application withdrawn",
  OFFER_DECLINED: "Offer declined",
  OFFER_WITHDRAWN: "Offer withdrawn",
};

export type PlacementFailureFact = {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  kind: PlacementFailureKind;
  reason: string | null;
};

export type PlacementFailureReasonRow = {
  kind: PlacementFailureKind;
  reason: string;
  count: number;
};

export type PlacementFailureDriveRow =
  PlacementFailureReasonRow & {
    jobId: string;
    jobTitle: string;
    companyName: string;
  };

export type PlacementFailureReport = {
  total: number;
  byKind: {
    kind: PlacementFailureKind;
    count: number;
  }[];
  byReason: PlacementFailureReasonRow[];
  byDrive: PlacementFailureDriveRow[];
};

export function normalizePlacementFailureReason(
  reason: string | null | undefined,
): string {
  return reason?.trim().replace(/\s+/g, " ") ||
    "Reason not recorded";
}

export function summarizePlacementFailureReasons(
  facts: readonly PlacementFailureFact[],
): PlacementFailureReport {
  const byKind = new Map<PlacementFailureKind, number>();
  const byReason =
    new Map<string, PlacementFailureReasonRow>();
  const byDrive =
    new Map<string, PlacementFailureDriveRow>();
  const seen = new Set<string>();

  for (const fact of facts) {
    // Multiple joins must not multiply the same persisted
    // status event or current screening/round outcome.
    const identity = `${fact.kind}\u0000${fact.id}`;
    if (seen.has(identity)) continue;
    seen.add(identity);

    const reason =
      normalizePlacementFailureReason(fact.reason);
    const reasonKey =
      `${fact.kind}\u0000${reason}`;
    const driveKey =
      `${fact.jobId}\u0000${reasonKey}`;

    byKind.set(
      fact.kind,
      (byKind.get(fact.kind) ?? 0) + 1,
    );

    const existingReason = byReason.get(reasonKey);
    if (existingReason) {
      existingReason.count += 1;
    } else {
      byReason.set(reasonKey, {
        kind: fact.kind,
        reason,
        count: 1,
      });
    }

    const existingDrive = byDrive.get(driveKey);
    if (existingDrive) {
      existingDrive.count += 1;
    } else {
      byDrive.set(driveKey, {
        jobId: fact.jobId,
        jobTitle: fact.jobTitle,
        companyName: fact.companyName,
        kind: fact.kind,
        reason,
        count: 1,
      });
    }
  }

  return {
    total: seen.size,
    byKind: [...byKind.entries()]
      .map(([kind, count]) => ({ kind, count }))
      .sort((a, b) =>
        a.kind.localeCompare(b.kind),
      ),
    byReason: [...byReason.values()]
      .sort(
        (a, b) =>
          b.count - a.count ||
          a.kind.localeCompare(b.kind) ||
          a.reason.localeCompare(b.reason),
      ),
    byDrive: [...byDrive.values()]
      .sort(
        (a, b) =>
          a.companyName.localeCompare(b.companyName) ||
          a.jobTitle.localeCompare(b.jobTitle) ||
          a.kind.localeCompare(b.kind) ||
          a.reason.localeCompare(b.reason) ||
          a.jobId.localeCompare(b.jobId),
      ),
  };
}

export type PlacementLeadReportFact = {
  id: string;
  manualStage: string;
  source: string | null;
  invited: boolean;
  inviteClicked: boolean;
  recruiterAccountLinked: boolean;
  companyRelationshipLinked: boolean;
};

export type PlacementLeadCounts = {
  leads: number;
  invited: number;
  inviteClicked: number;
  recruiterAccountsLinked: number;
  companyRelationshipsLinked: number;
  recruiterLinkRatePercent: number | null;
};

export type PlacementLeadGroupRow =
  PlacementLeadCounts & {
    label: string;
  };

export type PlacementLeadsReport = {
  totals: PlacementLeadCounts;
  byStage: PlacementLeadGroupRow[];
  bySource: PlacementLeadGroupRow[];
};

type MutableLeadCounts = Omit<
  PlacementLeadCounts,
  "recruiterLinkRatePercent"
>;

function emptyLeadCounts(): MutableLeadCounts {
  return {
    leads: 0,
    invited: 0,
    inviteClicked: 0,
    recruiterAccountsLinked: 0,
    companyRelationshipsLinked: 0,
  };
}

function addLead(
  counts: MutableLeadCounts,
  lead: PlacementLeadReportFact,
) {
  counts.leads += 1;
  if (lead.invited) counts.invited += 1;
  if (lead.inviteClicked) counts.inviteClicked += 1;
  if (lead.recruiterAccountLinked) {
    counts.recruiterAccountsLinked += 1;
  }
  if (lead.companyRelationshipLinked) {
    counts.companyRelationshipsLinked += 1;
  }
}

function finalizeLeadCounts(
  counts: MutableLeadCounts,
): PlacementLeadCounts {
  return {
    ...counts,
    recruiterLinkRatePercent:
      counts.leads === 0
        ? null
        : Math.round(
            (counts.recruiterAccountsLinked /
              counts.leads) *
              100,
          ),
  };
}

export function summarizePlacementLeads(
  facts: readonly PlacementLeadReportFact[],
): PlacementLeadsReport {
  const seen = new Set<string>();
  const totals = emptyLeadCounts();
  const stageGroups =
    new Map<string, MutableLeadCounts>();
  const sourceGroups =
    new Map<string, MutableLeadCounts>();

  for (const lead of facts) {
    if (seen.has(lead.id)) continue;
    seen.add(lead.id);

    const stage = lead.manualStage;
    const source =
      lead.source?.trim() || "Not recorded";

    addLead(totals, lead);

    let stageCounts = stageGroups.get(stage);
    if (!stageCounts) {
      stageCounts = emptyLeadCounts();
      stageGroups.set(stage, stageCounts);
    }
    addLead(stageCounts, lead);

    let sourceCounts = sourceGroups.get(source);
    if (!sourceCounts) {
      sourceCounts = emptyLeadCounts();
      sourceGroups.set(source, sourceCounts);
    }
    addLead(sourceCounts, lead);
  }

  const rows = (
    groups: ReadonlyMap<string, MutableLeadCounts>,
  ): PlacementLeadGroupRow[] =>
    [...groups.entries()]
      .map(([label, counts]) => ({
        label,
        ...finalizeLeadCounts(counts),
      }))
      .sort(
        (a, b) =>
          b.leads - a.leads ||
          a.label.localeCompare(b.label),
      );

  return {
    totals: finalizeLeadCounts(totals),
    byStage: rows(stageGroups),
    bySource: rows(sourceGroups),
  };
}
