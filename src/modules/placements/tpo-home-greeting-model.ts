/** India-facing TPO Home greeting, evaluated from a server-captured clock.
 * The same captured instant is used for the greeting and date. */
export function tpoHomeGreeting(now:Date,displayName:string|null|undefined){
 const hour=Number(new Intl.DateTimeFormat("en-GB",{
  hour:"2-digit",hourCycle:"h23",timeZone:"Asia/Kolkata",
 }).format(now));
 const text=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
 const firstName=displayName?.trim().split(/\s+/)[0]??"";
 return {
  date:new Intl.DateTimeFormat("en-GB",{
   weekday:"long",day:"numeric",month:"long",timeZone:"Asia/Kolkata",
  }).format(now),
  title:firstName?text+", "+firstName:text,
 };
}
