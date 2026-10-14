import {z} from "zod";
export const LEARNER_ATTENDANCE_HISTORY_OPTIONS=[
  {value:"ALL",label:"All statuses"},
  {value:"PRESENT",label:"Present"},
  {value:"ABSENT",label:"Absent"},
  {value:"NOT_MARKED",label:"Not marked"},
  {value:"SCHEDULED",label:"Scheduled"},
  {value:"OTHER",label:"Late / excused / medical"},
] as const;
export const learnerAttendanceHistoryFilterSchema=z.enum(["ALL","PRESENT","ABSENT","NOT_MARKED","SCHEDULED","OTHER"]);
export type LearnerAttendanceHistoryFilter=z.infer<typeof learnerAttendanceHistoryFilterSchema>;
export function filterLearnerAttendanceHistory<T extends {status:string}>(
  rows:readonly T[],rawFilter:unknown,
):T[] {
  const status=learnerAttendanceHistoryFilterSchema.catch("ALL").parse(rawFilter);
  if(status==="ALL")return [...rows];
  if(status==="OTHER")return rows.filter(row=>["LATE","EXCUSED","MEDICAL"].includes(row.status));
  return rows.filter(row=>row.status===status);
}
