/** Derive the Mentor greeting from the server instant in IST, not a browser
 * timezone guess. A missing persisted name is never replaced with a sample.
 */
export function mentorHomeGreeting(nowIso:string,name:string|null):string{
 const instant=Date.parse(nowIso);
 const normalized=name?.trim()??"";
 const person=normalized||"Mentor";
 if(!Number.isFinite(instant))return "Welcome, "+person+".";
 const hour=new Date(instant+330*60_000).getUTCHours();
 const time=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
 return time+", "+person+".";
}
