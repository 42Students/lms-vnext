/** IST calendar days have fixed 24-hour UTC bounds, including midnight crossover. */
export function istDayBounds(date:Date){
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Kolkata",
  year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
 const get=(type:string)=>parts.find(p=>p.type===type)?.value??"";
 const start=new Date(get("year")+"-"+get("month")+"-"+get("day")+"T00:00:00+05:30");
 return {from:start,to:new Date(start.getTime()+86400000)};
}
export type SuperAdminTodayMetrics={
 classesScheduled:number;classesEnded:number;attendanceTaken:number;
 attendanceNotTaken:number;coursesWithoutTeacher:number;quizzesClosingThisWeek:number;
};
export const SUPER_ADMIN_TODAY_LABELS=[
 "Attendance not taken","Under N% attendance","Waiting to be graded",
 "Courses with no teacher","Setup gaps","Quizzes closing this week",
] as const;
