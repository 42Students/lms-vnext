import {z} from "zod";
export const learnerOfferExtensionSchema=z.object({
  offerId:z.string().uuid(),
  applicationId:z.string().uuid(),
  status:z.literal("ISSUED"),
  expectedExpiresAt:z.string().datetime({offset:true}),
  requestedLocalAt:z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  reason:z.string().trim().min(3).max(2000),
  confirmed:z.literal(true),
}).strict();
/** Date-time input is always interpreted in IST, never device-local time. */
export function learnerOfferExtensionRequest(raw:unknown,nowIso:string){
  const input=learnerOfferExtensionSchema.parse(raw);
  const date=new Date(input.requestedLocalAt+":00+05:30");
  if(!Number.isFinite(date.getTime())||
    new Date(date.getTime()+330*60_000).toISOString().slice(0,16)!==input.requestedLocalAt ||
    date.getTime()<=Date.parse(input.expectedExpiresAt) ||
    date.getTime()<=Date.parse(nowIso))
    throw new Error("REQUESTED_EXTENSION_DATE_INVALID");
  return {requestType:"OFFER_EXTENSION" as const,
    offerId:input.offerId,applicationId:input.applicationId,
    reason:input.reason,requestedExpiresAt:date.toISOString(),
    expectedExpiresAt:input.expectedExpiresAt};
}
export function learnerOfferExtensionLocalDefault(expiresAt:string){
  return new Date(Date.parse(expiresAt)+2*86400000+330*60000)
    .toISOString().slice(0,16);
}
