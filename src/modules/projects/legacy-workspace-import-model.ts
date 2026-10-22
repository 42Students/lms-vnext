/** Import planner for old workspace snapshots. IDs here are source provenance,
 * never authorization or writable vNext membership identifiers. Persist only
 * after a separate college-scoped actor/section/template crosswalk succeeds.
 */
export type LegacyKeyRow={
 key?:string|null;
 _clientId?:string|null;
 title:string;
 /** Former titles/keys recorded before a user renamed an unsaved sprint. */
 legacyKeyAliases?:readonly string[];
};
export type LegacySprintInput=LegacyKeyRow;
export type LegacyTaskInput=LegacyKeyRow&{sprintKey?:string|null};
const clean=(value:string|null|undefined)=>value?.trim()??"";
const slug=(value:string)=>value.toLowerCase().trim()
 .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
function safeKey(title:string,prefix:string,index:number,used:Set<string>){
 const base=(slug(title)||prefix+"-"+(index+1)).slice(0,60);
 let key=base,suffix=2;
 while(used.has(key)){
  const end="-"+suffix++;
  key=base.slice(0,64-end.length)+end;
 }
 used.add(key);
 return key;
}
function explicitKeys(rows:readonly LegacyKeyRow[],kind:string){
 const used=new Set<string>();
 for(const row of rows){
  const key=clean(row.key);
  if(!key)continue;
  if(key.length>64||used.has(key))
   throw new Error("Duplicate or overlong explicit "+kind+" key: "+key);
  used.add(key);
 }
 return used;
}
function alias(map:Map<string,string|null>,candidate:string,finalKey:string){
 if(!candidate)return;
 const existing=map.get(candidate);
 if(existing===undefined)map.set(candidate,finalKey);
 else if(existing!==finalKey)map.set(candidate,null);
}
/** Resolve provisional sprint keys with stable _clientId priority, keeping
 * ambiguous duplicate titles unresolved rather than assigning tasks randomly.
 * Never silently repoint tasks when a sprint row is deleted or renamed.
 */
export function materializeLegacyWorkspaceKeys(
 sprintRows:readonly LegacySprintInput[],taskRows:readonly LegacyTaskInput[],
){
 const sprintUsed=explicitKeys(sprintRows,"sprint");
 const aliases=new Map<string,string|null>();
 const sprints=sprintRows.map((row,index)=>{
  const explicit=clean(row.key);
  const finalKey=explicit||safeKey(row.title,"sprint",index,sprintUsed);
  alias(aliases,finalKey,finalKey);
  alias(aliases,clean(row._clientId),finalKey);
  alias(aliases,clean(row.title),finalKey);
  for(const former of row.legacyKeyAliases??[])alias(aliases,clean(former),finalKey);
  return {key:finalKey,title:row.title,legacyKey:explicit||null,
   legacyClientId:clean(row._clientId)||null};
 });
 const taskUsed=explicitKeys(taskRows,"task");
 const unresolvedLinks:{taskKey:string;oldSprintKey:string;reason:"MISSING"|"AMBIGUOUS"}[]=[];
 const tasks=taskRows.map((row,index)=>{
  const explicit=clean(row.key);
  const key=explicit||safeKey(row.title,"task",index,taskUsed);
  const oldSprintKey=clean(row.sprintKey);
  let mapped:string|null=null;
  if(oldSprintKey){
   const found=aliases.get(oldSprintKey);
   if(found)mapped=found;
   else unresolvedLinks.push({taskKey:key,oldSprintKey,
    reason:aliases.has(oldSprintKey)?"AMBIGUOUS":"MISSING"});
  }
  return {key,title:row.title,sprintKey:mapped,
   legacySprintKey:oldSprintKey||null,legacyTaskKey:explicit||null,
   legacyClientId:clean(row._clientId)||null};
 });
 return {sprints,tasks,unresolvedLinks,readyToPersist:unresolvedLinks.length===0};
}

export type LegacyWorkspaceStatus=
 "ACTIVE"|"IN_PROGRESS"|"READY"|"BLOCKED"|"ARCHIVED";
/** Deleted and archived are distinct source states: a deleted workspace is
 * recoverable in the recycle view, whereas an archived workspace can be read
 * without inventing a deletion timestamp. */
export function mapLegacyWorkspaceLifecycle(
 rawStatus:string|null|undefined,deletedAt:string|null=null,
){
 const normalized=clean(rawStatus).toUpperCase().replace(/[\s-]+/g,"_");
 const recognized:readonly string[]=["ACTIVE","IN_PROGRESS","READY","BLOCKED","ARCHIVED"];
 const workflowStatus=normalized||"ACTIVE";
 const needsReview=!recognized.includes(workflowStatus);
 const status=workflowStatus==="ARCHIVED"?"ARCHIVED" as const:
  workflowStatus==="READY"?"PLANNED" as const:
  workflowStatus==="ACTIVE"||workflowStatus==="IN_PROGRESS"||workflowStatus==="BLOCKED"
   ?"ACTIVE" as const:"PLANNED" as const;
 return {status,legacyStatus:rawStatus??null,
  workflowStatus:workflowStatus as LegacyWorkspaceStatus|string,
  isBlocked:workflowStatus==="BLOCKED",isReady:workflowStatus==="READY",
  deletedAt,canRestoreDeleted:deletedAt!==null,
  isArchived:status==="ARCHIVED",needsReview};
}

/** Lossless display-only source task facts. Actor integer IDs are deliberately
 * namespaced by actor type; a matching numeric ID from another identity table
 * never authorizes task mutations or author attribution. */
export function projectLegacyTaskProvenance(source:{
 taskKey:string|null;dueLabel:string|null;sprintKey:string|null;
 sprintLabel:string|null;status:string;priority:string|null;
 submittedBy:number|null;submittedAt:string|null;
 createdBy:number|null;createdByType:string|null;
 carriedOverFromSprintKey:string|null;
 submissionUrl:string|null;removedFromTemplate:boolean|null;
 version:number|null;
}){
 return {
  legacyTaskKey:source.taskKey,
  dueLabel:source.dueLabel,
  legacySprintKey:source.sprintKey,
  legacySprintLabel:source.sprintLabel,
  legacyStatus:source.status,
  legacyPriority:source.priority,
  submission:{url:source.submissionUrl,
   at:source.submittedAt,byLegacyLearnerId:source.submittedBy},
  creator:{legacyId:source.createdBy,legacyType:source.createdByType,
   membershipId:null as string|null,attributionVerified:false},
  carriedOverFromSprintKey:source.carriedOverFromSprintKey,
  removedFromTemplate:source.removedFromTemplate,
  legacyVersion:source.version,
 };
}
