/**
 * Legacy ProjectsContent -> current project read projection.
 * This adapter is display-only: neither legacy IDs nor optional mentor/course
 * labels grant membership or mutate the workspace.
 */
export const LEGACY_LEARNER_PROJECT_FIELDS=[
 {legacy:"course",source:"project course offering / section delivery",fallback:null},
 {legacy:"mentor",source:"active project_members MENTOR",fallback:null},
 {legacy:"phase",source:"current release/sprint label",fallback:null},
 {legacy:"nextDue",source:"minimum upcoming task or milestone due_at",fallback:null},
 {legacy:"progress",source:"completed assigned tasks / active task count",fallback:0},
 {legacy:"status",source:"project_instances.status",fallback:"UNKNOWN"},
] as const;

export type LegacyLearnerProjectProjection={
 id:string;course:string|null;mentor:string|null;phase:string|null;
 nextDue:string|null;progress:number;status:string;
};
export function legacyLearnerProjectProjection(source:{
 id:string;courseName?:string|null;mentorName?:string|null;
 currentPhase?:string|null;nextDueAt?:Date|string|null;
 completedTasks?:number|null;activeTasks?:number|null;status?:string|null;
}):LegacyLearnerProjectProjection {
 const active=source.activeTasks;
 const done=source.completedTasks;
 const progress=typeof active==="number"&&Number.isSafeInteger(active)&&active>0&&
   typeof done==="number"&&Number.isSafeInteger(done)&&done>=0
   ?Math.round(Math.min(1,done/active)*100):0;
 const due=source.nextDueAt instanceof Date
   ?Number.isFinite(source.nextDueAt.getTime())?source.nextDueAt.toISOString():null
   :typeof source.nextDueAt==="string"&&!Number.isNaN(Date.parse(source.nextDueAt))
     ?new Date(source.nextDueAt).toISOString():null;
 return {id:source.id,course:source.courseName?.trim()||null,
  mentor:source.mentorName?.trim()||null,phase:source.currentPhase?.trim()||null,
  nextDue:due,progress,status:source.status?.trim()||"UNKNOWN"};
}
