import { z } from "zod";
import { placementReportCsv } from "./report-model";

export const tpoBranchSeasonQuerySchema = z.object({
  seasonId: z.string().uuid().optional(),
}).strict();

export type BranchMembershipFact = {
  membershipId: string;
  departmentId: string;
  departmentName: string;
};
export type BranchApplicationFact = {
  id: string;
  membershipId: string;
};
export type BranchOfferFact = {
  id: string;
  applicationId: string;
  status: string;
};
export type BranchRegistrationFact = { membershipId: string };
export type BranchSeasonRow = {
  departmentId: string | null;
  departmentName: string;
  applicants: number;
  acceptedLearners: number;
  acceptedOfferVersions: number;
  acceptedPerApplicantPercent: number | null;
  registered: number | null;
  registeredPlaced: number | null;
  placedPerRegisteredPercent: number | null;
};

function percent(numerator: number, denominator: number | null): number | null {
  if (denominator === null || denominator === 0) return null;
  return Math.round(numerator / denominator * 10000) / 100;
}

/** Branch is determined from exactly one current department; ambiguity is visible. */
export function projectTpoBranchSeason(
  memberships: readonly BranchMembershipFact[],
  applications: readonly BranchApplicationFact[],
  offers: readonly BranchOfferFact[],
  registrations: readonly BranchRegistrationFact[] | null,
): BranchSeasonRow[] {
  const departments = new Map<string, { name: string; members: Set<string> }>();
  const membershipBranches = new Map<string, Set<string>>();
  for (const item of memberships) {
    const branch = departments.get(item.departmentId) ?? {
      name: item.departmentName, members: new Set<string>(),
    };
    branch.members.add(item.membershipId);
    departments.set(item.departmentId, branch);
    const choices = membershipBranches.get(item.membershipId) ?? new Set<string>();
    choices.add(item.departmentId);
    membershipBranches.set(item.membershipId, choices);
  }
  const applicantId = new Map(applications.map((item) => [item.id, item.membershipId]));
  const applicantMembers = new Set(applications.map((item) => item.membershipId));
  const accepted = offers.filter((offer) => offer.status === "ACCEPTED");
  const placedMembers = new Set(accepted.map((offer) => applicantId.get(offer.applicationId))
    .filter((value): value is string => value !== undefined));
  const registeredMembers = registrations
    ? new Set(registrations.map((item) => item.membershipId)) : null;
  const everyone = new Set([
    ...applicantMembers, ...placedMembers, ...(registeredMembers ?? []),
  ]);
  const buckets = new Map<string | null, Set<string>>();
  for (const member of everyone) {
    const scopes = membershipBranches.get(member);
    const key = scopes?.size === 1 ? (scopes.values().next().value ?? null) : null;
    const bucket = buckets.get(key) ?? new Set<string>();
    bucket.add(member);
    buckets.set(key, bucket);
  }
  const keys = new Set<string | null>([...departments.keys(), ...buckets.keys()]);
  const rows = [...keys].map((key) => {
    const members = buckets.get(key) ?? new Set<string>();
    const applicantCount = [...members].filter((id) => applicantMembers.has(id)).length;
    const placedCount = [...members].filter((id) => placedMembers.has(id)).length;
    const acceptedOfferCount = accepted.filter((offer) => {
      const member = applicantId.get(offer.applicationId);
      return member !== undefined && members.has(member);
    }).length;
    const registeredCount = registeredMembers === null
      ? null : [...members].filter((id) => registeredMembers.has(id)).length;
    const registeredPlaced = registeredMembers === null ? null :
      [...members].filter((id) => placedMembers.has(id) && registeredMembers.has(id)).length;
    return {
      departmentId: key,
      departmentName: key === null
        ? "Unknown / multiple current branches"
        : departments.get(key)?.name ?? "Unnamed branch",
      applicants: applicantCount,
      acceptedLearners: placedCount,
      acceptedOfferVersions: acceptedOfferCount,
      acceptedPerApplicantPercent: percent(
        [...members].filter((id) => applicantMembers.has(id) && placedMembers.has(id)).length,
        applicantCount,
      ),
      registered: registeredCount,
      registeredPlaced,
      placedPerRegisteredPercent: registeredPlaced === null
        ? null : percent(registeredPlaced, registeredCount),
    };
  });
  return rows.sort((a, b) => a.departmentName.localeCompare(b.departmentName));
}

export function tpoBranchSeasonCsv(
  seasonName: string,
  rows: readonly BranchSeasonRow[],
): string {
  return placementReportCsv([
    "Season", "Branch", "Unique applicants", "Unique accepted learners",
    "Accepted offer versions", "Accepted applicants / applicants (%)",
    "Persisted registered pool", "Accepted registered learners",
    "Registered placement rate (%)",
  ], rows.map((r) => [
    seasonName, r.departmentName, r.applicants, r.acceptedLearners,
    r.acceptedOfferVersions, r.acceptedPerApplicantPercent,
    r.registered, r.registeredPlaced, r.placedPerRegisteredPercent,
  ]));
}
