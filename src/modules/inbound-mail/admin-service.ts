import "server-only";
import {and,desc,eq,ilike,or,sql,type SQL} from "drizzle-orm";
import {getDb} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {inboundMailListQuerySchema} from "./message-model";
import {inboundMailMessagesStaged} from "./staged-schema";

export type InboundMailItem={
 id:string;receivedAt:Date;fromAddress:string;toAddress:string;
 subject:string;bodyPlain:string;status:string;
};
export type InboundMailPage={
 available:boolean;items:readonly InboundMailItem[];page:number;hasMore:boolean;
};
type InboundMailFilters={status:"ALL"|"NEW"|"TRIAGED"|"RESOLVED";q:string;page:number};
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
  if(input.q) {
   const escaped=input.q.replace(/[\\%_]/g,"\\$&");
   const pattern="%"+escaped+"%";
   conditions.push(or(ilike(t.fromAddress,pattern),ilike(t.subject,pattern))!);
  }
  return getDb().select({
   id:t.id,receivedAt:t.receivedAt,fromAddress:t.fromAddress,toAddress:t.toAddress,
   subject:t.subject,bodyPlain:t.bodyPlain,status:t.status,
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
