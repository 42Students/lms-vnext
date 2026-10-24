/** All Mentor Activity calendar dates are IST calendar days, never UTC days.
 * Asia/Kolkata has a fixed +05:30 offset, so this is browser-zone neutral.
 */
export function mentorActivityIstDayKey(value:string|Date):string|null{
  const stamp=new Date(value).getTime();
  if(!Number.isFinite(stamp))return null;
  const shifted=new Date(stamp+330*60_000);
  return Number.isFinite(shifted.getTime())?shifted.toISOString().slice(0,10):null;
}
export function mentorActivityMatchesDateFilters(
  occurredAt:string|Date,now:string,
  range:string,fromDate:string,toDate:string,
):boolean{
  const stamp=new Date(occurredAt).getTime(),current=Date.parse(now);
  if(!Number.isFinite(stamp))return false;
  const day=mentorActivityIstDayKey(occurredAt);
  if(!day)return false;
  if(fromDate&&day<fromDate)return false;
  if(toDate&&day>toDate)return false;
  if(range==="ALL")return true;
  if(!Number.isFinite(current)||stamp>current)return false;
  if(range==="1")return day===mentorActivityIstDayKey(now);
  if(range==="7"||range==="30")
    return stamp>=current-Number(range)*86_400_000;
  return false;
}
