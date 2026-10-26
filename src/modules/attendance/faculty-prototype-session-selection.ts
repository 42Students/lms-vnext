/** Choose the class the instructor can actually mark, instead of
 * blindly selecting the most distant future session in a descending list.
 * Explicit authorized session deep links always win. */
export function selectFacultyPrototypeSession<T extends {
 id:string;startsAt:string;endsAt:string;
}>(sessions:readonly T[],requestedId:string|null,now=new Date()):T|null{
 const requested=sessions.find(item=>item.id===requestedId);
 if(requested)return requested;
 const ordered=[...sessions].sort((a,b)=>Date.parse(b.startsAt)-Date.parse(a.startsAt));
 const time=now.getTime();
 const ongoing=ordered.find(row=>Date.parse(row.startsAt)<=time&&Date.parse(row.endsAt)>time);
 if(ongoing)return ongoing;
 const today=new Intl.DateTimeFormat("en-CA",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
 });
 const todayKey=today.format(now);
 const heldToday=ordered.find(row=>Date.parse(row.startsAt)<=time&&
  today.format(new Date(row.startsAt))===todayKey);
 if(heldToday)return heldToday;
 return ordered.find(row=>Date.parse(row.startsAt)<=time)??ordered.at(-1)??null;
}
