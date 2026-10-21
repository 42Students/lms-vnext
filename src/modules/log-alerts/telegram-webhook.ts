import { timingSafeEqual } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import {redactAlertText} from "./redaction";
import {limitTelegramAlert} from "./telegram-notifier";
import { z } from "zod";
import { getDb } from "@/db/client";
import { db10LogAlertSignatures as signatures } from "@/db/schema/db10-log-alerts.draft";
import { logAlertsRuntimeEnabled } from "./readiness";

const callbackSchema = z.object({
  callback_query: z.object({
    id: z.string().min(1).max(120),
    data: z.string().max(200),
    message: z.object({
      message_id:z.number().int().positive().optional(),
      text:z.string().max(3500).optional(),
      chat: z.object({
        id: z.union([z.number().int(), z.string().min(1).max(40)]),
      }).passthrough(),
    }).passthrough(),
  }).passthrough(),
}).passthrough();

/** An authentic bot callback from another conversation must never triage alerts. */
export function validTelegramCallbackChat(chatId: string | number): boolean {
  const expected = process.env.TELEGRAM_ALERT_CHAT_ID;
  return Boolean(expected && String(chatId) === expected);
}

export function validTelegramWebhookSecret(header: string | null): boolean {
  if (process.env.APP_ENV !== "production") return false;
  const expected = process.env.TELEGRAM_ALERT_WEBHOOK_SECRET;
  if (!expected || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function postTelegramOperation(operation:"answerCallbackQuery"|"editMessageText",payload:Record<string,unknown>){
  const token=process.env.TELEGRAM_ALERT_BOT_TOKEN;
  if(!token)return false;
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),2_000);
  try{
    const result=await fetch("https://api.telegram.org/bot"+token+"/"+operation,{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify(payload),signal:controller.signal,
    });
    if(!result.ok)return false;
    const body:unknown=await result.json();
    return typeof body==="object"&&body!==null&&"ok" in body&&body.ok===true;
  }catch{
    // Telegram provider failures can include tokens in their diagnostics.
    return false;
  }finally{clearTimeout(timeout);}
}
async function answerTelegramCallback(callbackId:string,message:string){
  return postTelegramOperation("answerCallbackQuery",{callback_query_id:callbackId,text:message});
}
async function editAcknowledgedMessage(chatId:string|number,messageId:number,original:string){
  // A callback can carry the original redacted alert text. Re-sanitize it to
  // avoid echoing manipulated updates, and leave at most one durable suffix.
  const scrubbed=limitTelegramAlert(original.split(/\r?\n/).map(redactAlertText).join("\n"));
  const suffix="\n\n✅ Acknowledged";
  const safe=scrubbed.endsWith(suffix)?scrubbed:scrubbed.slice(0,3500-suffix.length)+suffix;
  return postTelegramOperation("editMessageText",{
    chat_id:chatId,message_id:messageId,text:safe,reply_markup:{inline_keyboard:[]},
  });
}

export async function handleTelegramCallback(payload: unknown): Promise<boolean> {
  if (process.env.APP_ENV !== "production" || !logAlertsRuntimeEnabled()) return false;
  const parsed = callbackSchema.safeParse(payload);
  if (!parsed.success) return false;
  if (!validTelegramCallbackChat(parsed.data.callback_query.message.chat.id)) return false;
  const callback=parsed.data.callback_query;
  const value=callback.data;
  if(!/^ack:[0-9a-f-]{36}$/i.test(value)){
    // Older non-UUID buttons cannot be attributed to a persisted signature.
    // Always clear an authenticated Telegram callback spinner without mutation.
    await answerTelegramCallback(callback.id,value.startsWith("ack:")?"Alert is no longer available":"Action unavailable");
    return false;
  }
  const id=value.slice(4);
  const db=getDb();
  const scope=and(eq(signatures.id,id),eq(signatures.environment,"PRODUCTION"));
  const updated=await db.update(signatures).set({acknowledgedAt:new Date()})
    .where(and(scope,isNull(signatures.acknowledgedAt)))
    .returning({id:signatures.id});
  const previously=updated.length?null:await db.select({acknowledgedAt:signatures.acknowledgedAt})
    .from(signatures).where(scope).limit(1);
  const acknowledged=updated.length>0||Boolean(previously?.[0]?.acknowledgedAt);
  if(acknowledged&&callback.message.message_id&&callback.message.text){
    // Commit first: a transient Telegram outage must never roll back triage.
    // Duplicate taps can repair a previous edit without replacing ack time.
    await editAcknowledgedMessage(callback.message.chat.id,callback.message.message_id,callback.message.text);
  }
  await answerTelegramCallback(callback.id,acknowledged?"Acknowledged":"Alert no longer available");
  return acknowledged;
}
