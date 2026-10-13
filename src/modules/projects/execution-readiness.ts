export type ProjectExecutionReadinessInput = {
  projectStatus: string;
  releaseStatuses: readonly string[];
  sprintStatuses: readonly string[];
  taskStatuses: readonly string[];
};

/**
 * The persisted execution-completion rule shared by the
 * College Admin workspace snapshot and Readiness aggregate.
 *
 * Final submission approval and rubric evaluation are
 * deliberately separate from execution completion.
 */
export function deriveProjectExecutionReadiness({
  projectStatus,
  releaseStatuses,
  sprintStatuses,
  taskStatuses,
}: ProjectExecutionReadinessInput) {
  const shippedReleases = releaseStatuses.filter(
    (status) => status === "SHIPPED",
  ).length;

  const completedSprints = sprintStatuses.filter(
    (status) => status === "COMPLETED",
  ).length;

  const doneTasks = taskStatuses.filter(
    (status) => status === "DONE",
  ).length;

  const complete =
    projectStatus === "COMPLETED" &&
    releaseStatuses.length > 0 &&
    sprintStatuses.length > 0 &&
    taskStatuses.length > 0 &&
    shippedReleases === releaseStatuses.length &&
    completedSprints === sprintStatuses.length &&
    doneTasks === taskStatuses.length;

  return {
    complete,
    releases: {
      total: releaseStatuses.length,
      shipped: shippedReleases,
    },
    sprints: {
      total: sprintStatuses.length,
      completed: completedSprints,
    },
    tasks: {
      total: taskStatuses.length,
      done: doneTasks,
    },
  };
}
