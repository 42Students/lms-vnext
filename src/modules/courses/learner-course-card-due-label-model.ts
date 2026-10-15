/** Historical courses cannot advertise an actionable upcoming assignment or quiz. */
export function learnerCourseCardDueLabel(
  readOnly: boolean,
  due: {kind: "Assignment"|"Quiz";title:string;dueAt:string}|null,
  format: (value:string)=>string|null,
): string {
  if (readOnly) return "Past semester · read only";
  if (!due) return "No upcoming due dates";
  return `${due.kind} · ${due.title} · ${format(due.dueAt) ?? "Date unavailable"}`;
}
