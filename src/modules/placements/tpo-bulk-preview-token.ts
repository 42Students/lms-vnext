import { createHmac, timingSafeEqual } from "node:crypto";
import type { TpoBulkPreviewRequest } from "./tpo-bulk-workflow-model";

export type TpoBulkVersion = { id:string;version:string };
export const TPO_BULK_PREVIEW_TTL_MS = 5 * 60 * 1000;
function mac(secret:string, expiry:string, actor:string, plan:TpoBulkPreviewRequest,
  selections:readonly TpoBulkVersion[]) {
  const data=JSON.stringify(["tpo-bulk-v1",expiry,actor,plan.target,plan.jobId??null,
    plan.action,plan.note,plan.internalReason??"",plan.ids,selections.map(row=>[row.id,row.version])]);
  return createHmac("sha256",secret).update(data).digest("base64url");
}
/** Short-lived bound confirmation; UUIDs, decisions, notes, names never appear in the token. */
export function signTpoBulkPreview(secret:string,actor:string,plan:TpoBulkPreviewRequest,
  selections:readonly TpoBulkVersion[],now:number=Date.now()){
  const expires=String(now+TPO_BULK_PREVIEW_TTL_MS);
  return expires+"."+mac(secret,expires,actor,plan,selections);
}
export function verifyTpoBulkPreview(secret:string,actor:string,plan:TpoBulkPreviewRequest,
  selections:readonly TpoBulkVersion[],token:string,now:number=Date.now()){
  const [expiry,signature,...extra]=token.split(".");
  if(extra.length||!expiry||!signature||!/^\d{13}$/.test(expiry))return false;
  const deadline=Number(expiry);
  if(deadline<=now||deadline>now+TPO_BULK_PREVIEW_TTL_MS)return false;
  const expected=Buffer.from(mac(secret,expiry,actor,plan,selections));
  const received=Buffer.from(signature);
  return expected.length===received.length&&timingSafeEqual(expected,received);
}
