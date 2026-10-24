export type MentorPointStack={done:number;waiting:number;open:number;total:number;
 donePct:number;waitingPct:number;openPct:number};
const valid=(value:number):number=>
  Number.isFinite(value)&&value>=0?value:0;
/** Proportional allocation of recorded estimate points; zero estimates
 * render an empty track, never fabricated fractions. */
export function mentorPointStack(
 donePoints:number,waitingPoints:number,openPoints:number,
):MentorPointStack{
 const done=valid(donePoints),waiting=valid(waitingPoints),open=valid(openPoints);
 const total=done+waiting+open;
 if(!total||!Number.isFinite(total))return {
  done,waiting,open,total:0,donePct:0,waitingPct:0,openPct:0,
 };
 const pct=(value:number)=>Math.round(value/total*1000)/10;
 return {done,waiting,open,total,
  donePct:pct(done),waitingPct:pct(waiting),
  openPct:Math.max(0,Math.round((100-pct(done)-pct(waiting))*10)/10)};
}
