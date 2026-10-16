/** Exact legacy wording of BatchPromotion.js (lms-dev-2026): COL-academic-setup-34. */
export const BATCH_PROMOTION_COPY = {
  notReady: "Can’t promote yet",
  ready: "Server-verified promotion is ready",
  showCompleted: "Show completed / inactive",
  promoteButton: "Promote",
} as const;

/** `This will affect 1 student across 2 classes`. The class part is omitted when no class count is known. */
export function promotionImpactMessage(studentCount: number, classCount?: number | null) {
  const students = `${studentCount} student${studentCount === 1 ? "" : "s"}`;
  if (classCount === undefined || classCount === null) return `This will affect ${students}`;
  return `This will affect ${students} across ${classCount} class${classCount === 1 ? "" : "es"}`;
}
