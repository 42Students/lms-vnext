/** Pure publication preconditions, separated from tenant-scoped persistence. */
export function canPublishPath(hasActiveLesson: boolean) {
  return hasActiveLesson;
}

export function canUnpublishPath(activity: {
  progressRows: number;
  submissionRows: number;
  attemptRows: number;
}) {
  return activity.progressRows === 0 &&
    activity.submissionRows === 0 &&
    activity.attemptRows === 0;
}
