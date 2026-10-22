/** IST calendar days have fixed 24-hour UTC bounds, including midnight crossover. */
export function istDayBounds(date:Date){
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Kolkata",
  year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
 const get=(type:string)=>parts.find(p=>p.type===type)?.value??"";
 const start=new Date(get("year")+"-"+get("month")+"-"+get("day")+"T00:00:00+05:30");
 return {from:start,to:new Date(start.getTime()+86400000)};
}
/** Pending attendance counts classes that ENDED within the preceding 168
 * hours, including classes started before the cutoff. */
export function pendingAttendanceWindowStart(now:Date):Date{
 return new Date(now.getTime()-7*24*60*60*1000);
}
/** AttentionBoard "when": ddd D MMM, h:mm A rendered in IST. */
export function formatSuperAdminAttentionWhen(value:Date):string{
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",
  weekday:"short",day:"numeric",month:"short",hour:"numeric",minute:"2-digit",hour12:true,
 }).formatToParts(value);
 const get=(type:string)=>parts.find(part=>part.type===type)?.value??"";
 return get("weekday")+" "+get("day")+" "+get("month")+", "+
  get("hour")+":"+get("minute")+" "+get("dayPeriod").toUpperCase()+" IST";
}
export type SuperAdminTodayMetrics={
 classesScheduled:number;classesEnded:number;classesHeld?:number;attendanceTaken:number;
 attendanceNotTaken:number;coursesWithoutTeacher:number;quizzesClosingThisWeek:number;
 quizDeadlineLabels?:readonly string[];
 /** Independent legacy Today previews. Unknown totals stay null; never imply an all-clear. */
 attendanceThreshold?:number;
 attendanceAtRisk?:number|null;
 attendanceRiskRows?:readonly {membershipId:string;displayName:string|null;rollNumber:string|null;
  className:string;held:number;absent:number;percent:number}[];
 attendancePendingRows?:readonly {title:string;section:string;faculty:string;when:string}[];
 gradingBacklog?:number|null;
 gradingRows?:readonly {course:string;code:string;pending:number;oldest:string|null}[];
 unstaffedRows?:readonly {course:string;section:string;semester:string}[];
 setupGaps?:number|null;
 setupGapRows?:readonly {label:string;count:number;href:string}[];
 dueQuizRows?:readonly {title:string;course:string;section:string;when:string|null}[];
};
export const SUPER_ADMIN_TODAY_LABELS=[
 "Attendance not taken","Under N% attendance","Waiting to be graded",
 "Courses with no teacher","Setup gaps","Quizzes closing this week",
] as const;
