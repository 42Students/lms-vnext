import "server-only";
import {and,desc,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {db10AuditFindingFiles,db10AuditFindings,db10AuditFindingEvents}
 from "@/db/schema/db10-audit-findings.draft";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {independentAuditFindingsReady} from "./independent-audit-findings-service";

const sourceData=z.strictObject({
 externalId:z.string().min(1).max(120),
 title:z.string().min(1).max(2000),
 summary:z.string().min(1).max(20000),
 area:z.string().min(1).max(80),
 kind:z.enum(["BUG","SECURITY","DATA","UX","COPY","PERFORMANCE","ACCESSIBILITY"]),
 severity:z.enum(["CRITICAL","HIGH","MEDIUM","LOW"]),
 reportedSeverity:z.string().max(32).nullable().optional(),
 roles:z.array(z.string().max(64)).max(30).default([]),
 environment:z.string().max(80).nullable().optional(),
 duplicateOf:z.string().uuid().nullable().optional(),
 fixCommits:z.array(z.strictObject({
  repo:z.string().max(180),sha:z.string().regex(/^[a-f0-9]{40}$/),
 })).max(20).default([]),
});
const sourceFile=z.strictObject({
 source:z.string().trim().min(1).max(120),
 sourcePath:z.string().trim().min(1).max(500),
 blobSha:z.string().regex(/^[a-f0-9]{40}([a-f0-9]{24})?$/),
 sourceCommitSha:z.string().regex(/^[a-f0-9]{40}$/).nullable().optional(),
 runId:z.string().max(120).nullable().optional(),
 action:z.enum(["IMPORT","UPDATE","DELETE"]),
 finding:sourceData.optional(),
}).refine(input=>input.action==="DELETE"||!!input.finding,{
 path:["finding"],message:"Source finding content required",
});
/** Super Admin-only, append-only source ledger. A changed accepted file must
 * be reviewed rather than silently replacing imported records or severity.
 * Deleted source files remain visible as tombstone evidence. */
export async function ingestIndependentAuditFindingFile(
 context:RequestContext,raw:unknown,
){
 if(!isSuperAdmin(context)||context.adminScope?.collegeId||context.adminScope?.organizationId)
  throw new Error("AUDIT_IMPORT_FORBIDDEN");
 requirePermission(context,"admin-scope.select");
 if(!independentAuditFindingsReady())throw new Error("AUDIT_IMPORT_PENDING");
 const input=sourceFile.parse(raw);
 return getDb().transaction(async tx=>{
  // Serialize imports by source path; distinct sources remain independent.
  await tx.execute(sql`select pg_advisory_xact_lock(
   hashtext(${input.source}),hashtext(${input.sourcePath}))`);
  const [same]=await tx.select().from(db10AuditFindingFiles).where(and(
   eq(db10AuditFindingFiles.source,input.source),
   eq(db10AuditFindingFiles.sourcePath,input.sourcePath),
   eq(db10AuditFindingFiles.blobSha,input.blobSha),
   eq(db10AuditFindingFiles.action,input.action),
  )).limit(1);
  if(same)return {fileId:same.id,result:same.result,replayed:true};
  const [accepted]=await tx.select().from(db10AuditFindingFiles)
   .where(and(eq(db10AuditFindingFiles.source,input.source),
     eq(db10AuditFindingFiles.sourcePath,input.sourcePath),
     eq(db10AuditFindingFiles.result,"ACCEPTED")))
   .orderBy(desc(db10AuditFindingFiles.checkedAt)).limit(1);
  const changed=Boolean(accepted&&accepted.blobSha!==input.blobSha);
  let findingId=accepted?.findingId??null;
  let result:"ACCEPTED"|"TAMPERED"|"DELETED"|"REFUSED"=
   input.action==="DELETE"?"DELETED":changed?"TAMPERED":"ACCEPTED";
  let errorCode:string|null=changed?"SOURCE_BLOB_CHANGED":null;
  if(result==="ACCEPTED"){
   const finding=input.finding!;
   const [existing]=await tx.select({
    id:db10AuditFindings.id,sourcePath:db10AuditFindings.sourcePath,
    sourceRepo:db10AuditFindings.sourceRepo,
   }).from(db10AuditFindings).where(
    eq(db10AuditFindings.externalId,finding.externalId)).limit(1);
   if(existing&&
      (existing.sourcePath!==input.sourcePath||existing.sourceRepo!==input.source)){
     result="REFUSED";
     errorCode="EXTERNAL_ID_COLLISION";
   }else if(existing)findingId=existing.id;
   else{
    const [created]=await tx.insert(db10AuditFindings).values({
     externalId:finding.externalId,title:finding.title,summary:finding.summary,
     area:finding.area,kind:finding.kind,severity:finding.severity,
     reportedSeverity:finding.reportedSeverity??null,
     roles:finding.roles,environment:finding.environment??null,
     duplicateOf:finding.duplicateOf??null,
     fixCommits:finding.fixCommits,
     status:"NEW",sourceRepo:input.source,
     sourcePath:input.sourcePath,sourceCommitSha:input.sourceCommitSha??null,
    }).returning({id:db10AuditFindings.id});
    findingId=created.id;
    await tx.insert(db10AuditFindingEvents).values({
     findingId:created.id,actorKind:"SYNC_AGENT",
     actorLabel:"Authorized Super Admin file import",
     sourceFile:input.sourcePath,sourceCommitSha:input.sourceCommitSha??null,
     action:"COMMENT",note:"First accepted source file; actor-approved import",
    });
   }
  }
  const [file]=await tx.insert(db10AuditFindingFiles).values({
   source:input.source,sourcePath:input.sourcePath,blobSha:input.blobSha,
   action:input.action,result,errorCode,findingId,
   sourceCommitSha:input.sourceCommitSha??null,runId:input.runId??null,
  }).returning({id:db10AuditFindingFiles.id});
  return {fileId:file.id,result,replayed:false,findingId};
 });
}
