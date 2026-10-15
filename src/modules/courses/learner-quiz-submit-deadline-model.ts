/** Match the server's strict past-deadline policy at the final click. */
export function learnerQuizSubmitDeadlineOpen(dueAt:string|null,nowMs:number):boolean {
  if(!dueAt)return true;
  const end=Date.parse(dueAt);
  return Number.isFinite(end) && Number.isFinite(nowMs) && nowMs<=end;
}
