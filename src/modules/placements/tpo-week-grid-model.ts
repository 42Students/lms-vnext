import type {PlacementCalendarEvent} from "./placement-calendar-model";
export type WeekGridEvent=Pick<PlacementCalendarEvent,"id"|"title"|"companyName"|"kind"|"roundKind"|"status"|"jobId"|"roundId"> & {
 startsAt:string;endsAt:string|null;href:string|null;
};
export type PositionedWeekEvent=WeekGridEvent & {
 startMinute:number;endMinute:number;column:number;columns:number;outsideHours:boolean;
};
const fmt=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
export function istMinute(value:string){
 const date=new Date(value);
 if(!Number.isFinite(date.getTime()))return null;
 const parts=fmt.formatToParts(date);
 const hour=Number(parts.find(p=>p.type==="hour")?.value??"0");
 const minute=Number(parts.find(p=>p.type==="minute")?.value??"0");
 return hour*60+minute;
}
/** Lane packing is local to a day, so overlapping appointments appear side-by-side.
 * Missing end times render as 30-min visual markers, not inferred durations. */
export function positionWeekEvents(events:readonly WeekGridEvent[],startHour=7,endHour=21):PositionedWeekEvent[]{
 const from=startHour*60,to=endHour*60;
 const items=events.flatMap(e=>{
  const start=istMinute(e.startsAt);
  if(start===null)return [];
  const finish=e.endsAt?istMinute(e.endsAt):null;
  let end=finish!==null&&finish>start?finish:start+30;
  const outsideHours=start>=to||end<=from;
  return [{...e,startMinute:Math.max(from,start),endMinute:Math.min(to,Math.max(from+1,end)),
    column:0,columns:1,outsideHours}];
 }).sort((a,b)=>a.startMinute-b.startMinute||a.id.localeCompare(b.id));
 let active:typeof items=[];
 for(const item of items){
  if(item.outsideHours)continue;
  active=active.filter(other=>other.endMinute>item.startMinute);
  let column=0;
  while(active.some(other=>other.column===column))column++;
  item.column=column;
  active.push(item);
 }
 for(const item of items){
  if(item.outsideHours)continue;
  const group=items.filter(other=>!other.outsideHours&&other.startMinute<item.endMinute&&other.endMinute>item.startMinute);
  const lanes=Math.max(1,...group.map(other=>other.column+1));
  item.columns=lanes;
 }
 return items;
}
