/** Credit totals use only recorded finite nonnegative course credits. */
export function learnerCourseCreditSummary(values: readonly (number | null)[]) {
  const recorded = values.filter((value): value is number =>
    value !== null && Number.isFinite(value) && value >= 0);
  return {
    credits: recorded.reduce((sum, value) => sum + value, 0),
    recordedCount: recorded.length,
    missingCount: values.length - recorded.length,
  };
}
