/** Calendar days in IST, independent of the browser or Node process timezone. */
export function istCalendarDay(value: string | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("INVALID_CALENDAR_INSTANT");
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const part=(type:string)=>parts.find(p=>p.type===type)?.value ?? "";
  return part("year")+"-"+part("month")+"-"+part("day");
}

/** Exactly 42 cells starting Sunday, with no host-timezone local Date arithmetic. */
export function istMonthGridKeys(year:number,month:number):string[] {
  if (!Number.isInteger(year) || year < 2000 || year > 2100 ||
      !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("INVALID_CALENDAR_MONTH");
  }
  const first=new Date(Date.UTC(year,month-1,1));
  const firstSunday=Date.UTC(year,month-1,1-first.getUTCDay());
  return Array.from({length:42},(_,n)=>
    new Date(firstSunday+n*86_400_000).toISOString().slice(0,10));
}

export function istDayAgenda<T extends {startsAt:string}>(rows:readonly T[],dayKey:string):T[] {
  return rows.filter(row=>istCalendarDay(row.startsAt)===dayKey)
    .slice().sort((a,b)=>a.startsAt.localeCompare(b.startsAt));
}
