/** Transparent task-workload signals, not an inference about a student's
 * motivation, attendance, sign-in or personal circumstances.
 */
export type MentorStudentTaskFacts={
  open:number;
  teamOpen:number;
  lastOpenTaskChange:string|null;
};
export type MentorTaskSignal={
  kind:"UNCHANGED_TASKS"|"CONCENTRATED_WORK";
  label:string;
  weight:number;
};
export function deriveMentorStudentTaskSignals(
  facts:MentorStudentTaskFacts,now:Date,
):MentorTaskSignal[]{
  const signals:MentorTaskSignal[]=[];
  const stamp=facts.lastOpenTaskChange===null?Number.NaN:
    Date.parse(facts.lastOpenTaskChange);
  const elapsed=now.getTime()-stamp;
  if(facts.open>0&&Number.isFinite(elapsed)&&elapsed>=7*86400000){
    const days=Math.floor(elapsed/86400000);
    signals.push({kind:"UNCHANGED_TASKS",
      label:"No assigned open task changed in "+days+" days",weight:Math.min(days,30)});
  }
  if(facts.open>=4&&facts.teamOpen>=6&&facts.open/facts.teamOpen>=0.6){
    signals.push({kind:"CONCENTRATED_WORK",
      label:"Assigned "+facts.open+" of the team's "+facts.teamOpen+" open tasks",
      weight:Math.round(10*facts.open/facts.teamOpen)});
  }
  return signals;
}
