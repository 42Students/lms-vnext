import {learnerRoundTimeSignal} from "./learner-round-time-signal";
export type InterviewCountdown={label:string;phase:"PENDING"|"UPCOMING"|"WINDOW"|"PAST";};
/** A relative schedule indicator, not employer-provided attendance or completion. */
export function learnerInterviewCountdown(input:{
  scheduledAt:string|null;durationMinutes:number|null|undefined;
},nowMs:number):InterviewCountdown {
  const state=learnerRoundTimeSignal(input,nowMs);
  if(state==="AWAITING_SCHEDULE")return {label:"Awaiting schedule",phase:"PENDING"};
  if(state==="SCHEDULED_TIME_PASSED")return {label:"Scheduled time passed — outcome unconfirmed",phase:"PAST"};
  if(state==="IN_SCHEDULED_WINDOW")return {label:"Within scheduled time window — attendance unconfirmed",phase:"WINDOW"};
  const remaining=Math.max(1,Math.ceil((Date.parse(input.scheduledAt!)-nowMs)/60000));
  if(remaining>=1440)return {label:"Starts in "+Math.floor(remaining/1440)+"d "+Math.floor((remaining%1440)/60)+"h",phase:"UPCOMING"};
  if(remaining>=60)return {label:"Starts in "+Math.floor(remaining/60)+"h "+remaining%60+"m",phase:"UPCOMING"};
  return {label:remaining===1?"Starts in under 1 min":"Starts in "+remaining+" min",phase:"UPCOMING"};
}
