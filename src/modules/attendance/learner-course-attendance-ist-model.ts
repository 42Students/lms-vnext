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

/** A half-open IST month for SQL filtering: 00:00 IST on the first day of
 * the chosen month through (but not including) the first of the next month. */
export function learnerCourseAttendanceIstWindow(raw:string):{from:Date;to:Date}|null{
 if(!/^(20|21)\d{2}-(0[1-9]|1[0-2])$/.test(raw))return null;
 const [year,month]=raw.split("-").map(Number);
 if(year===undefined||month===undefined)return null;
 const start=new Date(Date.UTC(year,month-1,1,0,0)-330*60*1000);
 const end=new Date(Date.UTC(year,month,1,0,0)-330*60*1000);
 return {from:start,to:end};
}
