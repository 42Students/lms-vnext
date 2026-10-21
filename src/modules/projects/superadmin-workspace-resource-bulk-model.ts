import {createProjectResourceInputSchema} from "./validation";

export const SUPERADMIN_WORKSPACE_RESOURCE_MAX_ROWS=500;

/** Old workspace section-wide preflight. No database write occurs here.
 * The caller remains responsible for per-project authorization and atomic,
 * version-checked section persistence after validation succeeds.
 */
export function validateSuperAdminWorkspaceResourceRows(value:unknown){
 if(!Array.isArray(value))return {ok:false as const,
  errors:["Resource library rows must be a list."]};
 const rows:unknown[]=value;
 if(rows.length>SUPERADMIN_WORKSPACE_RESOURCE_MAX_ROWS){
  const count=rows.length;
  return {ok:false as const,errors:[
   `This section holds ${count} rows; the server accepts at most ${SUPERADMIN_WORKSPACE_RESOURCE_MAX_ROWS}. Remove ${count-SUPERADMIN_WORKSPACE_RESOURCE_MAX_ROWS} before saving.`,
  ]};
 }
 const items:Array<ReturnType<typeof createProjectResourceInputSchema.parse>>=[];
 const errors:string[]=[];
 for(let index=0;index<rows.length;index++){
  const result=createProjectResourceInputSchema.safeParse(rows[index]);
  if(result.success){items.push(result.data);continue;}
  const titleIssue=result.error.issues.some(issue=>issue.path[0]==="title");
  if(titleIssue)errors.push(`Item ${index+1}: Title required`);
  for(const issue of result.error.issues){
   if(issue.path[0]==="title")continue;
   errors.push(`Item ${index+1}: ${issue.message}`);
  }
 }
 return errors.length?{ok:false as const,errors}:{ok:true as const,items};
}
