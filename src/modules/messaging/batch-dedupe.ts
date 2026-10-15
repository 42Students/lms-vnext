import type { OutboundSendRequest } from "./model";
import { normalizeRecipient } from "./model";
/** Within one batch, the same channel, purpose, template and recipient is dispatched once. */
export function dedupeBatch(requests: readonly OutboundSendRequest[]): OutboundSendRequest[] {
  const seen = new Set<string>();
  return requests.filter(request => {
    const key = JSON.stringify([request.channel, normalizeRecipient(request.channel, request.recipient), request.purpose, request.templateKey]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Collision-free in-memory key; opaque keyed recipient only, never a raw address. */
export function opaqueBatchAttemptKey(
 channel:"EMAIL"|"SMS",recipientKey:string,purpose:string,templateKey:string,
):string{
 return JSON.stringify([channel,recipientKey,purpose,templateKey]);
}
