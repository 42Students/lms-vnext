export type MentorProjectOrder = "RECENT" | "TITLE";
type OrderableProject = { id: string; title: string; status: string; updatedAt: Date };
export function compareMentorProjects(a: OrderableProject,b: OrderableProject,order:MentorProjectOrder):number {
  const archived=Number(a.status==="ARCHIVED")-Number(b.status==="ARCHIVED");
  if(archived)return archived;
  if(order==="TITLE")return a.title.localeCompare(b.title)||a.id.localeCompare(b.id);
  return b.updatedAt.getTime()-a.updatedAt.getTime() || a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
}

export function compareMentorProjectsByProgress(a:OrderableProject,b:OrderableProject,
 aPercent:number|undefined,bPercent:number|undefined){
 const archived=Number(a.status==="ARCHIVED")-Number(b.status==="ARCHIVED");
 if(archived)return archived;
 // Unknown task progress remains unknown, always after measured percentages.
 if(aPercent===undefined)return bPercent===undefined?compareMentorProjects(a,b,"RECENT"):1;
 if(bPercent===undefined)return -1;
 return aPercent-bPercent||compareMentorProjects(a,b,"RECENT");
}

/** Highest measured completion first; archived work stays after current work. */
export function compareMentorProjectsByMostProgress(a:OrderableProject,b:OrderableProject,
 aPercent:number|undefined,bPercent:number|undefined){
 const archived=Number(a.status==="ARCHIVED")-Number(b.status==="ARCHIVED");
 if(archived)return archived;
 if(aPercent===undefined)return bPercent===undefined?compareMentorProjects(a,b,"RECENT"):1;
 if(bPercent===undefined)return -1;
 return bPercent-aPercent||compareMentorProjects(a,b,"RECENT");
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
