import { z } from "zod";
import type { ProjectTeam } from "./class-team-split-model";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function planClassTeamWorkspaceNames(baseTitle: string, baseSlug: string, teams: readonly ProjectTeam[]) {
  const title = z.string().trim().min(1).max(170).parse(baseTitle);
  const slug = z.string().trim().min(1).max(50).regex(slugPattern).parse(baseSlug);
  if (teams.length === 0 || teams.length > 2000) throw new Error("Invalid team count");
  const countWidth = String(teams.length).length;
  const seen = new Set<string>();
  const seenMembers = new Set<string>();
  const seenNames = new Set<string>();
  return teams.map((team, index) => {
    const teamName = z.string().trim().min(1).max(120).parse(team.name);
    if (team.membershipIds.length === 0) throw new Error("Cannot create an empty workspace");
    if (seenNames.has(teamName.toLocaleLowerCase("en-IN"))) throw new Error("Duplicate team name");
    seenNames.add(teamName.toLocaleLowerCase("en-IN"));
    for (const memberId of team.membershipIds) {
      z.string().uuid().parse(memberId);
      if (seenMembers.has(memberId)) throw new Error("Learner appears in multiple teams");
      seenMembers.add(memberId);
    }
    const suffix = String(index + 1).padStart(countWidth, "0");
    const workspaceSlug = `${slug}-team-${suffix}`;
    if (workspaceSlug.length > 64) throw new Error("Workspace slug too long");
    if (seen.has(workspaceSlug)) throw new Error("Duplicate workspace slug");
    seen.add(workspaceSlug);
    return { title: `${title} · ${teamName}`, slug: workspaceSlug, membershipIds: [...team.membershipIds] };
  });
}
