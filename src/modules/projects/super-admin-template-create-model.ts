import {createProjectTemplateInputSchema} from "./validation";
export function initialSuperAdminTemplateDraft(input:{
 slug:string;title:string;summary:string;goal:string;release:string;sprint:string;task:string; priority?:string;
}){
 return createProjectTemplateInputSchema.parse({
  slug:input.slug.trim().toLowerCase(),title:input.title.trim(),
  ...(input.summary.trim()?{summary:input.summary.trim()}:{}),
  blueprint:{
   overview:{...(input.goal.trim()?{goal:input.goal.trim()}:{}),deliverables:[]},
   releases:[{key:"release-1",title:input.release.trim(),sequence:0}],
   sprints:[{key:"sprint-1",releaseKey:"release-1",title:input.sprint.trim(),sequence:0}],
   tasks:[{key:"task-1",sprintKey:"sprint-1",title:input.task.trim(),priority:input.priority??"MEDIUM",sequence:0}],
   resources:[],
  },
 });
}
