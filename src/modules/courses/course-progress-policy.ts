/**
 * SA-academics-people-49: platform-wide progress policy (legacy BE-0126 / BE-0170).
 * Pure rules shared by the learner progress writer, the learner views and the
 * Super Admin policy cards. Wording is the legacy dev wording verbatim.
 */
export const COURSE_PROGRESS_POLICY_KEYS = {
  watched: "course.watchedThresholdPercent",
  minInProgress: "course.minInProgressPercent",
} as const;

export type CourseProgressPolicy = {
  /** 1..100: how far into a video counts as watched. */
  watchedThresholdPercent: number;
  /** 0..99: below this percentage a timed item counts as not started. */
  minInProgressPercent: number;
};

export const DEFAULT_COURSE_PROGRESS_POLICY: CourseProgressPolicy = {
  watchedThresholdPercent: 90,
  minInProgressPercent: 5,
};

export const COURSE_PROGRESS_POLICY_CARDS = {
  progress: {
    title: "Progress policy",
    scopeNote: "Platform-wide: applies to every college.",
    key: COURSE_PROGRESS_POLICY_KEYS.minInProgress,
    label: "In progress lower bound",
    help: "Below this percentage a video counts as not started.",
    defaultValue: 5,
    min: 0,
    max: 99,
    suffix: "%",
  },
  video: {
    title: "Video policy",
    scopeNote: "Platform-wide: applies to every college.",
    key: COURSE_PROGRESS_POLICY_KEYS.watched,
    label: 'Video "watched" threshold',
    help: "How far into a video counts as watched, for progress and lesson completion.",
    defaultValue: 90,
    min: 1,
    max: 100,
    suffix: "%",
  },
} as const;

function boundedInt(raw: string | number | null | undefined, min: number, max: number, fallback: number) {
  if (raw === null || raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}

/** Turns stored override rows into a validated policy; anything invalid falls back to the default. */
export function resolveCourseProgressPolicy(
  rows: readonly { key: string; value: string }[],
): CourseProgressPolicy {
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const watched = COURSE_PROGRESS_POLICY_CARDS.video;
  const lower = COURSE_PROGRESS_POLICY_CARDS.progress;
  return {
    watchedThresholdPercent: boundedInt(byKey.get(watched.key), watched.min, watched.max, watched.defaultValue),
    minInProgressPercent: boundedInt(byKey.get(lower.key), lower.min, lower.max, lower.defaultValue),
  };
}

/** True when a persisted position has reached the platform "watched" threshold. */
export function timedContentWatched(
  positionSeconds: number,
  durationSeconds: number,
  policy: CourseProgressPolicy = DEFAULT_COURSE_PROGRESS_POLICY,
) {
  return durationSeconds > 0 && positionSeconds * 100 >= durationSeconds * policy.watchedThresholdPercent;
}

/** Below the lower bound a timed item with a known length counts as not started. */
export function timedContentStarted(
  positionSeconds: number,
  durationSeconds: number,
  policy: CourseProgressPolicy = DEFAULT_COURSE_PROGRESS_POLICY,
) {
  if (positionSeconds <= 0) return false;
  if (durationSeconds <= 0) return true; // unknown length: never invent a percentage
  return positionSeconds * 100 >= durationSeconds * policy.minInProgressPercent;
}
