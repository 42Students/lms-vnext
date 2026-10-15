/** Owner decision: date-only filters use IST calendar days (UTC+05:30). */
export function indiaDayStart(date:string):Date{
 return new Date(date+"T00:00:00+05:30");
}
export function indiaDayEndExclusive(date:string):Date{
 return new Date(indiaDayStart(date).getTime()+86400000);
}
