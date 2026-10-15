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
