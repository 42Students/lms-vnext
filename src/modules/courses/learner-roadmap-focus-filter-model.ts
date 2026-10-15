export type LearnerRoadmapFilter="all"|"lectures"|"resources"|"assessments"|"live-sessions";
type Item={id:string;kind:"CONTENT"|"ASSIGNMENT"|"QUIZ"};
type Lesson={id:string;items:readonly Item[];contents:readonly {id:string;type:string}[]};
/** Preserve the requested filter unless an exact owned/published lesson item must be revealed. */
export function resolveLearnerRoadmapFocusFilter(
  raw:string,lessonId:string|null,itemId:string|null,lessons:readonly Lesson[],
):LearnerRoadmapFilter {
  const allowed:readonly string[]=["all","lectures","resources","assessments","live-sessions"];
  const selected: LearnerRoadmapFilter=allowed.includes(raw)?raw as LearnerRoadmapFilter:"all";
  if(!lessonId||!itemId)return selected;
  const lesson=lessons.find(row=>row.id===lessonId);
  const item=lesson?.items.find(row=>row.id===itemId);
  if(!item)return selected;
  if(item.kind!=="CONTENT")return "assessments";
  const content=lesson!.contents.find(row=>row.id===item.id);
  if(!content)return selected;
  if(content.type==="RESOURCE")return "resources";
  if(content.type==="LIVE_CLASS")return "live-sessions";
  return "lectures";
}
