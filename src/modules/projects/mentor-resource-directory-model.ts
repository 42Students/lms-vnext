import {z} from "zod";
import {csvSafeCell} from "./mentor-board-review-model";
import {singleValueMentorFilters} from "./mentor-filter-query";
export const mentorResourceDirectoryQuerySchema=z.object({
 projectId:z.string().uuid(),
 required:z.enum(["ALL","REQUIRED","OPTIONAL"]).default("ALL"),
 link:z.enum(["ALL","HTTPS","UNAVAILABLE"]).default("ALL"),
 description:z.enum(["ALL","RECORDED","MISSING"]).default("ALL"),
 order:z.enum(["SEQUENCE","TITLE"]).default("SEQUENCE"),
 search:z.string().trim().max(100).default(""),
 page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type MentorResourceDirectoryQuery=z.infer<typeof mentorResourceDirectoryQuerySchema>;
export type MentorResourceFact={
 id:string;title:string;description:string|null;url:string|null;
 required:boolean;sequence:number;
};
export function safeHttpsResourceUrl(raw:string|null){
 if(!raw||raw.length>2048)return null;
 try{
  const url=new URL(raw);
  return url.protocol==="https:"&&!url.username&&!url.password?
    url.toString():null;
 }catch{return null;}
}
export function mentorResourceDirectory(rows:readonly MentorResourceFact[],
 query:MentorResourceDirectoryQuery){
 const term=query.search.toLocaleLowerCase("en-IN");
 const selected=rows.filter(row=>
  (query.required==="ALL"||
   (query.required==="REQUIRED")===row.required)&&
  (query.link==="ALL"||
    (query.link==="HTTPS")===(safeHttpsResourceUrl(row.url)!==null))&&
  (query.description==="ALL"||
    (query.description==="RECORDED")===Boolean(row.description?.trim()))&&
  (!term||[row.title,row.description??""].some(x=>
   x.toLocaleLowerCase("en-IN").includes(term))))
  .sort((a,b)=>query.order==="TITLE"
   ? a.title.localeCompare(b.title)||a.sequence-b.sequence||a.id.localeCompare(b.id)
   : a.sequence-b.sequence||a.id.localeCompare(b.id));
 const total=selected.length,pageSize=20,totalPages=Math.max(1,Math.ceil(total/pageSize));
 const page=Math.min(query.page,totalPages);
 const project=(row:MentorResourceFact)=>({
  id:row.id,title:row.title,description:row.description,required:row.required,
  safeUrl:safeHttpsResourceUrl(row.url),
 });
 return {registered:rows.length,
  requiredCount:rows.filter(row=>row.required).length,
  linkableCount:rows.filter(row=>safeHttpsResourceUrl(row.url)!==null).length,
  total,page,pageSize,totalPages,
  items:selected.slice((page-1)*pageSize,page*pageSize).map(project),
  exportItems:selected.slice(0,200).map(project),
  exportOmitted:Math.max(0,total-200),
 };
}
export function mentorResourceDirectoryHref(query:MentorResourceDirectoryQuery){
 const params=new URLSearchParams();
 if(query.required!=="ALL")params.set("required",query.required);
 if(query.link!=="ALL")params.set("link",query.link);
 if(query.description!=="ALL")params.set("description",query.description);
 if(query.order!=="SEQUENCE")params.set("order",query.order);
 if(query.search)params.set("search",query.search);
 if(query.page>1)params.set("page",String(query.page));
 return "/mentor/projects/"+encodeURIComponent(query.projectId)+"/resources-directory"+
  (params.size?"?"+params.toString():"");
}
export function mentorResourceDirectoryCsv(rows:readonly {
 id:string;title:string;description:string|null;required:boolean;safeUrl:string|null;
}[],omitted:number){
 const lines=["Resource ID,Title,Description,Required,HTTPS link available"];
 const bounded=rows.slice(0,200);
 for(const row of bounded)lines.push([row.id,row.title,row.description??"",
  row.required?"Yes":"No",row.safeUrl?"Yes":"No"].map(csvSafeCell).join(","));
 const hidden=Math.max(0,rows.length-bounded.length)+
  (Number.isSafeInteger(omitted)&&omitted>0?omitted:0);
 if(hidden>0)lines.push(["","Truncated",hidden+" additional matching resources","",""]
   .map(csvSafeCell).join(","));
 return "\uFEFF"+lines.join("\r\n")+"\r\n";
}

/** Strict page-level URL boundary: unknown keys are not silently ignored. */
export function parseMentorResourceDirectorySearch(
 projectId:string,raw:Record<string,string|string[]|undefined>,
):MentorResourceDirectoryQuery|null{
 const allowed=new Set(["required","link","description","order","search","page"]);
 if(Object.keys(raw).some(key=>!allowed.has(key)))return null;
 const values=singleValueMentorFilters(raw);
 if(!values)return null;
 const parsed=mentorResourceDirectoryQuerySchema.safeParse({projectId,...values});
 return parsed.success?parsed.data:null;
}

/**
 * Source-only Mentor resource directory helpers. Callers pass already-authorized
 * project rows: these functions must not load resources or weaken role scoping.
 */
export type MentorDirectoryResource = {
  sprintId?: string | null;
  taskId?: string | null;
  pinned?: boolean;
};

/** Completed-sprint resources fold by default, but pinned references remain visible. */
export function mentorResourceEarlierScope<T extends MentorDirectoryResource>(
  rows: readonly T[],
  completedSprintIds: ReadonlySet<string>,
  collapseEarlier: boolean,
): { earlierCount: number; visibleRows: T[] } {
  const isEarlier = (row: T) =>
    !row.pinned && Boolean(row.sprintId && completedSprintIds.has(row.sprintId));
  const earlierCount = rows.filter(isEarlier).length;
  return {
    earlierCount,
    visibleRows: collapseEarlier ? rows.filter(row => !isEarlier(row)) : [...rows],
  };
}

/** A file with an openable URL remains a FILE, not a LINK. */
export function mentorResourceMatchesType(
  filter: string,
  recordedType: string | null | undefined,
  safeOpenableUrl: boolean,
): boolean {
  const kind = recordedType || (safeOpenableUrl ? "LINK" : "NOTE");
  return filter === "ALL" || (filter === "OTHER" ? kind !== "LINK" : filter === kind);
}

/** Use only authorized project sprint/task labels; never synthesize foreign names. */
export function mentorResourceLinkedScopeLabels(
  row: MentorDirectoryResource,
  sprints: readonly { id: string; label: string }[],
  tasks: readonly { id: string; label: string }[],
): string[] {
  const labels: string[] = [];
  if (row.sprintId) {
    const sprint = sprints.find(item => item.id === row.sprintId);
    labels.push(sprint ? "Sprint: " + sprint.label : "Linked sprint unavailable");
  }
  if (row.taskId) {
    const task = tasks.find(item => item.id === row.taskId);
    labels.push(task ? "Task: " + task.label : "Linked task unavailable");
  }
  return labels;
}
