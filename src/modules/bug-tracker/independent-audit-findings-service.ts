import "server-only";
import {and,asc,count,desc,eq,ilike,inArray,or,type SQL} from "drizzle-orm";
import {getDb} from "@/db/client";
import {db10AuditFindings,db10AuditFindingEvents} from "@/db/schema/db10-audit-findings.draft";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {independentFindingActionSchema} from "./independent-finding-actions-model";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {ACTIVE_FINDING_STATUSES,INDEPENDENT_AUDIT_PAGE_SIZE,type FindingFilters} from "./independent-audit-findings-model";

export function independentAuditFindingsReady(){
 return process.env.DB10_AUDIT_FINDINGS_READY==="DB10_VERIFIED";
}
function requireIndependentFindingAccess(context:RequestContext){
 if(!isSuperAdmin(context)||context.adminScope?.collegeId||context.adminScope?.organizationId)
  throw new AuthorizationError("admin-scope.select");
 requirePermission(context,"admin-scope.select");
}
export async function listIndependentAuditFindings(context:RequestContext,query:FindingFilters){
 requireIndependentFindingAccess(context);
 if(!independentAuditFindingsReady())throw new Error("Audit findings storage is not verified.");
 const predicates:SQL[]=[];
 const pattern="%"+query.q.replace(/[\\%_]/g,"\\$&")+"%";
 if(query.q)predicates.push(or(ilike(db10AuditFindings.title,pattern),
  ilike(db10AuditFindings.summary,pattern),ilike(db10AuditFindings.externalId,pattern))!);
 if(query.area)predicates.push(ilike(db10AuditFindings.area,"%"+query.area.replace(/[\\%_]/g,"\\$&")+"%"));
 if(query.statuses.length)predicates.push(inArray(db10AuditFindings.status,query.statuses));
 if(query.severities.length)predicates.push(inArray(db10AuditFindings.severity,query.severities));
 if(query.kinds.length)predicates.push(inArray(db10AuditFindings.kind,query.kinds));
 if(query.view!=="ALL")predicates.push(inArray(db10AuditFindings.status,[...ACTIVE_FINDING_STATUSES]));
 if(query.view==="RELEASE")predicates.push(inArray(db10AuditFindings.severity,["CRITICAL","HIGH"]));
 const where=and(...predicates);
 const db=getDb();
 const [total,items]=await Promise.all([
  db.select({n:count()}).from(db10AuditFindings).where(where),
  db.select().from(db10AuditFindings).where(where)
   .orderBy(desc(db10AuditFindings.foundAt),desc(db10AuditFindings.importedAt),asc(db10AuditFindings.id))
   .limit(INDEPENDENT_AUDIT_PAGE_SIZE).offset((query.page-1)*INDEPENDENT_AUDIT_PAGE_SIZE),
 ]);
 return {total:total[0]?.n??0,items,page:query.page,
  pages:Math.max(1,Math.ceil((total[0]?.n??0)/INDEPENDENT_AUDIT_PAGE_SIZE))};
}
export async function getIndependentAuditFinding(context:RequestContext,rawId:string){
 requireIndependentFindingAccess(context);
 if(!independentAuditFindingsReady())return null;
 if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(rawId))return null;
 const [item]=await getDb().select().from(db10AuditFindings)
  .where(eq(db10AuditFindings.externalId,rawId)).limit(1);
 return item??null;
}

/** CAS-protected edits of the independent findings table; never mutate bug reports. */
export async function mutateIndependentAuditFinding(context:RequestContext,externalId:string,raw:unknown){
 requireIndependentFindingAccess(context);
 if(!independentAuditFindingsReady())return {ok:false as const,reason:"NOT_READY"};
 const input=independentFindingActionSchema.parse(raw);
 if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(externalId))return {ok:false as const,reason:"NOT_FOUND"};
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"admin-scope.select");
  const [row]=await tx.select().from(db10AuditFindings).where(eq(db10AuditFindings.externalId,externalId))
   .for("update").limit(1);
  if(!row)return {ok:false as const,reason:"NOT_FOUND"};
  if(row.version!==input.expectedVersion)return {ok:false as const,reason:"STALE_VERSION"};
  const patch:Partial<typeof db10AuditFindings.$inferInsert>={version:row.version+1,updatedAt:new Date()};
  let note:string|null=null;
  if(input.action==="STATUS"){patch.status=input.status;note=input.note??null;}
  if(input.action==="SEVERITY")patch.severity=input.severity;
  if(input.action==="ASSIGNEE")patch.assignee=input.assignee;
  if(input.action==="DUPLICATE"){
   if(row.id===input.duplicateOf)return {ok:false as const,reason:"INVALID_DUPLICATE"};
   const [target]=await tx.select({id:db10AuditFindings.id}).from(db10AuditFindings)
    .where(eq(db10AuditFindings.id,input.duplicateOf)).limit(1);
   if(!target)return {ok:false as const,reason:"INVALID_DUPLICATE"};
   patch.duplicateOf=target.id;patch.status="DUPLICATE";
  }
  if(input.action==="FIX_COMMIT"){
   if(row.fixCommits.some(x=>x.repo===input.repo&&x.sha.toLowerCase()===input.sha.toLowerCase()))
     return {ok:false as const,reason:"DUPLICATE_COMMIT"};
   patch.fixCommits=[...row.fixCommits,{repo:input.repo,sha:input.sha.toLowerCase()}];
  }
  if(input.action==="COMMENT")note=input.note;
  const [saved]=await tx.update(db10AuditFindings).set(patch)
   .where(and(eq(db10AuditFindings.id,row.id),eq(db10AuditFindings.version,row.version)))
   .returning({id:db10AuditFindings.id,version:db10AuditFindings.version});
  if(!saved)return {ok:false as const,reason:"STALE_VERSION"};
  await tx.insert(db10AuditFindingEvents).values({
   findingId:row.id,actorUserId:context.user.id,action:input.action,note,
   fromStatus:row.status,toStatus:patch.status??row.status,
  });
  return {ok:true as const,version:saved.version};
 });
}
export async function listIndependentAuditFindingEvents(context:RequestContext,findingId:string){
 requireIndependentFindingAccess(context);
 if(!independentAuditFindingsReady())return [];
 return getDb().select({id:db10AuditFindingEvents.id,action:db10AuditFindingEvents.action,
  note:db10AuditFindingEvents.note,createdAt:db10AuditFindingEvents.createdAt,
  actorUserId:db10AuditFindingEvents.actorUserId,
  fromStatus:db10AuditFindingEvents.fromStatus,toStatus:db10AuditFindingEvents.toStatus})
  .from(db10AuditFindingEvents).where(eq(db10AuditFindingEvents.findingId,findingId))
  .orderBy(desc(db10AuditFindingEvents.createdAt)).limit(100);
}
