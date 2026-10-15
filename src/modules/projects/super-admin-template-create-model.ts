import {createProjectTemplateInputSchema} from "./validation";
export function initialSuperAdminTemplateDraft(input:{
 slug:string;title:string;summary:string;goal:string;release:string;sprint:string;task:string; priority?:string; acceptanceCriteria?:string; releaseDescription?:string; sprintDescription?:string; taskDescription?:string; overviewDescription?:string; resourceTitle?:string; resourceUrl?:string;
}){
 const resourceTitle=input.resourceTitle?.trim()??"";
 const resourceUrl=input.resourceUrl?.trim()??"";
 if(Boolean(resourceTitle)!==Boolean(resourceUrl))throw new Error("Resource title and URL must both be provided.");
 return createProjectTemplateInputSchema.parse({
  slug:input.slug.trim().toLowerCase(),title:input.title.trim(),
  ...(input.summary.trim()?{summary:input.summary.trim()}:{}),
  blueprint:{
   overview:{...(input.goal.trim()?{goal:input.goal.trim()}:{}),...(input.overviewDescription?.trim()?{description:input.overviewDescription.trim()}:{}),deliverables:[]},
   releases:[{key:"release-1",title:input.release.trim(),...(input.releaseDescription?.trim()?{description:input.releaseDescription.trim()}:{}),sequence:0}],
   sprints:[{key:"sprint-1",releaseKey:"release-1",title:input.sprint.trim(),...(input.sprintDescription?.trim()?{description:input.sprintDescription.trim()}:{}),sequence:0}],
   tasks:[{key:"task-1",sprintKey:"sprint-1",title:input.task.trim(),...(input.taskDescription?.trim()?{description:input.taskDescription.trim()}:{}),priority:input.priority??"MEDIUM",...(input.acceptanceCriteria?.trim()?{acceptanceCriteria:input.acceptanceCriteria.trim()}:{}),sequence:0}],
   resources:resourceTitle&&resourceUrl?[{key:"resource-1",title:resourceTitle,url:resourceUrl,required:false,sequence:0}]:[],
  },
 });
}
