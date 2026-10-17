/** A datetime-local form has no timezone: prep deadlines are explicitly IST. */
export function tpoPrepDueAtUtc(localIst:string):string|null{
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localIst))return null;
 const parsed=new Date(localIst+":00+05:30");
 if(!Number.isFinite(parsed.getTime()))return null;
 // Reject impossible dates that Date would otherwise normalize (e.g. 30 February).
 const roundTrip=new Date(parsed.getTime()+330*60_000).toISOString().slice(0,16);
 return roundTrip===localIst?parsed.toISOString():null;
}
