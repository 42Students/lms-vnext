/** Public placement statistics must never expose a cohort smaller than five.
 * Callers must first aggregate within an explicitly public, authorized college scope.
 * Null represents unavailable evidence, not zero.
 */
export type PublicPlacementMetric = {
  label: string;
  count: number | null;
};

export type PublicPlacementDisplay = {
  label: string;
  display: string;
  suppressed: boolean;
};

export function publicPlacementDisclosure(
  metrics: readonly PublicPlacementMetric[],
  minimum = 5,
): PublicPlacementDisplay[] {
  if (!Number.isSafeInteger(minimum) || minimum < 5) {
    throw new Error("PUBLIC_DISCLOSURE_MINIMUM_INVALID");
  }
  return metrics.map(({ label, count }) => {
    const safeCount =
      count !== null && Number.isSafeInteger(count) && count >= minimum
        ? count
        : null;
    return {
      label,
      display: safeCount === null ? "Not publicly available" : String(safeCount),
      suppressed: safeCount === null,
    };
  });
}
