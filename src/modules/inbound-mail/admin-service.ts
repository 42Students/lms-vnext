import "server-only";
import {and,count,desc,eq,ilike,or,sql,type SQL} from "drizzle-orm";
import {getDb} from "@/db/client";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {inboundMailListQuerySchema} from "./message-model";
import {z} from "zod";
import {inboundMailMessagesStaged} from "./staged-schema";
import {inboundMailStatusTransitionAllowed} from "./triage-transition-model";
import {safeInboundPreview,type InboundMailRoutingStatus} from "./message-model";
import {activityEvents} from "@/db/schema";

export type InboundMailItem={
 id:string;receivedAt:Date;fromAddress:string;toAddress:string;
 subject:string;bodyPlain:string;status:string;version:number;
 bodyPreview?:string;
 kind?:"REPLY"|"OTHER";routingStatus?:InboundMailRoutingStatus;
 handledAt?:Date|null;
};
export type InboundMailPage={
 available:boolean;items:readonly InboundMailItem[];page:number;hasMore:boolean;total:number|null;toReadCount:number|null;
};
type InboundMailFilters={status:"ALL"|"NEW"|"TRIAGED"|"RESOLVED";q:string;page:number;recipient?:string;
 kind?:"REPLY"|"OTHER";routingStatus?:InboundMailRoutingStatus;};
export interface InboundMailAdminRepository {
 tableExists():Promise<boolean>;
 list(input:InboundMailFilters):Promise<readonly InboundMailItem[]>;
 count?(input:InboundMailFilters):Promise<number>;
}
export const drizzleInboundMailAdminRepository:InboundMailAdminRepository={
 async tableExists(){
  // Do not select newly registered routing columns until the real 0150
  // migration has reached this database. Never invent delivery outcomes.
  const result=await getDb().execute(sql<{found:boolean}>`SELECT
    to_regclass('public.inbound_mail_messages') IS NOT NULL AND
    EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='inbound_mail_messages'
      AND column_name='routing_status') AND
    EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='inbound_mail_messages'
      AND column_name='kind') AS found`);
  return result.rows[0]?.found===true;
 },
 async count(input){
  const t=inboundMailMessagesStaged,conditions:SQL[]=[];
  if(input.status!=="ALL")conditions.push(eq(t.status,input.status));
  if(input.kind)conditions.push(eq(t.kind,input.kind));
  if(input.routingStatus)conditions.push(eq(t.routingStatus,input.routingStatus));
  if(input.recipient)conditions.push(sql`lower(${t.toAddress}) = ${input.recipient}::text`);
  if(input.q){
   const escaped=input.q.replace(/[\\%_]/g,"\\$&");
   const pattern="%"+escaped+"%";
   conditions.push(or(ilike(t.fromAddress,pattern),ilike(t.subject,pattern),ilike(t.bodyPlain,pattern))!);
  }
  const [row]=await getDb().select({total:count()}).from(t).where(conditions.length?and(...conditions):undefined);
  return row?.total??0;
 },
 async list(input){
  const t=inboundMailMessagesStaged,conditions:SQL[]=[];
  if(input.status!=="ALL")conditions.push(eq(t.status,input.status));
  if(input.kind)conditions.push(eq(t.kind,input.kind));
  if(input.routingStatus)conditions.push(eq(t.routingStatus,input.routingStatus));
  if(input.recipient)conditions.push(sql`lower(${t.toAddress}) = ${input.recipient}::text`);
  if(input.q) {
   const escaped=input.q.replace(/[\\%_]/g,"\\$&");
   const pattern="%"+escaped+"%";
   conditions.push(or(ilike(t.fromAddress,pattern),ilike(t.subject,pattern),ilike(t.bodyPlain,pattern))!);
  }
  return getDb().select({
   id:t.id,receivedAt:t.receivedAt,fromAddress:t.fromAddress,toAddress:t.toAddress,
   // List rows have a bounded preview. Fetch the entire body ONLY through
   // getInboundMailDetailForAdmin after global Super Admin authorization.
   subject:t.subject,bodyPlain:sql<string>`left(${t.bodyPlain}, 512)`,
   status:t.status,version:t.version,
   kind:t.kind,routingStatus:t.routingStatus,handledAt:t.handledAt,
  }).from(t).where(conditions.length?and(...conditions):undefined)
    // ReceivedAt is the delivery order; ID is the stable tie-breaker when
    // messages arrive in the same millisecond or a worker is delayed.
    .orderBy(desc(t.receivedAt),desc(t.id)).limit(51).offset((input.page-1)*50);
 },
};
export async function listInboundMailForAdmin(
 context:RequestContext,raw:unknown,repository:InboundMailAdminRepository=drizzleInboundMailAdminRepository,
):Promise<InboundMailPage>{
 requirePermission(context,"admin-scope.select");
 if(!isSuperAdmin(context))throw new AuthorizationError("admin-scope.select");
 if(context.adminScope?.collegeId||context.adminScope?.organizationId)
  throw new AuthorizationError("admin-scope.select");
 const input=inboundMailListQuerySchema.parse(raw);
 if(!await repository.tableExists())
  return {available:false,items:[],page:input.page,hasMore:false,total:null,toReadCount:null};
 const [items,total,toReadCount]=await Promise.all([
  repository.list(input),
  repository.count?repository.count(input):Promise.resolve(null),
  // The To read badge is global NEW mail, not dependent on the active
  // Posted/routing/recipient filter tab.
  repository.count?repository.count({
    status:"NEW",q:"",page:1,recipient:undefined,
    kind:undefined,routingStatus:undefined,
  }):Promise.resolve(null),
 ]);
 return {available:true,items:items.slice(0,50).map(item=>({...item,bodyPreview:safeInboundPreview(item.bodyPlain)})),page:input.page,hasMore:items.length>50,total,toReadCount};
}

/** Version-checked inbound triage mutation. Global Super Admin only: incoming
 * mail must not be exposed to a college-scoped administrator. */
export async function changeInboundMailStatusForAdmin(
 context:RequestContext,raw:unknown,
){
 requirePermission(context,"admin-scope.select");
 if(!isSuperAdmin(context))throw new AuthorizationError("admin-scope.select");
 if(context.adminScope?.collegeId||context.adminScope?.organizationId)
  throw new AuthorizationError("admin-scope.select");
 const input=z.strictObject({
  id:z.uuid(),
  expectedStatus:z.enum(["NEW","TRIAGED","RESOLVED"]),
  expectedVersion:z.number().int().min(0),
  status:z.enum(["NEW","TRIAGED","RESOLVED"]),
 }).parse(raw);
 if(!inboundMailStatusTransitionAllowed(input.expectedStatus,input.status))
  throw new Error("Unsupported inbound mail transition");
 if(!await drizzleInboundMailAdminRepository.tableExists())
  return {kind:"UNAVAILABLE" as const};
 return getDb().transaction(async tx=>{
  const [updated]=await tx.update(inboundMailMessagesStaged)
   .set({
     status:input.status,
     // An actual manual resolve sets handled_at; reopening must clear it.
     // Delivery routing status remains independent of human triage.
     handledAt:input.status==="RESOLVED"?new Date():null,
     version:sql`${inboundMailMessagesStaged.version}+1`,
   })
   .where(and(eq(inboundMailMessagesStaged.id,input.id),
    eq(inboundMailMessagesStaged.status,input.expectedStatus),
    eq(inboundMailMessagesStaged.version,input.expectedVersion)))
   .returning({id:inboundMailMessagesStaged.id,status:inboundMailMessagesStaged.status,
    version:inboundMailMessagesStaged.version});
  if(!updated)return {kind:"STALE" as const};
  // An immutable actor event survives triage/reopen even though the present
  // inbox schema has no handled_at/by columns. The activity insert and status
  // change commit atomically, so neither can exist without the other.
  await tx.insert(activityEvents).values({
   actorUserId:context.user.id,module:"PLATFORM",
   eventType:"platform.inbound_mail.status_changed",importance:"NORMAL",
   subjectType:"INBOUND_MAIL",subjectId:updated.id,
   summary:"Super Admin updated inbound mail triage",
   metadata:{
     from:input.expectedStatus,to:input.status,version:updated.version,
     handlerUserId:context.user.id,
     eventKind:input.status==="RESOLVED"?"HANDLED":
       input.status==="NEW"?"REOPENED":"TRIAGED",
   },
  });
  return {kind:"UPDATED" as const,...updated};
 });
}

/**
 * A separately authorized full-body read for a selected inbox entry. An
 * inbox drawer may call this from an authenticated GET /:id endpoint after
 * rendering the short preview; no unauthenticated webhook may use this path.
 * Missing IDs stay null for a generic 404 without leaking message existence
 * to a non-Super Admin.
 */
export async function getInboundMailDetailForAdmin(
 context:RequestContext,
 rawId:unknown,
):Promise<InboundMailItem|null>{
 requirePermission(context,"admin-scope.select");
 if(!isSuperAdmin(context)||context.adminScope?.collegeId||
    context.adminScope?.organizationId)throw new AuthorizationError("admin-scope.select");
 const id=z.uuid().parse(rawId);
 if(!await drizzleInboundMailAdminRepository.tableExists())return null;
 const t=inboundMailMessagesStaged;
 const [row]=await getDb().select({
  id:t.id,receivedAt:t.receivedAt,fromAddress:t.fromAddress,
  toAddress:t.toAddress,subject:t.subject,bodyPlain:t.bodyPlain,
  status:t.status,version:t.version,kind:t.kind,routingStatus:t.routingStatus,
  handledAt:t.handledAt,
 }).from(t).where(eq(t.id,id)).limit(1);
 return row??null;
}

/** List previews never imply successful automatic recruiter posting. The
 * Migration 0150 has routingStatus, kind and handledAt; the responsible actor
 * remains in the immutable activity event rather than a guessed sender.
 * Manual NEW/TRIAGED/RESOLVED is independent of automated delivery. */
export const INBOUND_ROUTING_METADATA_READY=true;
