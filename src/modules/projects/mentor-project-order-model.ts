export type MentorProjectOrder = "RECENT" | "TITLE";
const teamTitleCollator = new Intl.Collator("en-IN", { numeric: true, sensitivity: "base" });
type OrderableProject = { id: string; title: string; status: string; updatedAt: Date };
export function compareMentorProjects(a: OrderableProject,b: OrderableProject,order:MentorProjectOrder):number {
  const archived=Number(a.status==="ARCHIVED")-Number(b.status==="ARCHIVED");
  if(archived)return archived;
  if(order==="TITLE")return teamTitleCollator.compare(a.title,b.title)||a.id.localeCompare(b.id);
  return b.updatedAt.getTime()-a.updatedAt.getTime() || teamTitleCollator.compare(a.title,b.title) || a.id.localeCompare(b.id);
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
