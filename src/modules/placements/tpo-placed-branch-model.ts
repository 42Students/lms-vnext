import { placementReportCsv } from "./report-model";

export type PlacedOfferEvidence = {
  id: string; membershipId: string; status: string; joiningStatus: string | null;
};
export type PlacedBranchEvidence = {
  membershipId: string; departmentId: string; departmentName: string;
};
export type PlacedBranchRow = {
  departmentId: string | null; departmentName: string;
  placed: number; joined: number; acceptedOfferVersions: number;
};
export type PlacedBranchResult = {
  totals: { placed: number; joined: number; acceptedOfferVersions: number };
  rows: PlacedBranchRow[];
};

/** Each learner is counted once, regardless of multiple accepted offer versions. */
export function projectTpoPlacedStudentsByBranch(
  offers: readonly PlacedOfferEvidence[], branches: readonly PlacedBranchEvidence[],
): PlacedBranchResult {
  const uniqueOffers = [...new Map(offers.map((offer) => [offer.id, offer])).values()];
  const branchByMember = new Map<string, PlacedBranchEvidence>();
  for (const branch of branches) {
    if (!branchByMember.has(branch.membershipId)) branchByMember.set(branch.membershipId, branch);
  }
  const grouped = new Map<string, {
    departmentId: string | null; departmentName: string;
    placed: Set<string>; joined: Set<string>; offerVersions: Set<string>;
  }>();
  const accepted = uniqueOffers.filter((offer) => offer.status === "ACCEPTED");
  for (const offer of accepted) {
    const branch = branchByMember.get(offer.membershipId);
    const key = branch?.departmentId ?? "UNASSIGNED";
    let item = grouped.get(key);
    if (!item) {
      item = { departmentId: branch?.departmentId ?? null,
        departmentName: branch?.departmentName ?? "Unassigned branch",
        placed: new Set(), joined: new Set(), offerVersions: new Set() };
      grouped.set(key, item);
    }
    item.placed.add(offer.membershipId);
    item.offerVersions.add(offer.id);
    if (offer.joiningStatus === "JOINED") item.joined.add(offer.membershipId);
  }
  return {
    totals: {
      placed: new Set(accepted.map((offer) => offer.membershipId)).size,
      joined: new Set(accepted.filter((offer) => offer.joiningStatus === "JOINED")
        .map((offer) => offer.membershipId)).size,
      acceptedOfferVersions: accepted.length,
    },
    rows: [...grouped.values()].map((item) => ({
      departmentId: item.departmentId, departmentName: item.departmentName,
      placed: item.placed.size, joined: item.joined.size,
      acceptedOfferVersions: item.offerVersions.size,
    })).sort((a,b) => a.departmentName.localeCompare(b.departmentName) ||
      (a.departmentId ?? "").localeCompare(b.departmentId ?? "")),
  };
}

export const TPO_PLACED_BRANCH_CSV_LIMIT = 200;
export function tpoPlacedBranchCsv(seasonName: string, report: PlacedBranchResult) {
  const truncated = report.rows.length > TPO_PLACED_BRANCH_CSV_LIMIT;
  const body: (string | number | null)[][] = [
    ["Season total", seasonName, report.totals.placed, report.totals.joined,
      report.totals.acceptedOfferVersions],
    ...report.rows.slice(0, TPO_PLACED_BRANCH_CSV_LIMIT).map((row) => [
      "Branch", row.departmentName, row.placed, row.joined, row.acceptedOfferVersions,
    ]),
    ["Methodology", "Unique learners with current ACCEPTED offers in the selected season; joined requires an explicit JOINED outcome on an accepted offer. Branch uses current active academic enrollment, not a historical snapshot.", null, null, null],
  ];
  if (truncated) body.push(["TRUNCATED",
    `First ${TPO_PLACED_BRANCH_CSV_LIMIT} of ${report.rows.length} branch rows exported; full season totals retained.`,
    null, null, null]);
  return {
    csv: placementReportCsv(["Scope","Season or branch","Placed learners",
      "Confirmed joined learners","Accepted offer versions"], body),
    truncated,
  };
}
