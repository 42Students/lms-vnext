/** Warn on the actual deadline clock, without suggesting a closed/exhausted quiz is actionable. */
export function learnerQuizDeadlineWarning(dueAt:string|null,nowMs:number,attemptable:boolean):string|null {
  if(!attemptable || !dueAt || !Number.isFinite(nowMs) || nowMs<=0)return null;
  const remaining=Date.parse(dueAt)-nowMs;
  if(!Number.isFinite(remaining)||remaining<=0||remaining>10*60_000)return null;
  const minutes=Math.max(1,Math.ceil(remaining/60_000));
  return `Deadline approaching: ${minutes} minute${minutes===1?"":"s"} left to submit.`;
}
