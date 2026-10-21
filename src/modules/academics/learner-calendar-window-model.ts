/** Calendar queries use the same Asia/Kolkata 42-day month grid as the
 * learner UI. The to instant is exclusive; the final visible Sunday is
 * included by advancing to the following Monday midnight IST. */
export function learnerCalendarVisibleWindow(month:string|undefined,now:Date):{from:Date;to:Date}{
 const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit"}).formatToParts(now);
 const year=month?Number(month.slice(0,4)):Number(parts.find(p=>p.type==="year")?.value);
 const monthNumber=month?Number(month.slice(5,7)):Number(parts.find(p=>p.type==="month")?.value);
 if(month && !/^\\d{4}-(0[1-9]|1[0-2])$/.test(month))
   throw new Error("INVALID_CALENDAR_MONTH");
 if(!Number.isInteger(year)||year<2000||year>2199||!Number.isInteger(monthNumber)||monthNumber<1||monthNumber>12)
   throw new Error("INVALID_CALENDAR_MONTH");
 const dayMs=86_400_000, istOffsetMs=330*60_000;
 const firstDayUtc=Date.UTC(year,monthNumber-1,1);
 const daysSinceMonday=(new Date(firstDayUtc).getUTCDay()+6)%7;
 // Always display exactly six Monday-first weeks to preserve stable rows.
 const start=firstDayUtc-daysSinceMonday*dayMs;
 return {from:new Date(start-istOffsetMs),to:new Date(start+42*dayMs-istOffsetMs)};
}

/** Separate bounded metric window; do not let a visible-month query silently
 * shrink Today/Next and long-range upcoming statistics. Both reads must use
 * the learner's own scoped delivery and section allowlists. */
export function learnerCalendarMetricsWindow(now:Date):{from:Date;to:Date}{
 if(!Number.isFinite(now.getTime()))throw new Error("INVALID_CALENDAR_DATE");
 const dayMs=86_400_000;
 const istDay=Math.floor((now.getTime()+330*60_000)/dayMs)*dayMs-330*60_000;
 return {from:new Date(istDay-30*dayMs),to:new Date(istDay+61*dayMs)};
}
