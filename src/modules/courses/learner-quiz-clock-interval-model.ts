/** Update the attempt clock frequently enough to remove the submit button at a
 * deadline without making every long-running quiz rerender every second. */
export function learnerQuizClockInterval(dueAt:string|null,nowMs:number):number {
 if(!dueAt||!Number.isFinite(nowMs))return 30_000;
 const end=Date.parse(dueAt);
 if(!Number.isFinite(end))return 1_000;
 const remaining=end-nowMs;
 return remaining<=60_000 ? 1_000 : remaining<=10*60_000 ? 5_000 : 30_000;
}
