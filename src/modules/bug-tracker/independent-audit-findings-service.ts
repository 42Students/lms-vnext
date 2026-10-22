import "server-only";
import {and,asc,count,desc,eq,ilike,inArray,or,sql,type SQL} from "drizzle-orm";
import {getDb} from "@/db/client";
import {db10AuditFindings,db10AuditFindingEvents,db10AuditFindingSyncs,db10AuditFindingFiles} from "@/db/schema/db10-audit-findings.draft";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {independentFindingActionSchema} from "./independent-finding-actions-model";
import {canTransitionIndependentFinding,type IndependentFindingStatus} from "./independent-finding-transition-model";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {ACTIVE_FINDING_STATUSES,RELEASE_BLOCKER_FINDING_STATUSES,INDEPENDENT_AUDIT_PAGE_SIZE,type FindingFilters} from "./independent-audit-findings-model";

export function independentAuditFindingsReady(){
 return process.env.DB10_AUDIT_FINDINGS_READY==="DB10_VERIFIED";
}
/** The release flag records an operator approval, but cannot prove a
 * partially replayed schema is ready. Query the canonical tables and indexed
 * ID constraint before touching an audit record. Fail closed on DB errors.
 * This is a read-only check; it never applies migrations at runtime. */
export async function independentAuditFindingsStorageReady():Promise<boolean>{
 if(!independentAuditFindingsReady())return false;
 try{
  const result=await getDb().execute<{ok:boolean}>(sql`
   select (
    to_regclass('public.audit_findings') is not null and
    to_regclass('public.audit_finding_events') is not null and
    to_regclass('public.audit_finding_syncs') is not null and
    to_regclass('public.audit_finding_file') is not null and
    to_regclass('public.db10_audit_findings_external_id_uq') is not null and
    to_regclass('public.audit_finding_file_unique_attempt_uq') is not null
   ) as ok
  `);
  return result.rows[0]?.ok===true;
 }catch{return false;}
}
function requireIndependentFindingAccess(context:RequestContext){
 if(!isSuperAdmin(context)||context.adminScope?.collegeId||context.adminScope?.organizationId)
  throw new AuthorizationError("admin-scope.select");
 requirePermission(context,"admin-scope.select");
}
export async function listIndependentAuditFindings(context:RequestContext,query:FindingFilters){
 requireIndependentFindingAccess(context);
 if(!await independentAuditFindingsStorageReady())throw new Error("Audit findings storage is not verified.");
 const predicates:SQL[]=[];
 const pattern="%"+query.q.replace(/[\\%_]/g,"\\$&")+"%";
 const searchPredicate=query.q?or(
  ilike(db10AuditFindings.title,pattern),
  ilike(db10AuditFindings.summary,pattern),
  ilike(db10AuditFindings.externalId,pattern),
  ilike(db10AuditFindings.sourcePath,pattern),
  ilike(sql<string>`${db10AuditFindings.paths}::text`,pattern),
  ilike(sql<string>`${db10AuditFindings.pages}::text`,pattern),
  ilike(sql<string>`${db10AuditFindings.endpoints}::text`,pattern),
 ):undefined;
 if(searchPredicate)predicates.push(searchPredicate);
 // The importer admits only the 23 legacy source areas. A malformed area
 // selection must never broaden the result to an all-area search.
 const allowedAreas=new Set([
  "login","course","lesson-content","quiz","assignment","attendance",
  "classroom","notifications","calendar","projects","placements-tpo",
  "recruiter","student-placements","college-admin","super-admin",
  "groups-electives","people-accounts","reports","tracker","mobile",
  "platform","security","other",
 ]);
 const areas=[...new Set(query.area.split(",").map(value=>value.trim()).filter(Boolean))];
 if(areas.some(value=>!allowedAreas.has(value)))predicates.push(sql`false`);
 else if(areas.length)predicates.push(inArray(db10AuditFindings.area,areas));
 if(query.statuses.length)predicates.push(inArray(db10AuditFindings.status,query.statuses));
 if(query.severities.length)predicates.push(inArray(db10AuditFindings.severity,query.severities));
 if(query.kinds.length)predicates.push(inArray(db10AuditFindings.kind,query.kinds));
 if(query.view==="OPEN")predicates.push(inArray(db10AuditFindings.status,[...ACTIVE_FINDING_STATUSES]));
 if(query.view==="RELEASE"){
  predicates.push(inArray(db10AuditFindings.status,[...RELEASE_BLOCKER_FINDING_STATUSES]));
  predicates.push(inArray(db10AuditFindings.severity,["CRITICAL","HIGH"]));
 }
 // These dashboard facets summarize ALL imported findings, independent of
 // the current search, page, area, severity, status and view selections.
 // The list predicate above remains fully scoped to the active filters.
 const where=and(...predicates);
 const pageSize=query.size??INDEPENDENT_AUDIT_PAGE_SIZE;
 const db=getDb();
 const [total,items,facets]=await Promise.all([
  db.select({n:count()}).from(db10AuditFindings).where(where),
  db.select().from(db10AuditFindings).where(where)
   .orderBy(sql<number>`case ${db10AuditFindings.severity} when 'CRITICAL' then 0 when 'HIGH' then 1 when 'MEDIUM' then 2 when 'LOW' then 3 else 4 end`,desc(db10AuditFindings.foundAt),asc(db10AuditFindings.externalId))
   .limit(pageSize).offset((query.page-1)*pageSize),
  db.select({status:db10AuditFindings.status,severity:db10AuditFindings.severity,n:count()})
   .from(db10AuditFindings)
   .groupBy(db10AuditFindings.status,db10AuditFindings.severity),
 ]);
 const statusCounts:Record<string,number>={};
 const severityOpenCounts:Record<string,number>={CRITICAL:0,HIGH:0,MEDIUM:0,LOW:0};
 for(const row of facets){
  statusCounts[row.status]=(statusCounts[row.status]??0)+row.n;
  if((ACTIVE_FINDING_STATUSES as readonly string[]).includes(row.status))
   severityOpenCounts[row.severity]=(severityOpenCounts[row.severity]??0)+row.n;
 }
 const criticalOpen=facets.reduce((sum,row)=>
   row.severity==="CRITICAL"&&(ACTIVE_FINDING_STATUSES as readonly string[]).includes(row.status)?sum+row.n:sum,0);
 return {total:total[0]?.n??0,items,page:query.page,statusCounts,severityOpenCounts,criticalOpen,
  pages:Math.max(1,Math.ceil((total[0]?.n??0)/pageSize))};
}
/** Legacy duplicate dialog: compare same-area findings only. Return at most
 * five candidates, sorted by shared surface overlap then recency; never
 * accept a client-provided duplicate FK as an authorization grant. */
export async function suggestIndependentFindingDuplicates(
 context:RequestContext,externalId:string,
){
 requireIndependentFindingAccess(context);
 if(!await independentAuditFindingsStorageReady())
  throw new Error("Audit findings storage is not verified.");
 if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(externalId))return [];
 const [current]=await getDb().select({
  id:db10AuditFindings.id,area:db10AuditFindings.area,
  paths:db10AuditFindings.paths,pages:db10AuditFindings.pages,
  endpoints:db10AuditFindings.endpoints,title:db10AuditFindings.title,
 }).from(db10AuditFindings)
  .where(eq(db10AuditFindings.externalId,externalId)).limit(1);
 if(!current)return [];
 const overlap=sql<number>`(
  case when lower(${db10AuditFindings.title})=lower(${current.title}) then 4 else 0 end+
  case when exists(select 1 from jsonb_array_elements_text(${db10AuditFindings.paths}) x
      where ${JSON.stringify(current.paths)}::jsonb ? x.value) then 3 else 0 end+
  case when exists(select 1 from jsonb_array_elements_text(${db10AuditFindings.pages}) x
      where ${JSON.stringify(current.pages)}::jsonb ? x.value) then 2 else 0 end+
  case when exists(select 1 from jsonb_array_elements_text(${db10AuditFindings.endpoints}) x
      where ${JSON.stringify(current.endpoints)}::jsonb ? x.value) then 2 else 0 end
 )`;
 const rows=await getDb().select({
  externalId:db10AuditFindings.externalId,title:db10AuditFindings.title,
  status:db10AuditFindings.status,severity:db10AuditFindings.severity,
  area:db10AuditFindings.area,score:overlap,
 }).from(db10AuditFindings).where(and(
  eq(db10AuditFindings.area,current.area),
  sql`${db10AuditFindings.id} <> ${current.id}`,
  sql`${db10AuditFindings.status} <> 'DUPLICATE'`,
  sql`${overlap} > 0`,
 )).orderBy(desc(overlap),desc(db10AuditFindings.foundAt),
   asc(db10AuditFindings.externalId)).limit(5);
 return rows;
}
export async function getIndependentAuditFinding(context:RequestContext,rawId:string){
 requireIndependentFindingAccess(context);
 if(!await independentAuditFindingsStorageReady())return null;
 if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(rawId))return null;
 const [item]=await getDb().select().from(db10AuditFindings)
  .where(eq(db10AuditFindings.externalId,rawId)).limit(1);
 return item??null;
}

/** CAS-protected edits of the independent findings table; never mutate bug reports. */
export async function mutateIndependentAuditFinding(context:RequestContext,externalId:string,raw:unknown){
 requireIndependentFindingAccess(context);
 if(!await independentAuditFindingsStorageReady())return {ok:false as const,reason:"NOT_READY"};
 const input=independentFindingActionSchema.parse(raw);
 if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(externalId))return {ok:false as const,reason:"NOT_FOUND"};
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"admin-scope.select");
  const [row]=await tx.select().from(db10AuditFindings).where(eq(db10AuditFindings.externalId,externalId))
   .for("update").limit(1);
  if(!row)return {ok:false as const,reason:"NOT_FOUND"};
  if(row.version!==input.expectedVersion)return {ok:false as const,reason:"STALE_VERSION"};
  if(input.action==="STATUS"&&row.status===input.status)
    return {ok:false as const,reason:"STATUS_UNCHANGED"};
  if(input.action==="STATUS"&&!canTransitionIndependentFinding(
    row.status as IndependentFindingStatus,input.status,input.note,
  ))return {ok:false as const,reason:"INVALID_STATUS_TRANSITION"};
  const patch:Partial<typeof db10AuditFindings.$inferInsert>={version:row.version+1,updatedAt:new Date()};
  let note:string|null=null;
  if(input.action==="STATUS"){
   patch.status=input.status;note=input.note??null;
   if(row.status==="DUPLICATE"&&input.status!=="DUPLICATE")patch.duplicateOf=null;
  }
  if(input.action==="SEVERITY"){
   if(row.severity===input.severity)return {ok:false as const,reason:"SEVERITY_UNCHANGED"};
   patch.severity=input.severity;
   note=`Severity: ${row.severity} → ${input.severity}`;
  }
  if(input.action==="ASSIGNEE"){
   if(row.assignee===input.assignee)return {ok:false as const,reason:"ASSIGNEE_UNCHANGED"};
   patch.assignee=input.assignee;
   note=`Assigned to: ${row.assignee??"Nobody"} → ${input.assignee??"Nobody"}`;
  }
  if(input.action==="DUPLICATE"){
   if(row.externalId===input.duplicateOf)return {ok:false as const,reason:"INVALID_DUPLICATE"};
   const [target]=await tx.select({id:db10AuditFindings.id,status:db10AuditFindings.status})
    .from(db10AuditFindings).where(eq(db10AuditFindings.externalId,input.duplicateOf)).limit(1);
   // Distinguish a missing reference from a reference to another duplicate.
   // The old tracker explicitly says when the selected ID does not exist.
   if(!target)return {ok:false as const,reason:"DUPLICATE_TARGET_NOT_FOUND"};
   if(target.status==="DUPLICATE")return {ok:false as const,reason:"INVALID_DUPLICATE"};
   patch.duplicateOf=target.id;patch.status="DUPLICATE";
   note=`Duplicate of ${input.duplicateOf}`;
  }
  if(input.action==="FIX_COMMIT"){
   if(row.fixCommits.some(x=>x.repo===input.repo&&x.sha.toLowerCase()===input.sha.toLowerCase()))
     return {ok:false as const,reason:"DUPLICATE_COMMIT"};
   patch.fixCommits=[...row.fixCommits,{repo:input.repo,sha:input.sha}];
   note=`Commit added: ${input.repo}@${input.sha}`;
  }
  if(input.action==="COMMENT")note=input.note;
  const [saved]=await tx.update(db10AuditFindings).set(patch)
   .where(and(eq(db10AuditFindings.id,row.id),eq(db10AuditFindings.version,row.version)))
   .returning({id:db10AuditFindings.id,version:db10AuditFindings.version});
  if(!saved)return {ok:false as const,reason:"STALE_VERSION"};
  await tx.insert(db10AuditFindingEvents).values({
   findingId:row.id,actorUserId:context.user.id,action:input.action,note,
   fromStatus:row.status,toStatus:patch.status??row.status,
   fromValue:{status:row.status,severity:row.severity,assignee:row.assignee,
    duplicateOf:row.duplicateOf,fixCommits:row.fixCommits},
   toValue:{status:patch.status??row.status,severity:patch.severity??row.severity,
    assignee:patch.assignee===undefined?row.assignee:patch.assignee,
    duplicateOf:patch.duplicateOf===undefined?row.duplicateOf:patch.duplicateOf,
    fixCommits:patch.fixCommits??row.fixCommits},
  });
  return {ok:true as const,version:saved.version};
 });
}
export async function listIndependentAuditFindingEvents(context:RequestContext,findingId:string){
 requireIndependentFindingAccess(context);
 if(!await independentAuditFindingsStorageReady())return [];
 return getDb().select({id:db10AuditFindingEvents.id,action:db10AuditFindingEvents.action,
  note:db10AuditFindingEvents.note,createdAt:db10AuditFindingEvents.createdAt,
  actorUserId:db10AuditFindingEvents.actorUserId,
  fromStatus:db10AuditFindingEvents.fromStatus,toStatus:db10AuditFindingEvents.toStatus,
  fromValue:db10AuditFindingEvents.fromValue,toValue:db10AuditFindingEvents.toValue})
  .from(db10AuditFindingEvents).where(eq(db10AuditFindingEvents.findingId,findingId))
  .orderBy(desc(db10AuditFindingEvents.createdAt)).limit(100);
}

/** SA-placements-projects-120: read persisted sync evidence, never infer success
 * from an empty board or attempt provider access without verified credentials.
 */
export async function readIndependentFindingSyncState(context:RequestContext){
 requireIndependentFindingAccess(context);
 if(!await independentAuditFindingsStorageReady())return null;
 const [row]=await getDb().select({
  source:db10AuditFindingSyncs.source,
  repo:db10AuditFindingSyncs.repo,
  lastCommit:db10AuditFindingSyncs.lastCommit,
  lastSuccessAt:db10AuditFindingSyncs.lastSuccessAt,
  lastSyncedAt:db10AuditFindingSyncs.lastSyncedAt,
  lastResult:db10AuditFindingSyncs.lastResult,importedCount:db10AuditFindingSyncs.importedCount,
  refusedFiles:db10AuditFindingSyncs.refusedFiles,lastError:db10AuditFindingSyncs.lastError,
 }).from(db10AuditFindingSyncs)
  .where(eq(db10AuditFindingSyncs.source,"42Students/lms-findings")).limit(1);
 if(!row)return null;
 // The importer's refusal details are already persisted. Expose a bounded
 // diagnostic view to the authorized Super Admin, never a fabricated sync.
 const flagged=await getDb().select({
  path:db10AuditFindingFiles.sourcePath,result:db10AuditFindingFiles.result,
  checkedAt:db10AuditFindingFiles.checkedAt,
 }).from(db10AuditFindingFiles)
  .where(and(eq(db10AuditFindingFiles.source,row.source),
    inArray(db10AuditFindingFiles.result,["REFUSED","TAMPERED","DELETED"])))
  .orderBy(desc(db10AuditFindingFiles.checkedAt)).limit(200);
 const latestByPath=new Map(flagged.map(item=>[item.path,item]));
 const refusedFiles=row.refusedFiles.slice(0,200).map(file=>{
  const path=String(file.path??"").replace(/[\x00-\x1f\x7f]/g," ").slice(0,240);
  const latest=latestByPath.get(path);
  return {path,reason:String(file.reason??"").replace(/[\x00-\x1f\x7f]/g," ").slice(0,400),
   result:latest?.result??"REFUSED",checkedAt:latest?.checkedAt??null};
 });
 for(const item of flagged){
  if(!refusedFiles.some(file=>file.path===item.path))refusedFiles.push({
   path:item.path,reason:item.result==="DELETED"?"Source file was deleted":
    item.result==="TAMPERED"?"Source file changed since its verified import":
    "Importer refused this source file",result:item.result,checkedAt:item.checkedAt,
  });
 }
 return {source:row.source,repo:row.repo,lastCommit:row.lastCommit,
  lastSuccessAt:row.lastSuccessAt,
  lastSyncedAt:row.lastSyncedAt,lastResult:row.lastResult,lastError:row.lastError,
  importedCount:row.importedCount,refusedCount:Math.max(row.refusedFiles.length,refusedFiles.length),refusedFiles};
}
