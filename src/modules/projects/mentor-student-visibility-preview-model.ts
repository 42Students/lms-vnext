/** Only an explicit allowlist leaves the Mentor workspace. This mirrors
 * shared project task/resource visibility without impersonating a real learner.
 * A student's private "mine" and membership-specific state is intentionally
 * absent from the preview.
 */
export type StudentPreviewTaskInput={
 id:string;title:string;status:string;priority:string;
 sprintId:string|null;deletedAt?:Date|null;estimatePoints:number|null;
};
export type StudentPreviewResourceInput={
 id:string;title:string;status:string;visibility:string;
 description:string|null;url:string|null;resourceType?:string|null;
};
export function mentorStudentVisibilityPreview(input:{
 project:{id:string;title:string;summary:string|null;status:string};
 sprints:readonly {id:string;title:string;status:string;sequence:number}[];
 tasks:readonly StudentPreviewTaskInput[];
 resources:readonly StudentPreviewResourceInput[];
}){
 const project={
   id:input.project.id,title:input.project.title,
   summary:input.project.summary,status:input.project.status,
 };
 const sprints=input.sprints.filter(row=>row.status!=="ARCHIVED")
   .map(row=>({id:row.id,title:row.title,status:row.status,sequence:row.sequence}));
 const tasks=input.tasks.filter(row=>!row.deletedAt)
   .map(row=>({id:row.id,title:row.title,status:row.status,
     priority:row.priority,sprintId:row.sprintId,
     estimatePoints:row.estimatePoints}));
 const resources=input.resources.filter(row=>
   row.status==="ACTIVE"&&row.visibility==="TEAM")
   .map(row=>({id:row.id,title:row.title,
     description:row.description,
     resourceType:row.resourceType??null,
     url:safePreviewHttpUrl(row.url)}));
 return {project,sprints,tasks,resources};
}
export function safePreviewHttpUrl(url:string|null):string|null{
 if(!url||url.length>2048)return null;
 try{
  const parsed=new URL(url);
  if(!["https:","http:"].includes(parsed.protocol)||
      !parsed.hostname||parsed.username||parsed.password)return null;
  return parsed.toString();
 }catch{return null;}
}
