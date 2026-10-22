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

/** Legacy public counters round to a multiple of five; a group smaller
 * than five is suppressed entirely before rounding. Values from an
 * unpublished college or an unverified cohort must never reach this helper.
 * Halfway ties are rounded away from zero using Math.round for nonnegative
 * counts, matching public "approximate" presentation. */
export function nearestFivePublicCount(value:number|null,minimum=5):number|null{
 if(!Number.isSafeInteger(minimum)||minimum<5)
  throw new Error("PUBLIC_DISCLOSURE_MINIMUM_INVALID");
 if(value===null||!Number.isFinite(value)||value<minimum)return null;
 const rounded=Math.round(value/5)*5;
 if(!Number.isSafeInteger(rounded)||rounded<minimum)return null;
 return rounded;
}

export function publicPlacementDisclosure(
  metrics: readonly PublicPlacementMetric[],
  minimum = 5,
): PublicPlacementDisplay[] {
  if (!Number.isSafeInteger(minimum) || minimum < 5) {
    throw new Error("PUBLIC_DISCLOSURE_MINIMUM_INVALID");
  }
  return metrics.map(({ label, count }) => {
    const safeCount = count!==null&&Number.isSafeInteger(count)
      ? nearestFivePublicCount(count,minimum)
      : null;
    return {
      label,
      display: safeCount === null ? "Not publicly available" : String(safeCount),
      suppressed: safeCount === null,
    };
  });
}
