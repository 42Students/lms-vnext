const istTime=new Intl.DateTimeFormat("en-IN",{
 timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit",
});
const istDate=new Intl.DateTimeFormat("en-IN",{
 timeZone:"Asia/Kolkata",weekday:"long",day:"numeric",month:"short",
});
export function learnerAttendanceDateLabel(value:string):string{
 const date=new Date(value);
 return Number.isFinite(date.getTime())?istDate.format(date):"Date unavailable";
}
export function learnerAttendanceTimeLabel(value:string):string{
 const date=new Date(value);
 return Number.isFinite(date.getTime())?istTime.format(date):"Time unavailable";
}
