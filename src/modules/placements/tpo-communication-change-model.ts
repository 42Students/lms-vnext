import {z} from "zod";

/** TPO settings are college-scoped, versioned and section-specific. */
export const tpoCommunicationChangeSchema=z.discriminatedUnion("section",[
 z.object({section:z.literal("SMS_CAP"),smsMonthlyCap:z.number().int().min(0).max(100000),expectedVersion:z.iso.datetime({offset:true}).transform(value=>new Date(value).toISOString()).nullable()}).strict(),
 z.object({section:z.literal("SIGNATURE"),emailSignature:z.string().trim().max(300),expectedVersion:z.iso.datetime({offset:true}).transform(value=>new Date(value).toISOString()).nullable()}).strict(),
 z.object({section:z.literal("OPTIONAL_EMAILS"),
  notifyDriveOpenEmail:z.boolean(),notifyResultApplied:z.boolean(),
  notifyNudges:z.boolean(),notifyPrepAssigned:z.boolean(),
  expectedVersion:z.iso.datetime({offset:true}).transform(value=>new Date(value).toISOString()).nullable()}).strict(),
 z.object({section:z.literal("PREP_THRESHOLD"),prepThresholdPct:z.number().int().min(0).max(100),expectedVersion:z.iso.datetime({offset:true}).transform(value=>new Date(value).toISOString()).nullable()}).strict(),
 z.object({section:z.literal("RECRUITER_DURATION"),recruiterAccessMonths:z.union([z.literal(3),z.literal(6),z.literal(12),z.literal(24)]),expectedVersion:z.iso.datetime({offset:true}).transform(value=>new Date(value).toISOString()).nullable()}).strict(),
]);

export type TpoCommunicationChange=z.infer<typeof tpoCommunicationChangeSchema>;
export function tpoCommunicationChanges(input:TpoCommunicationChange){
 return input.section==="SMS_CAP"?{smsMonthlyCap:input.smsMonthlyCap}:
  input.section==="SIGNATURE"?{emailSignature:input.emailSignature}:
  input.section==="PREP_THRESHOLD"?{prepThresholdPct:input.prepThresholdPct}:
  input.section==="OPTIONAL_EMAILS"?{
   notifyDriveOpenEmail:input.notifyDriveOpenEmail,notifyResultApplied:input.notifyResultApplied,
   notifyNudges:input.notifyNudges,notifyPrepAssigned:input.notifyPrepAssigned}:
  {recruiterAccessMonths:input.recruiterAccessMonths};
}

/** Completed writes retried with the old token must not duplicate the
 * activity event. Compare all fields changed by this section under a row
 * lock; a genuinely different request still needs a matching CAS token. */
export function tpoCommunicationUpdateAlreadyApplied(current:object,changes:object):boolean{
 const stored=current as Record<string,unknown>;
 return Object.entries(changes).every(([field,value])=>stored[field]===value);
}
