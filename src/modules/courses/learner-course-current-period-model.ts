/** Resolve a stale client semester against the server-authorized course periods. */
export function resolveLearnerCoursePeriod(selected: string, periods: readonly { id:string }[]):string {
  if (periods.some(period=>period.id===selected)) return selected;
  return periods[0]?.id ?? "";
}
