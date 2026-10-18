/** Owner decision: date-only filters use IST calendar days (UTC+05:30).
 * Never normalize an impossible date into another day's audit records.
 */
export function indiaDayStart(date:string):Date{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error("INVALID_IST_DATE");
 const start=new Date(date+"T00:00:00+05:30");
 if(!Number.isFinite(start.getTime()) ||
    new Date(start.getTime()+330*60_000).toISOString().slice(0,10)!==date)
  throw new Error("INVALID_IST_DATE");
 return start;
}
export function indiaDayEndExclusive(date:string):Date{
 return new Date(indiaDayStart(date).getTime()+86_400_000);
}
