import type { ProjectTemplateBlueprint } from "./validation";

/**
 * MEN-projects-meetings-17/22: mentor-only, version-pinned brief and
 * review links; do not advertise review for draft/accepted deliveries.
 */
export function mentorReviewSubmissionHref(
  projectId: string,
  submissions: readonly { status: string }[],
): string | null {
  if (!submissions.some(submission => submission.status === "SUBMITTED")) return null;
  return "/mentor/projects/" + encodeURIComponent(projectId) + "?tab=delivery";
}

export function mentorAuthoredBrief(
  overview: ProjectTemplateBlueprint["overview"] | null,
) {
  return {
    goal: overview?.goal ?? null,
    description: overview?.description ?? null,
    deliverables: overview?.deliverables ?? [],
  };
}
