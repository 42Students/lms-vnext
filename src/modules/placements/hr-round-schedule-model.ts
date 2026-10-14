export type RoundScheduleRow={id:string;name:string;sequence:number;status:string;
 scheduledAt:Date|null;durationMinutes:number|null;mode:string|null;venue:string|null};
export function hrScheduledRoundRows(rows:readonly RoundScheduleRow[]){
 const scheduled=rows.filter(row=>(row.status==="SCHEDULED"||row.status==="COMPLETED")&&
   row.scheduledAt!==null&&Number.isFinite(row.scheduledAt.getTime()));
 return scheduled.map(row=>{
  const start=row.scheduledAt!;
  const length=row.durationMinutes;
  const end=length!==null&&length>0&&length<=1440?new Date(start.getTime()+length*60000):null;
  const conflicts=end?scheduled.filter(other=>{
   if(other.id===row.id||!other.scheduledAt||!other.durationMinutes||
     other.durationMinutes<=0||other.durationMinutes>1440)return false;
   return start.getTime()<other.scheduledAt.getTime()+other.durationMinutes*60000 &&
     other.scheduledAt.getTime()<end.getTime();
  }).map(other=>other.id):[];
  return {id:row.id,name:row.name,sequence:row.sequence,startsAt:start,endsAt:end,
    mode:row.mode,venue:row.venue,conflicts};
 }).sort((a,b)=>a.startsAt.getTime()-b.startsAt.getTime()||a.id.localeCompare(b.id));
}
