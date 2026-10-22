import { z } from "zod";

const safeToken=z.string().max(100);
const retainedKeys=[
  "taskSearch","priority","taskStatus","sprintId","releaseId",
  "activityCategory","activityFrom","activityTo",
  // Preserve the open task and page cursor while switching tabs. A task form
  // may have unsaved edits; silently clearing taskId closes the dialog.
  "taskId","taskPage","page","before","beforeId",
  "taskSort","assignee","activityBeforeTime","activityBeforeId",
] as const;
/** Keep open task context and paging during tab transitions. */
export function learnerProjectTabHref(
  projectId:string,tab:string,query:Pick<URLSearchParams,"get">,
  currentProjectId:string=projectId,
):string {
  const params=new URLSearchParams({tab});
  // A different project/account must not inherit another project's open
  // editor, cursor, or private in-progress filters.
  if(currentProjectId!==projectId)
    return "/learn/projects/"+encodeURIComponent(projectId)+"?"+params.toString();
  for(const key of retainedKeys){
    const value=query.get(key);
    if(value && safeToken.safeParse(value).success)params.set(key,value);
  }
  return "/learn/projects/"+encodeURIComponent(projectId)+"?"+params.toString();
}

/** Keep the selected task editor mounted when the query switches tabs.
 * Client tab controls should remember the opener element and restore focus
 * there after closing the task modal; the model retains taskId on navigation.
 */
export function learnerProjectTaskFocusOnTabChange(input:{
 activeTaskId:string|null;targetTab:string;dirty:boolean;
}):{keepOpen:boolean;requiresConfirmation:boolean;restoreFocusTo:string|null}{
 return {keepOpen:Boolean(input.activeTaskId),
  requiresConfirmation:Boolean(input.activeTaskId&&input.dirty),
  restoreFocusTo:input.activeTaskId?"[data-task-id='"+input.activeTaskId.replace(/[^a-zA-Z0-9-]/g,"")+"']":null};
}
/** Use with an interactive tab control before navigation when a task form is dirty. */
export function learnerProjectTabSwitchAllowed(input:{
 currentProjectId:string;targetProjectId:string;dirty:boolean;confirmedDiscard:boolean;
}):{allowed:boolean;prompt:string|null}{
 if(input.dirty&&!input.confirmedDiscard)return {allowed:false,
  prompt:input.currentProjectId!==input.targetProjectId
   ?"You have unsaved changes. Discard changes and switch projects?"
   :"You have unsaved changes. Discard changes and switch tabs?"};
 return {allowed:true,prompt:null};
}
