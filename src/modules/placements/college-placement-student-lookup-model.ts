/** Probe one additional authorized row before reporting a truncated lookup. */
export const STUDENT_LOOKUP_CAP = 15;
export const STUDENT_LOOKUP_APPLICATION_CAP = 100;

export function capStudentLookupRows<T>(
  rows: readonly T[],
  cap: typeof STUDENT_LOOKUP_CAP | typeof STUDENT_LOOKUP_APPLICATION_CAP,
): { items: T[]; truncated: boolean } {
  return { items: rows.slice(0, cap), truncated: rows.length > cap };
}
