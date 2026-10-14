import {z} from "zod";
import {csvSafeCell} from "./mentor-board-review-model";
export const mentorResourceDirectoryQuerySchema=z.object({
 projectId:z.string().uuid(),
 required:z.enum(["ALL","REQUIRED","OPTIONAL"]).default("ALL"),
 link:z.enum(["ALL","HTTPS","UNAVAILABLE"]).default("ALL"),
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
 for(const row of rows)lines.push([row.id,row.title,row.description??"",
  row.required?"Yes":"No",row.safeUrl?"Yes":"No"].map(csvSafeCell).join(","));
 if(omitted>0)lines.push(["","Truncated",omitted+" additional matching resources","",""]
   .map(csvSafeCell).join(","));
 return "\uFEFF"+lines.join("\r\n")+"\r\n";
}
