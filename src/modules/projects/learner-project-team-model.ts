export type LearnerProjectTeamMember = {
  projectId: string;
  membershipId: string;
  role: string;
  isPrimary: boolean;
  displayName: string | null;
};

export type LearnerProjectTeamSummary = {
  projectId: string;
  mentorName: string | null;
  memberCount: number;
};

/** Only use active, authorized member rows supplied by the scoped read service. */
export function summarizeLearnerProjectTeams(
  projectIds: readonly string[],
  rows: readonly LearnerProjectTeamMember[],
): LearnerProjectTeamSummary[] {
  const owned = new Set(projectIds);
  const groups = new Map<string, LearnerProjectTeamMember[]>();
  for (const row of rows) {
    if (!owned.has(row.projectId)) continue;
    const members = groups.get(row.projectId) ?? [];
    members.push(row);
    groups.set(row.projectId, members);
  }
  return projectIds.map((projectId) => {
    const members = groups.get(projectId) ?? [];
    const primary = members.find((member) =>
      member.role === "MENTOR" && member.isPrimary);
    const anyMentor = members.find((member) => member.role === "MENTOR");
    return {
      projectId,
      mentorName: primary?.displayName ?? anyMentor?.displayName ?? null,
      memberCount: new Set(members.map((member) => member.membershipId)).size,
    };
  });
}
