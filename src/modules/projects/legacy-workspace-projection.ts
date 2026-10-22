/** Display-only compatibility projection for the old nested ProjectWorkspaceDTO.
 * All authorization uses the original scoped UUID workspace read. Preview tokens
 * are NOT accepted by mutation endpoints as CAS credentials.
 */
type Stamp=Date|string|null|undefined;
const ts=(v:Stamp)=>v instanceof Date?
  (Number.isFinite(v.getTime())?v.toISOString():null):v??null;
const order=<T extends {id:string;sequence:number}>(a:readonly T[])=>[...a].sort(
 (x,y)=>x.sequence-y.sequence||x.id.localeCompare(y.id));
const token=(a:readonly {id:string;updatedAt:Date}[])=>a.map(
 x=>x.id+"@"+ts(x.updatedAt)).join("|");
type Row={id:string;updatedAt:Date;sequence:number};
type Project={
 id:string;slug:string;title:string;summary:string|null;status:string;
 templateId:string|null;templateVersionId:string|null;updatedAt:Date;
 legacyProjectId?:number|null|undefined;legacyStatus?:string|null|undefined;
 legacyClassId?:number|null|undefined;legacyRevision?:number|null|undefined;
 courseLabel?:string|null|undefined;phase?:string|null|undefined;
 progressPercent:number;blocker?:string|null|undefined;nextAction?:string|null|undefined;
 dueLabel?:string|null|undefined;sectionId?:string|null|undefined;
 startDate?:Stamp;endDate?:Stamp;archivedAt?:Stamp;deletedAt?:Stamp;
 authoredBrief?:unknown;mentorName?:string|null|undefined;nextDueAt?:Stamp;
};
type Release=Row&{templateKey:string;title:string;status:string;version?:number;
 description?:string|null;deletedAt?:Stamp};
type Sprint=Row&{releaseId:string;templateKey:string;title:string;status:string;
 legacySprintKey?:string|null;legacyReleaseKey?:string|null;
 dueLabel?:string|null;description?:string|null;goal?:string|null};
type Task=Row&{sprintId:string|null;templateKey:string;title:string;status:string;
 priority:string;legacyTaskKey?:string|null;dueLabel?:string|null;
 description?:string|null;acceptanceCriteria?:string|null;
 estimatePoints?:number|null;assigneeMembershipId?:string|null};
type Resource=Row&{templateKey:string|null;legacyResourceKey?:string|null;
 title:string;status:string;resourceType:string;legacyResourceKind?:string|null;
 sprintId?:string|null;taskId?:string|null;url?:string|null;description?:string|null};
export function legacyWorkspaceProjection(input:{
 project:Project;releases:readonly Release[];sprints:readonly Sprint[];
 tasks:readonly Task[];resources:readonly Resource[];
}){
 const p=input.project,releases=order(input.releases).filter(x=>!x.deletedAt);
 const sprints=order(input.sprints),tasks=order(input.tasks),resources=order(input.resources);
 const sprintKeys=new Map(sprints.map(x=>[x.id,x.legacySprintKey??x.templateKey]));
 const releaseKeys=new Map(releases.map(x=>[x.id,x.templateKey]));
 const taskKeys=new Map(tasks.map(x=>[x.id,x.legacyTaskKey??x.templateKey]));
 return {
  id:p.id,legacyId:p.legacyProjectId??null,slug:p.slug,title:p.title,
  summary:p.summary,status:p.legacyStatus??p.status,normalizedStatus:p.status,
  templateId:p.templateId,templateVersionId:p.templateVersionId,
  legacyClassId:p.legacyClassId??null,sectionId:p.sectionId??null,
  legacyRevision:p.legacyRevision??null,
  courseLabel:p.courseLabel??null,phase:p.phase??null,
  progressPercent:p.progressPercent,blocker:p.blocker??null,
  // Preserve authored history in the database; omit stale calls to action in
  // a view-only archived workspace projection, as the legacy UI did.
  nextAction:p.status==="ARCHIVED"||p.archivedAt||p.legacyStatus?.toUpperCase()==="ARCHIVED"
    ?null:p.nextAction??null,dueLabel:p.dueLabel??null,
  startDate:ts(p.startDate),endDate:ts(p.endDate),
  // Preserve null for an unassigned legacy mentor or unscheduled milestone.
  mentorName:p.mentorName??null,nextDueAt:ts(p.nextDueAt),
  archivedAt:ts(p.archivedAt),deletedAt:ts(p.deletedAt),
  authoredBrief:p.authoredBrief??null,
  releases:releases.map(x=>({
   id:x.id,key:x.templateKey,title:x.title,status:x.status,sequence:x.sequence,
   description:x.description??null,version:x.version??0,updatedAt:ts(x.updatedAt),
  })),
  sprints:sprints.map(x=>({
   id:x.id,key:x.legacySprintKey??x.templateKey,title:x.title,
   releaseId:x.releaseId,releaseKey:x.legacyReleaseKey??releaseKeys.get(x.releaseId)??null,
   sequence:x.sequence,status:x.status,description:x.description??null,
   goal:x.goal??null,dueLabel:x.dueLabel??null,updatedAt:ts(x.updatedAt),
  })),
  tasks:tasks.map(x=>({
   id:x.id,key:x.legacyTaskKey??x.templateKey,title:x.title,
   sprintId:x.sprintId,sprintKey:x.sprintId?sprintKeys.get(x.sprintId)??null:null,
   status:x.status,priority:x.priority,sequence:x.sequence,
   description:x.description??null,acceptanceCriteria:x.acceptanceCriteria??null,
   dueLabel:x.dueLabel??null,estimatePoints:x.estimatePoints??null,
   assigneeMembershipId:x.assigneeMembershipId??null,updatedAt:ts(x.updatedAt),
  })),
  resources:resources.map(x=>({
   id:x.id,key:x.legacyResourceKey??x.templateKey??x.id,title:x.title,
   type:x.legacyResourceKind??x.resourceType,status:x.status,
   sequence:x.sequence,description:x.description??null,url:x.url??null,
   sprintKey:x.sprintId?sprintKeys.get(x.sprintId)??null:null,
   taskKey:x.taskId?taskKeys.get(x.taskId)??null:null,
   updatedAt:ts(x.updatedAt),
  })),
  // Readers can compare these to identify a stale visual snapshot. Writes
  // continue to require authoritative per-section revision tokens.
  sectionPreviewTokens:{details:ts(p.updatedAt),releases:token(releases),
   sprints:token(sprints),tasks:token(tasks),resources:token(resources)},
 };
}

/** Read-only crosswalk from legacy learner project cards to scoped vNext
 * workspace summaries. Missing values stay null; never synthesize progress
 * or claim a mentor was assigned when no membership exists.
 */
export type LegacyLearnerProjectCardInput={
 id:string;title:string;courseLabel?:string|null;mentorName?:string|null;
 phase?:string|null;nextDueAt?:Date|string|null;progressPercent?:number|null;
 status?:string|null;nextAction?:string|null;archivedAt?:Date|string|null;
};
export function legacyLearnerProjectCard(source:LegacyLearnerProjectCardInput){
 const progress=source.progressPercent;
 const valid=typeof progress==="number"&&Number.isFinite(progress)&&
   progress>=0&&progress<=100;
 const status=(source.status??"UNKNOWN").toUpperCase();
 const normalizedStatus=status==="DONE"||status==="COMPLETED"?"COMPLETED":
   status==="ARCHIVED"?"ARCHIVED":status==="DRAFT"?"DRAFT":
   status==="ACTIVE"||status==="IN_PROGRESS"?"ACTIVE":"UNKNOWN";
 return {
  projectId:source.id,title:source.title,course:source.courseLabel??null,
  mentor:source.mentorName??null,phase:source.phase??null,
  nextDue:source.nextDueAt instanceof Date?
    (Number.isFinite(source.nextDueAt.getTime())?source.nextDueAt.toISOString():null):
    source.nextDueAt??null,
  progress:valid?progress:null,status:normalizedStatus,
  legacyStatus:source.status??null,
  nextAction:normalizedStatus==="ARCHIVED"||source.archivedAt?null:source.nextAction??null,
 };
}
