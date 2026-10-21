import "server-only";
import {and,eq,ne,asc} from "drizzle-orm";
import {getDb} from "@/db/client";
import {db10AuditFindings} from "@/db/schema/db10-audit-findings.draft";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";

/** Mirrors the legacy same-area title similarity threshold. Search all
 * authorized titles, not merely the first page of an unfiltered board. */
function tokens(title:string){
 return new Set(title.toLocaleLowerCase("en").replace(/[^a-z0-9 ]/g," ")
  .split(/\s+/).filter(word=>word.length>3));
}
export async function listSimilarIndependentFindings(context:RequestContext,
 finding:{id:string;area:string;title:string}){
 if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE"||
  context.adminScope?.collegeId||context.adminScope?.organizationId)
  throw new AuthorizationError("admin-scope.select");
 requirePermission(context,"admin-scope.select");
 const words=tokens(finding.title);
 if(!words.size)return [];
 const rows=await getDb().select({id:db10AuditFindings.id,
  externalId:db10AuditFindings.externalId,
  title:db10AuditFindings.title,
  status:db10AuditFindings.status,
  severity:db10AuditFindings.severity,
 }).from(db10AuditFindings).where(and(
  eq(db10AuditFindings.area,finding.area),ne(db10AuditFindings.id,finding.id)))
  .orderBy(asc(db10AuditFindings.externalId));
 const similar:typeof rows=[];
 for(const item of rows){
  const other=tokens(item.title);
  if(!other.size)continue;
  let both=0;
  for(const word of words)if(other.has(word))both++;
  if(both/Math.min(words.size,other.size)>=0.6)similar.push(item);
  if(similar.length>=5)break;
 }
 return similar;
}
