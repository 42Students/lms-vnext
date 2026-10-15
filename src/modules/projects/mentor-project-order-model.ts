export type MentorProjectOrder = "RECENT" | "TITLE";
type OrderableProject = { id: string; title: string; status: string; updatedAt: Date };
export function compareMentorProjects(a: OrderableProject,b: OrderableProject,order:MentorProjectOrder):number {
  const archived=Number(a.status==="ARCHIVED")-Number(b.status==="ARCHIVED");
  if(archived)return archived;
  if(order==="TITLE")return a.title.localeCompare(b.title)||a.id.localeCompare(b.id);
  return b.updatedAt.getTime()-a.updatedAt.getTime() || a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
}
