import "server-only";
import {and,desc,eq,ilike,or,sql,type SQL} from "drizzle-orm";
import {getDb} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {inboundMailListQuerySchema} from "./message-model";
import {z} from "zod";
import {inboundMailMessagesStaged} from "./staged-schema";

export type InboundMailItem={
 id:string;receivedAt:Date;fromAddress:string;toAddress:string;
 subject:string;bodyPlain:string;status:string;version:number;
};
export type InboundMailPage={
 available:boolean;items:readonly InboundMailItem[];page:number;hasMore:boolean;
};
type InboundMailFilters={status:"ALL"|"NEW"|"TRIAGED"|"RESOLVED";q:string;page:number;recipient?:string};
export interface InboundMailAdminRepository {
 tableExists():Promise<boolean>;
 list(input:InboundMailFilters):Promise<readonly InboundMailItem[]>;
}
export const drizzleInboundMailAdminRepository:InboundMailAdminRepository={
 async tableExists(){
  const result=await getDb().execute(sql<{found:boolean}>`SELECT to_regclass('public.inbound_mail_messages') IS NOT NULL AS found`);
  return result.rows[0]?.found===true;
 },
 async list(input){
  const t=inboundMailMessagesStaged,conditions:SQL[]=[];
  if(input.status!=="ALL")conditions.push(eq(t.status,input.status));
  if(input.recipient)conditions.push(sql`lower(${t.toAddress}) = ${input.recipient}::text`);
  if(input.q) {
   const escaped=input.q.replace(/[\\%_]/g,"\\$&");
   const pattern="%"+escaped+"%";
   conditions.push(or(ilike(t.fromAddress,pattern),ilike(t.subject,pattern),ilike(t.bodyPlain,pattern))!);
  }
  return getDb().select({
   id:t.id,receivedAt:t.receivedAt,fromAddress:t.fromAddress,toAddress:t.toAddress,
   subject:t.subject,bodyPlain:t.bodyPlain,status:t.status,version:t.version,
  }).from(t).where(conditions.length?and(...conditions):undefined)
    .orderBy(desc(t.receivedAt),desc(t.id)).limit(26).offset((input.page-1)*25);
 },
};
export async function listInboundMailForAdmin(
 context:RequestContext,raw:unknown,repository:InboundMailAdminRepository=drizzleInboundMailAdminRepository,
):Promise<InboundMailPage>{
 requirePermission(context,"admin-scope.select");
 // Inbound webhook mail has no authoritative tenant mapping until the owner
 // registers the mapping policy. Never expose global mail in a tenant scope.
 if(context.adminScope?.organizationId||context.adminScope?.collegeId)
  throw new AuthorizationError("admin-scope.select");
 const input=inboundMailListQuerySchema.parse(raw);
 if(!await repository.tableExists())
  return {available:false,items:[],page:input.page,hasMore:false};
 const items=await repository.list(input);
 return {available:true,items:items.slice(0,25),page:input.page,hasMore:items.length>25};
}

/** Version-checked inbound triage mutation. Global Super Admin only: incoming
 * mail must not be exposed to a college-scoped administrator. */
export async function changeInboundMailStatusForAdmin(
 context:RequestContext,raw:unknown,
){
 requirePermission(context,"admin-scope.select");
 if(context.adminScope?.organizationId||context.adminScope?.collegeId)
  throw new AuthorizationError("admin-scope.select");
 const input=z.strictObject({
  id:z.uuid(),
  expectedStatus:z.enum(["NEW","TRIAGED","RESOLVED"]),
  expectedVersion:z.number().int().min(0),
  status:z.enum(["NEW","TRIAGED","RESOLVED"]),
 }).parse(raw);
 if(input.status!== "NEW" && input.status!=="RESOLVED")
  throw new Error("Unsupported inbound mail transition");
 if(!await drizzleInboundMailAdminRepository.tableExists())
  return {kind:"UNAVAILABLE" as const};
 const [updated]=await getDb().update(inboundMailMessagesStaged)
  .set({status:input.status,version:sql`${inboundMailMessagesStaged.version}+1`})
  .where(and(eq(inboundMailMessagesStaged.id,input.id),
   eq(inboundMailMessagesStaged.status,input.expectedStatus),
   eq(inboundMailMessagesStaged.version,input.expectedVersion)))
  .returning({id:inboundMailMessagesStaged.id,status:inboundMailMessagesStaged.status,
   version:inboundMailMessagesStaged.version});
 return updated?{kind:"UPDATED" as const,...updated}:{kind:"STALE" as const};
}
