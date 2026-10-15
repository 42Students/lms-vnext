/** Resolve a stale client semester against the server-authorized course periods. */
export function resolveLearnerCoursePeriod(selected: string, periods: readonly { id:string }[], preferred = ""):string {
  if (periods.some(period=>period.id===selected)) return selected;
  if (periods.some(period=>period.id===preferred)) return preferred;
  return periods[0]?.id ?? "";
}
