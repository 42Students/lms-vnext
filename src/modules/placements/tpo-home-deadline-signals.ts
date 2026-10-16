/** TPO-home-14: facts derived from persisted, college-scoped published drives.
 * Uses IST calendar days, as the legacy TPO service does. Other signals must
 * not be manufactured from unrelated queue counts. */
export type TpoHomeDeadlineJob={
 id:string;title:string;status:string;applicationDeadline:Date|null;
 company:{name:string};
};
export type TpoHomeDeadlineNeed={
 type:"DEADLINE_TODAY"|"CLOSING_SOON"|"NO_DEADLINE";
 priority:number;title:string;count:number;link:string;
};
function istDayOrdinal(date:Date){
 const parts=new Intl.DateTimeFormat("en-US",{year:"numeric",month:"2-digit",day:"2-digit",
  timeZone:"Asia/Kolkata"}).formatToParts(date);
 const v=(kind:string)=>Number(parts.find(p=>p.type===kind)?.value??0);
 return Math.floor(Date.UTC(v("year"),v("month")-1,v("day"))/86400000);
}
export function deadlineTpoHomeNeeds(jobs:readonly TpoHomeDeadlineJob[],now:Date=new Date()):TpoHomeDeadlineNeed[]{
 const today=istDayOrdinal(now);
 const output:TpoHomeDeadlineNeed[]=[];
 for(const job of jobs){
  if(job.status!=="PUBLISHED")continue;
  const link="/tpo/placements/jobs/"+encodeURIComponent(job.id);
  const title=job.company.name+" · "+job.title;
  if(job.applicationDeadline===null){
   output.push({type:"NO_DEADLINE",priority:30,title,count:1,link});
   continue;
  }
  const remaining=istDayOrdinal(job.applicationDeadline)-today;
  if(remaining===0&&job.applicationDeadline.getTime()>=now.getTime()){
   output.push({type:"DEADLINE_TODAY",priority:1,title,count:1,link});
  }else if(remaining>=1&&remaining<=3){
   output.push({type:"CLOSING_SOON",priority:35,title,count:1,link});
  }
 }
 return output.sort((a,b)=>a.priority-b.priority);
}
