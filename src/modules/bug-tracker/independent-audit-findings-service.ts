import "server-only";
import {and,asc,count,desc,eq,ilike,inArray,or,type SQL} from "drizzle-orm";
import {getDb} from "@/db/client";
import {db10AuditFindings} from "@/db/schema/db10-audit-findings.draft";
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
