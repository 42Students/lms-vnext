export type MentorProjectOrder = "RECENT" | "TITLE";
const titleCollator = new Intl.Collator("en-IN", { sensitivity: "base" });

/** The old list applied numeric ordering only to Team N siblings with the
 * same workspace prefix; unrelated titles must retain lexical ordering.
 */
function compareTeamTitles(a:string,b:string):number|null{
  const teamPattern=/^(.*?)\s*(?:[-–:]\s*)?team\s+(\d+)\s*$/i;
  const left=teamPattern.exec(a.trim()),right=teamPattern.exec(b.trim());
  if(!left||!right)return null;
  if(titleCollator.compare(left[1].trim(),right[1].trim())!==0)return null;
  const n1=Number(left[2]),n2=Number(right[2]);
  return n1===n2?0:n1<n2?-1:1;
}
function compareMentorTitles(a:string,b:string){
  return compareTeamTitles(a,b)??titleCollator.compare(a,b);
}
type OrderableProject = { id: string; title: string; status: string; updatedAt: Date };
export function compareMentorProjects(a: OrderableProject,b: OrderableProject,order:MentorProjectOrder):number {
  const archived=Number(a.status==="ARCHIVED")-Number(b.status==="ARCHIVED");
  if(archived)return archived;
  if(order==="TITLE")return compareMentorTitles(a.title,b.title)||a.id.localeCompare(b.id);
  // RECENT is a deliberate vNext sort; equal timestamps preserve the
  // backend order (stable Array.sort), except Team N siblings.
  return b.updatedAt.getTime()-a.updatedAt.getTime() ||
    (compareTeamTitles(a.title,b.title)??0);
}

/** Invalid or impossible percentages are unmeasured, not ranking signals. */
function measuredProgress(value:number|null|undefined):number|undefined {
 return value!==undefined&&value!==null&&Number.isFinite(value)&&value>=0&&value<=100?value:undefined;
}

export function compareMentorProjectsByProgress(a:OrderableProject,b:OrderableProject,
 aPercent:number|null|undefined,bPercent:number|null|undefined){
 const archived=Number(a.status==="ARCHIVED")-Number(b.status==="ARCHIVED");
 if(archived)return archived;
 // Unknown task progress remains unknown, always after measured percentages.
 const left=measuredProgress(aPercent),right=measuredProgress(bPercent);
 if(left===undefined)return right===undefined?compareMentorProjects(a,b,"RECENT"):1;
 if(right===undefined)return -1;
 return left-right||compareMentorProjects(a,b,"RECENT");
}

/** Highest measured completion first; archived work stays after current work. */
export function compareMentorProjectsByMostProgress(a:OrderableProject,b:OrderableProject,
 aPercent:number|null|undefined,bPercent:number|null|undefined){
 const archived=Number(a.status==="ARCHIVED")-Number(b.status==="ARCHIVED");
 if(archived)return archived;
 const left=measuredProgress(aPercent),right=measuredProgress(bPercent);
 if(left===undefined)return right===undefined?compareMentorProjects(a,b,"RECENT"):1;
 if(right===undefined)return -1;
 return right-left||compareMentorProjects(a,b,"RECENT");
}

/** Count only registered non-DONE tasks, with stable ordering for ties. */
export function compareMentorProjectsByOpenTasks(a:OrderableProject,b:OrderableProject,
 aOpen:number,bOpen:number){
 const archived=Number(a.status==="ARCHIVED")-Number(b.status==="ARCHIVED");
 if(archived)return archived;
 return bOpen-aOpen||compareMentorProjects(a,b,"RECENT");
}

/** Active team count is supplied by an authorized project-scoped roster query. */
export function compareMentorProjectsByTeamSize(a:OrderableProject,b:OrderableProject,
 aSize:number,bSize:number, direction:"LARGEST"|"SMALLEST"){
 const archived=Number(a.status==="ARCHIVED")-Number(b.status==="ARCHIVED");
 if(archived)return archived;
 const difference=direction==="LARGEST"?bSize-aSize:aSize-bSize;
 return difference||compareMentorProjects(a,b,"RECENT");
}
