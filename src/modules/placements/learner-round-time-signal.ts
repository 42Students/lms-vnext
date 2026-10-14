export type LearnerRoundTimeSignal =
  | "AWAITING_SCHEDULE" | "UPCOMING" | "IN_SCHEDULED_WINDOW" | "SCHEDULED_TIME_PASSED";

/** A scheduled window is not proof of attendance, an employer start, or a result. */
export function learnerRoundTimeSignal(input:{
  scheduledAt:string|null;durationMinutes:number|null|undefined;
}, nowMs:number):LearnerRoundTimeSignal {
  if(!input.scheduledAt)return "AWAITING_SCHEDULE";
  const start=Date.parse(input.scheduledAt);
  if(!Number.isFinite(start)||!Number.isFinite(nowMs))return "AWAITING_SCHEDULE";
  if(nowMs<start)return "UPCOMING";
  const duration=input.durationMinutes;
  if(duration===null||duration===undefined||!Number.isInteger(duration)||duration<1||duration>1440)
    return "SCHEDULED_TIME_PASSED";
  return nowMs<start+duration*60_000?"IN_SCHEDULED_WINDOW":"SCHEDULED_TIME_PASSED";
}
export function learnerRoundTimeLabel(signal:LearnerRoundTimeSignal) {
  switch(signal){
    case "AWAITING_SCHEDULE":return "Awaiting schedule";
    case "UPCOMING":return "Upcoming";
    case "IN_SCHEDULED_WINDOW":return "In scheduled time window";
    case "SCHEDULED_TIME_PASSED":return "Scheduled time passed";
  }
}
