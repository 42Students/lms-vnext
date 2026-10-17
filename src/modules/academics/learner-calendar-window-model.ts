/**
 * LEARNER-learning-misc-34: bound calendar reads to the displayed IST month
 * and adjacent week spillover, instead of loading academic history.
 */
export function learnerCalendarVisibleWindow(month:string|undefined,now:Date):{from:Date;to:Date}{
 const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit"}).formatToParts(now);
 const year=month?Number(month.slice(0,4)):Number(parts.find(p=>p.type==="year")?.value);
 const monthNumber=month?Number(month.slice(5,7)):Number(parts.find(p=>p.type==="month")?.value);
 if(!Number.isInteger(year)||year<2000||year>2199||!Number.isInteger(monthNumber)||monthNumber<1||monthNumber>12)
   throw new Error("INVALID_CALENDAR_MONTH");
 const istOffsetMs=330*60_000;
 return {
   from:new Date(Date.UTC(year,monthNumber-2,1)-istOffsetMs),
   to:new Date(Date.UTC(year,monthNumber+1,1)-istOffsetMs),
 };
}
