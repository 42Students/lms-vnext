// Shared by quizReport.js and assignmentReport.js (and matches computePerformanceStats in
// useFacultyCourseStats.js) -- the same fixed 90/80/70/60/below-60 bucket scheme everywhere a
// score distribution is shown in this app, so a faculty member never has to re-learn a different
// grading scale on a different screen.
const DISTRIBUTION_BUCKETS = [
  { label: "90-100%", min: 90, max: 100 },
  { label: "80-89%", min: 80, max: 89 },
  { label: "70-79%", min: 70, max: 79 },
  { label: "60-69%", min: 60, max: 69 },
  { label: "Below 60%", min: 0, max: 59 },
];

/** `percentages` is a flat array of 0-100 scores; returns [{ label, min, max, count }, ...]. */
export function buildScoreDistribution(percentages) {
  const buckets = DISTRIBUTION_BUCKETS.map((b) => ({ ...b, count: 0 }));
  for (const percent of percentages) {
    const bucket = buckets.find((b) => percent >= b.min && percent <= b.max);
    if (bucket) bucket.count++;
  }
  return buckets;
}
