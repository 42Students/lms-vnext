/** The Exotel API acknowledges a request by issuing a nonblank SMS Sid with
 * a nonfailure status. Sid is opaque (do not impose a vNext identifier regex).
 * Keep accepted states explicit: a novel/provider-error state must not silently
 * count as delivery; "SENT" in our ledger means provider acceptance only. */
const EXOTEL_ACCEPTED_STATUSES = new Set([
 "queued","submitted","sent","accepted","delivered",
 "pending","scheduled","in-progress","in_progress","processing",
]);
export function isExotelAcceptedResponse(raw:unknown):boolean{
 if(!raw || typeof raw!=="object" || !("SMSMessage" in raw))return false;
 const message=raw.SMSMessage;
 if(!message || typeof message!=="object")return false;
 if(!("Sid" in message)||typeof message.Sid!=="string")return false;
 const sid=message.Sid.trim();
 if(!sid || sid.length>255)return false;
 if(!("Status" in message)||typeof message.Status!=="string")return false;
 const status=message.Status.trim().toLowerCase();
 if(!status || status.startsWith("failed"))return false;
 return EXOTEL_ACCEPTED_STATUSES.has(status);
}
