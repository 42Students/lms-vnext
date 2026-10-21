import { z } from "zod";

const safeToken=z.string().max(100);
const retainedKeys=[
  "taskSearch","priority","taskStatus","sprintId","releaseId",
  "activityCategory","activityFrom","activityTo",
  // Preserve the open task and page cursor while switching tabs. A task form
  // may have unsaved edits; silently clearing taskId closes the dialog.
  "taskId","taskPage","page","before","beforeId",
] as const;
/** Keep open task context and paging during tab transitions. */
export function learnerProjectTabHref(
  projectId:string,tab:string,query:Pick<URLSearchParams,"get">,
):string {
  const params=new URLSearchParams({tab});
  for(const key of retainedKeys){
    const value=query.get(key);
    if(value && safeToken.safeParse(value).success)params.set(key,value);
  }
  return "/learn/projects/"+encodeURIComponent(projectId)+"?"+params.toString();
}

/** Use with an interactive tab control before navigation when a task form is dirty. */
export function learnerProjectTabSwitchAllowed(input:{
 currentProjectId:string;targetProjectId:string;dirty:boolean;confirmedDiscard:boolean;
}):{allowed:boolean;prompt:string|null}{
 if(input.currentProjectId!==input.targetProjectId)return {allowed:true,prompt:null};
 if(input.dirty&&!input.confirmedDiscard)return {allowed:false,
  prompt:"You have unsaved changes. Discard changes and switch tabs?"};
 return {allowed:true,prompt:null};
}
