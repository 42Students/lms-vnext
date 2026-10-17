/** Calendar-exact India Standard Time input handling for College course authoring.
 * These controls use datetime-local, which carries no timezone offset.
 * IST does not observe daylight saving time. Reject normalized impossible dates.
 */
export function parseCollegeIstLocal(value:string):string|null {
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))return null;
 const [year,month,day,hour,minute]=[
  Number(value.slice(0,4)),Number(value.slice(5,7)),Number(value.slice(8,10)),
  Number(value.slice(11,13)),Number(value.slice(14,16)),
 ];
 if(year<2000||year>9999||month<1||month>12||day<1||day>31||
   hour>23||minute>59)return null;
 const localUtc=Date.UTC(year,month-1,day,hour,minute);
 const normalized=new Date(localUtc);
 if(normalized.getUTCFullYear()!==year||normalized.getUTCMonth()+1!==month||
   normalized.getUTCDate()!==day||normalized.getUTCHours()!==hour||
   normalized.getUTCMinutes()!==minute)return null;
 return new Date(localUtc-330*60_000).toISOString();
}
