import {z} from "zod";

const expectedRevisionSchema=z.iso.datetime({offset:true})
 .refine(value=>Number.isFinite(Date.parse(value)),"Invalid settings revision")
 .transform(value=>new Date(value).toISOString()).nullable();

/** TPO settings are college-scoped, versioned and section-specific. */
export const tpoCommunicationChangeSchema=z.discriminatedUnion("section",[
 z.object({section:z.literal("SMS_CAP"),smsMonthlyCap:z.number().int().min(0).max(100000),expectedVersion:expectedRevisionSchema}).strict(),
 z.object({section:z.literal("SIGNATURE"),emailSignature:z.string().trim().max(300),expectedVersion:expectedRevisionSchema}).strict(),
 z.object({section:z.literal("OPTIONAL_EMAILS"),
  notifyDriveOpenEmail:z.boolean(),notifyResultApplied:z.boolean(),
  notifyNudges:z.boolean(),notifyPrepAssigned:z.boolean(),
  expectedVersion:expectedRevisionSchema}).strict(),
 z.object({section:z.literal("PREP_THRESHOLD"),prepThresholdPct:z.number().int().min(0).max(100),expectedVersion:expectedRevisionSchema}).strict(),
 z.object({section:z.literal("RECRUITER_DURATION"),recruiterAccessMonths:z.union([z.literal(3),z.literal(6),z.literal(12),z.literal(24)]),expectedVersion:expectedRevisionSchema}).strict(),
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
