import {z} from "zod";
/** LEARNER-course-detail-03 / LEARNER-learning-misc-02: published
 * instructor material links are distinct from learner submission links. */
export const facultyAssignmentMaterialLinkSchema=z.object({
 title:z.string().trim().min(1).max(160),
 externalUrl:z.string().url().max(2048).refine(raw=>{
  try{
   const url=new URL(raw);
   return url.protocol==="https:"&&!url.username&&!url.password&&
    !url.hash&&!["localhost","127.0.0.1","::1","[::1]"].includes(url.hostname.toLowerCase());
  }catch{return false;}
 },"Use a public HTTPS resource link"),
}).strict();
export type FacultyAssignmentMaterialLink=z.infer<typeof facultyAssignmentMaterialLinkSchema>;
export function safeLearnerAssignmentMaterialLink(value:string|null|undefined):string|null{
 const parsed=facultyAssignmentMaterialLinkSchema.safeParse({title:"Material",externalUrl:value});
 return parsed.success?parsed.data.externalUrl:null;
}
