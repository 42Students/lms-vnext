export type BlockedDayRow={id:string;day:string;reason:string;updatedAt:string};
export type BlockedRange={startDay:string;endDay:string;reason:string;items:BlockedDayRow[]};
/** Reconstruct readable weeks from daily persisted rows; no claim that the DB stores a grouped range. */
export function groupTpoBlockedDays(rows:readonly BlockedDayRow[]):BlockedRange[]{
 const sorted=[...rows].sort((a,b)=>a.day.localeCompare(b.day));
 const output:BlockedRange[]=[];
 for(const item of sorted){
  const previous=output.at(-1);
  const expected=previous?new Date(Date.parse(previous.endDay+"T00:00:00Z")+86400000).toISOString().slice(0,10):"";
  if(previous&&previous.reason===item.reason&&item.day===expected){
   previous.endDay=item.day;previous.items.push(item);
  }else{
   output.push({startDay:item.day,endDay:item.day,reason:item.reason,items:[item]});
  }
 }
 return output;
}
