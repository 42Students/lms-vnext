/** Server-selected academic month and stored sessions use Asia/Kolkata,
 * irrespective of a Learner's browser or the Node runtime timezone. */
export function learnerCourseAttendanceIstMonth(value:Date):string{
 const parts=new Intl.DateTimeFormat("en-GB",{
  year:"numeric",month:"2-digit",timeZone:"Asia/Kolkata",
 }).formatToParts(value);
 const year=parts.find(p=>p.type==="year")?.value;
 const month=parts.find(p=>p.type==="month")?.value;
 return `${year}-${month}`;
}
export function learnerCourseAttendanceSameIstMonth(value:Date,month:string):boolean{
 return Number.isFinite(value.getTime())&&learnerCourseAttendanceIstMonth(value)===month;
}
