import "server-only";
import {and,desc,eq,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
 db10AuditFindings,db10AuditFindingEvents,db10AuditFindingFiles,db10AuditFindingSyncs,
} from "@/db/schema/db10-audit-findings.draft";
import {readAuditGithubInbox,independentAuditGithubConfigured} from "./independent-audit-github-client";
import {
 validateIndependentAuditInboxFile,type IndependentAuditInboxPayload,
} from "./independent-audit-inbox-model";
import {independentAuditFindingsReady} from "./independent-audit-findings-service";

const SOURCE="42Students/lms-findings";
const RUN_MAX_FILES=40;
const TIME_BUDGET_MS=210_000;
const fixable=new Set(["NEW","CONFIRMED","IN_PROGRESS","NEEDS_INFO","CANT_REPRODUCE"]);

/** The ledger is absent from the registered DB migration as of 0197.
 * This gate MUST stay closed until a separate serialized, replayed migration
 * creates audit_finding_file with the schema's unique constraints. */
export function independentAuditImporterReady(){
 return independentAuditFindingsReady() &&
  process.env.DB10_AUDIT_FINDINGS_LEDGER_READY==="LEDGER_VERIFIED" &&
  independentAuditGithubConfigured();
}
type LedgerAction="IMPORT"|"UPDATE"|"DELETE";
type LedgerResult="ACCEPTED"|"UNCHANGED"|"TAMPERED"|"DELETED"|"REFUSED";
export type AuditImportResult={
 ran:boolean;busy:boolean;commit:string|null;imported:number;updates:number;
 refused:number;tampered:number;deleted:number;message:string;
};
function safeReason(_error:unknown){return "Import refused: source data failed validation or consistency checks";}
function ledgerAction(item:IndependentAuditInboxPayload):LedgerAction{
 return item.type==="finding"?"IMPORT":"UPDATE";
}
/** Importer updates only *authorized, validated* immutable files. A change to
 * an already accepted file is never replayed, even when SHA has changed.
 * A new valid agent update can append history and merge commits. */
export async function syncIndependentAuditInbox():Promise<AuditImportResult>{
 if(!independentAuditImporterReady())
  return {ran:false,busy:false,commit:null,imported:0,updates:0,
   refused:0,tampered:0,deleted:0,message:"Sync is not set up on this server"};
 const inbox=await readAuditGithubInbox();
 const started=Date.now();
 const ordered=[...inbox.items].sort((a,b)=>
  Number(a.path.includes(".u"))-Number(b.path.includes(".u"))||
  a.path.localeCompare(b.path));
 const present=new Set(inbox.items.map(item=>item.path));
 const runId=inbox.commit.slice(0,12)+"-"+String(started);
 const now=new Date();
 const stats={imported:0,updates:0,refused:0,tampered:0,deleted:0};
 const db=getDb();
 return db.transaction(async tx=>{
  // Distributed, transaction-scoped, non-blocking lease. A competing manual
  // or scheduled runner must never modify the same ledger concurrently.
  const lock=await tx.execute<{acquired:boolean}>(sql`
    select pg_try_advisory_xact_lock(4217, 1004) as acquired`);
  if(lock.rows[0]?.acquired!==true)
   return {ran:false,busy:true,commit:null,...stats,
    message:"Another audit importer already holds the sync lease"};
  await tx.execute(sql`set local statement_timeout = '230s'`);
  const historical=await tx.select().from(db10AuditFindingFiles)
   .where(eq(db10AuditFindingFiles.source,SOURCE))
   .orderBy(desc(db10AuditFindingFiles.checkedAt)).limit(20000);
  // A history cap must be detected: treating a truncated ledger as empty
  // could re-import an accepted file and destroy append-only provenance.
  if(historical.length>=20000)
   throw new Error("Audit import ledger exceeds the safe scan bound");
  const accepted=new Map<string,(typeof historical)[number]>();
  const seen=new Set<string>();
  const previousProblems=new Map<string,string>();
  for(const row of historical){
   seen.add(row.sourcePath+"|"+row.blobSha+"|"+row.action);
   if(!previousProblems.has(row.sourcePath)){
    previousProblems.set(row.sourcePath,row.result==="REFUSED"
     ?"REJECTED: invalid or unsafe inbox file":row.result==="TAMPERED"
     ?"TAMPERED: changed after import":row.result==="DELETED"
     ?"DELETED: source file removed after import":"");
   }
   if(row.result==="ACCEPTED"&&!accepted.has(row.sourcePath))
    accepted.set(row.sourcePath,row);
  }
  const problems:{path:string;reason:string}[]=[];
  async function event(
   findingId:string,action:"COMMENT"|"STATUS",path:string,actor:string,
   note:string,fromStatus:string|null,toStatus:string|null,
   commits:{repo:string;sha:string}[]=[],
  ){
   await tx.insert(db10AuditFindingEvents).values({
    findingId,actorUserId:null,actorKind:"SYNC_AGENT",actorLabel:actor.slice(0,150),
    action,note:note.slice(0,4000),sourceFile:path,
    sourceCommitSha:inbox.commit,relatedCommits:commits,
    fromStatus,toStatus,createdAt:now,
   });
  }
  async function record(path:string,sha:string,action:LedgerAction,
   result:LedgerResult,findingId:string|null,errorCode:string|null){
   const key=path+"|"+sha+"|"+action;
   if(seen.has(key))return false;
   const rows=await tx.insert(db10AuditFindingFiles).values({
    source:SOURCE,sourcePath:path,blobSha:sha,action,result,
    errorCode,findingId,runId,sourceCommitSha:inbox.commit,checkedAt:now,
   }).onConflictDoNothing().returning({id:db10AuditFindingFiles.id});
   seen.add(key);
   return rows.length===1;
  }
  for(const file of ordered){
   const old=accepted.get(file.path);
   const action:LedgerAction=file.path.includes(".u")?"UPDATE":"IMPORT";
   if(old){
    if(old.blobSha===file.sha)continue;
    if(await record(file.path,file.sha,action,"TAMPERED",old.findingId,"CHANGED_AFTER_IMPORT")){
     stats.tampered++;
     if(old.findingId)await event(old.findingId,"COMMENT",file.path,"importer",
      "The original inbox file changed after import; changed content ignored.",
      null,null);
    }
    problems.push({path:file.path,reason:"TAMPERED: changed after import"});
    continue;
   }
   if(seen.has(file.path+"|"+file.sha+"|"+action))continue;
   if(stats.imported+stats.updates+stats.refused>=RUN_MAX_FILES ||
      Date.now()-started>TIME_BUDGET_MS)break;
   let parsed:ReturnType<typeof validateIndependentAuditInboxFile>;
   try{parsed=validateIndependentAuditInboxFile(file.path,await inbox.readBlob(file));}
   catch(error){parsed={ok:false,reasons:[safeReason(error)]};}
   if(!parsed.ok){
    await record(file.path,file.sha,action,"REFUSED",null,"INVALID_FILE");
    problems.push({path:file.path,reason:"REJECTED: invalid or unsafe inbox file"});
    stats.refused++;
    continue;
   }
   const input=parsed.payload;
   // Keep GitHub filename semantics tied to its type. No update record may
   // masquerade as a base finding, and vice versa.
   if(ledgerAction(input)!==action){
    await record(file.path,file.sha,action,"REFUSED",null,"INVALID_FILE_TYPE");
    problems.push({path:file.path,reason:"REJECTED: filename/type mismatch"});
    stats.refused++;continue;
   }
   if(input.type==="finding"){
    const existing=await tx.select({id:db10AuditFindings.id})
     .from(db10AuditFindings)
     .where(eq(db10AuditFindings.externalId,input.id)).limit(1);
    const references=[...(input.related??[]),...(input.duplicate_of?[input.duplicate_of]:[])];
    const known=references.length?await tx.select({externalId:db10AuditFindings.externalId,
      id:db10AuditFindings.id}).from(db10AuditFindings)
      .where(inArray(db10AuditFindings.externalId,references)):[];
    const duplicate=known.find(row=>row.externalId===input.duplicate_of);
    if(existing.length||known.length!==new Set(references).size||
       (input.duplicate_of&&!duplicate)){
      await record(file.path,file.sha,action,"REFUSED",null,"INVALID_REFERENCE_OR_ID");
      problems.push({path:file.path,reason:"REJECTED: duplicate finding or unknown related ID"});
      stats.refused++;continue;
    }
    const [saved]=await tx.insert(db10AuditFindings).values({
     externalId:input.id,title:input.title,summary:input.summary,
     area:input.area,kind:input.kind.toUpperCase(),
     severity:input.severity.toUpperCase(),reportedSeverity:input.severity.toUpperCase(),
     roles:input.roles,environment:input.environment,
     status:duplicate?"DUPLICATE":"NEW",foundBy:input.found_by.agent,
     foundAt:new Date(input.found_at),sourceRepo:SOURCE,sourcePath:file.path,
     sourceCommitSha:inbox.commit,paths:input.where.paths??[],
     pages:input.where.pages??[],endpoints:input.where.endpoints??[],
     steps:input.steps?.join("\n")??null,expected:input.expected??null,
     actual:input.actual??null,evidence:input.evidence??null,
     suggestedFix:input.suggested_fix??null,duplicateOf:duplicate?.id??null,
     importedAt:now,updatedAt:now,
    }).onConflictDoNothing().returning({id:db10AuditFindings.id});
    if(!saved){
     await record(file.path,file.sha,action,"REFUSED",null,"DUPLICATE_FINDING");
     problems.push({path:file.path,reason:"REJECTED: duplicate finding ID"});
     stats.refused++;continue;
    }
    await event(saved.id,"COMMENT",file.path,input.found_by.agent,
     "Imported from immutable findings repository ("+input.severity+")",
     null,duplicate?"DUPLICATE":"NEW");
    await record(file.path,file.sha,action,"ACCEPTED",saved.id,null);
    stats.imported++;continue;
   }
   const [finding]=await tx.select().from(db10AuditFindings)
    .where(eq(db10AuditFindings.externalId,input.finding))
    .for("update").limit(1);
   if(!finding){
    await record(file.path,file.sha,action,"REFUSED",null,"FINDING_NOT_FOUND");
    problems.push({path:file.path,reason:"REJECTED: referenced finding does not exist"});
    stats.refused++;continue;
   }
   const oldCommits=finding.fixCommits??[];
   const combined=[...oldCommits];
   for(const commit of input.commits??[]){
    if(!combined.some(c=>c.repo===commit.repo&&c.sha===commit.sha))
     combined.push(commit);
   }
   const transition=input.status==="fixed"&&fixable.has(finding.status);
   await tx.update(db10AuditFindings).set({
    ...(combined.length!==oldCommits.length?{fixCommits:combined}:{}),
    ...(transition?{status:"FIXED_DEV"}:{}),
    updatedAt:now,version:finding.version+1,
   }).where(eq(db10AuditFindings.id,finding.id));
   await event(finding.id,"COMMENT",file.path,input.by,
    "Agent update ("+input.status+"): "+(input.note??"No additional note"),
    finding.status,finding.status,input.commits??[]);
   if(transition)await event(finding.id,"STATUS",file.path,input.by,
    "Marked fixed by agent with verified commit references.",
    finding.status,"FIXED_DEV",input.commits??[]);
   await record(file.path,file.sha,action,"ACCEPTED",finding.id,null);
   stats.updates++;
  }
  // Deletions of accepted files create separate immutable ledger attempts;
  // imported finding records stay untouched and the event cites the path.
  for(const [path,previous] of accepted){
   if(present.has(path))continue;
   if(await record(path,previous.blobSha,"DELETE","DELETED",
      previous.findingId,"DELETED_AFTER_IMPORT")){
    stats.deleted++;
    if(previous.findingId)await event(previous.findingId,"COMMENT",path,"importer",
     "The imported source file disappeared from GitHub; original record retained.",
     null,null);
   }
   problems.push({path,reason:"DELETED: source file removed after import"});
  }
  const handled=stats.imported+stats.updates+stats.refused+stats.tampered;
  const incomplete=ordered.some(file=>
   !seen.has(file.path+"|"+file.sha+"|"+(file.path.includes(".u")?"UPDATE":"IMPORT"))&&
   !accepted.has(file.path));
  // Retain outstanding older refusals, changes and deletes until a later
  // accepted correction actually supersedes them. A no-op rerun is not
  // success merely because its previously rejected files were skipped.
  const mentioned=new Set(problems.map(item=>item.path));
  for(const [path,reason] of previousProblems){
   if(!reason||mentioned.has(path))continue;
   if(reason.startsWith("REJECTED") && accepted.has(path))continue;
   problems.push({path,reason});
  }
  const result=incomplete||problems.length?"PARTIAL":"SUCCESS";
  // Only the committed transaction may publish a sync receipt.
  await tx.insert(db10AuditFindingSyncs).values({
   source:SOURCE,repo:SOURCE,lastCommit:inbox.commit,
   lastSyncedAt:now,lastSuccessAt:now,lastError:null,lastResult:result,
   importedCount:handled,refusedFiles:problems.slice(0,200),
  }).onConflictDoUpdate({target:db10AuditFindingSyncs.source,set:{
   repo:SOURCE,lastCommit:inbox.commit,lastSyncedAt:now,
   lastSuccessAt:now,lastError:null,lastResult:result,importedCount:handled,
   refusedFiles:problems.slice(0,200),
  }});
  return {ran:true,busy:false,commit:inbox.commit,...stats,
   message:result+(incomplete?": additional inbox files remain":""),};
 },{isolationLevel:"serializable"});
}
