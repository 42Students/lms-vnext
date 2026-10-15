import { z } from "zod";
import type { ProjectTeam } from "./class-team-split-model";

/** The server must never trust a client-edited team preview. */
export const classTeamPreviewSchema = z.array(z.object({
  name: z.string().trim().min(1).max(120),
  membershipIds: z.array(z.string().uuid()).min(1).max(2000),
}).strict()).min(1).max(2000);

export function verifyClassTeamPreview(
  rawPreview: unknown,
  eligibleMembershipIds: readonly string[],
): ProjectTeam[] {
  const preview = classTeamPreviewSchema.parse(rawPreview);
  const allowed = new Set(eligibleMembershipIds);
  if (allowed.size !== eligibleMembershipIds.length) {
    throw new Error("Duplicate eligible membership");
  }
  const seen = new Set<string>();
  const names = new Set<string>();
  for (const group of preview) {
    const key = group.name.toLocaleLowerCase();
    if (names.has(key)) throw new Error("Duplicate team name");
    names.add(key);
    for (const membershipId of group.membershipIds) {
      if (!allowed.has(membershipId)) throw new Error("Team includes an ineligible learner");
      if (seen.has(membershipId)) throw new Error("Learner appears in multiple teams");
      seen.add(membershipId);
    }
  }
  if (seen.size !== allowed.size) {
    throw new Error("Every eligible learner must be assigned exactly once");
  }
  return preview;
}
