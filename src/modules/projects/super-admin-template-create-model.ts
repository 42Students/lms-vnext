import {createProjectTemplateInputSchema} from "./validation";

export type TemplateCreateRelease={key:string;title:string;description:string};
export type TemplateCreateSprint={key:string;releaseKey:string;title:string;
  description:string;goal:string;dueLabel:string};
export type TemplateCreateTask={key:string;sprintKey:string;title:string;
  description:string;priority:"LOW"|"MEDIUM"|"HIGH"|"CRITICAL";acceptanceCriteria:string};
export type TemplateCreateResource={key:string;title:string;url:string;description:string};

/** Compatibility with the first-release draft as well as the old repeating
 * Create Template workflow. Row keys are stable across reorders and edits.
 */
export function initialSuperAdminTemplateDraft(input:{
 slug:string;title:string;summary:string;goal:string;summaryOverrideReason?:string;
 release?:string;sprint?:string;task?:string;priority?:string;
 acceptanceCriteria?:string;releaseDescription?:string;sprintDescription?:string;
 taskDescription?:string;overviewDescription?:string;resourceTitle?:string;
 resourceUrl?:string;deliverables?:string;definitionOfDone?:string;personas?:string;
 courseLabel?:string;phase?:string;submissionType?:string;submissionInstructions?:string;
 releases?:readonly TemplateCreateRelease[];
 sprints?:readonly TemplateCreateSprint[];
 tasks?:readonly TemplateCreateTask[];
 resources?:readonly TemplateCreateResource[];
}){
 const list=(value?:string)=>value?.split(/\r?\n/).map(v=>v.trim()).filter(Boolean)??[];
 const releases=input.releases??[{key:"release-1",title:input.release??"Release 1",
  description:input.releaseDescription??""}];
 const sprints=input.sprints??[{key:"sprint-1",releaseKey:"release-1",
  title:input.sprint??"Sprint 1",description:input.sprintDescription??"",goal:"",dueLabel:""}];
 const tasks=input.tasks??[{key:"task-1",sprintKey:"sprint-1",title:input.task??"",
  description:input.taskDescription??"",acceptanceCriteria:input.acceptanceCriteria??"",
  priority:(input.priority??"MEDIUM") as TemplateCreateTask["priority"]}];
 const resources=input.resources??(input.resourceTitle?.trim()||input.resourceUrl?.trim()
  ?[{key:"resource-1",title:input.resourceTitle??"",url:input.resourceUrl??"",description:""}]
  :[]);
 const clean=(value:string)=>value.trim();
 // Legacy create derives at most 160 characters from the first goal line,
 // falling back to the title. An explicitly different summary needs a
 // recorded human reason before it can override that default.
 const defaultSummary=(clean(input.goal).split(/\r?\n/).find(Boolean)??clean(input.title)).slice(0,160);
 const requestedSummary=clean(input.summary);
 const reason=clean(input.summaryOverrideReason??"");
 if(requestedSummary.length>160)
  throw new Error("Template summary cannot exceed 160 characters.");
 if(requestedSummary&&requestedSummary!==defaultSummary&&reason.length<10)
  throw new Error("Explain why this template needs a custom summary (at least 10 characters).");
 const derivedSummary=requestedSummary||defaultSummary;
 const payload={
  slug:clean(input.slug).toLowerCase(),title:clean(input.title),
  ...(derivedSummary?{summary:derivedSummary}:{}),
  blueprint:{
   overview:{
    ...(clean(input.goal)?{goal:clean(input.goal)}:{}),
    ...(clean(input.overviewDescription??"")?{description:clean(input.overviewDescription??"")}:{}),
    deliverables:list(input.deliverables),
    definitionOfDone:list(input.definitionOfDone),
    personas:list(input.personas),
    courseLabel:clean(input.courseLabel??"")||undefined,
    phase:clean(input.phase??"")||undefined,
    submissionType:input.submissionType||undefined,
    submissionInstructions:clean(input.submissionInstructions??"")||undefined,
   },
   releases:releases.map((row,sequence)=>({
    key:clean(row.key),title:clean(row.title),
    ...(clean(row.description)?{description:clean(row.description)}:{}),sequence,
   })),
   sprints:sprints.map((row,index)=>({
    key:clean(row.key),releaseKey:clean(row.releaseKey),title:clean(row.title),
    ...(clean(row.description)?{description:clean(row.description)}:{}),
    ...(clean(row.goal)?{goal:clean(row.goal)}:{}),
    ...(clean(row.dueLabel)?{dueLabel:clean(row.dueLabel)}:{}),
    sequence:sprints.slice(0,index).filter(s=>s.releaseKey===row.releaseKey).length,
   })),
   tasks:tasks.map((row,index)=>({
    key:clean(row.key),sprintKey:clean(row.sprintKey),title:clean(row.title),
    ...(clean(row.description)?{description:clean(row.description)}:{}),
    ...(clean(row.acceptanceCriteria)?{acceptanceCriteria:clean(row.acceptanceCriteria)}:{}),
    priority:row.priority,
    sequence:tasks.slice(0,index).filter(t=>t.sprintKey===row.sprintKey).length,
   })),
   resources:resources.map((row,sequence)=>({
    key:clean(row.key),title:clean(row.title),
    ...(clean(row.url)?{url:clean(row.url)}:{}),
    ...(clean(row.description)?{description:clean(row.description)}:{}),
    required:false,sequence,
   })),
  },
 };
 return createProjectTemplateInputSchema.parse(payload);
}
