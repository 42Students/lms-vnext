/** A returned Retry-After interval is enforced by the auth endpoint, not
 * by this display. Show a concrete IST clock estimate without pretending
 * the caller's device clock is a trusted server timestamp. */
export function loginRetryWindowIst(now:Date,retryAfterSeconds:number):
 {seconds:number;timeIst:string}|null{
 if(!Number.isFinite(now.getTime())||!Number.isSafeInteger(retryAfterSeconds)||
   retryAfterSeconds<1||retryAfterSeconds>3600)return null;
 const until=new Date(now.getTime()+retryAfterSeconds*1000);
 return {seconds:retryAfterSeconds,timeIst:new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"short",day:"numeric",
  hour:"numeric",minute:"2-digit",second:"2-digit",hour12:true,
 }).format(until)};
}
