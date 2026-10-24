export type MentorSprintSearchItem={
 id:string;kind:"SPRINT"|"RELEASE"|"TASK";title:string;
 context:string;href:string;
};
export function filterMentorSprintTimeline(
 entries:readonly MentorSprintSearchItem[],query:string,max=30,
):MentorSprintSearchItem[]{
 const q=query.trim().toLocaleLowerCase("en-IN");
 if(!q)return [];
 const words=q.split(/\s+/).filter(Boolean);
 return entries.filter(item=>{
  const search=(item.title+" "+item.context).toLocaleLowerCase("en-IN");
  return words.every(word=>search.includes(word));
 }).sort((a,b)=>{
  const exactA=a.title.toLocaleLowerCase("en-IN")===q;
  const exactB=b.title.toLocaleLowerCase("en-IN")===q;
  return Number(exactB)-Number(exactA)||
    a.kind.localeCompare(b.kind)||a.title.localeCompare(b.title)||a.id.localeCompare(b.id);
 }).slice(0,Math.max(1,Math.min(100,max)));
}
