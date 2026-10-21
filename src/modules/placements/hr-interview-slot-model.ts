import {z} from "zod";
export const hrInterviewSlotCreateSchema=z.strictObject({
 action:z.literal("CREATE").optional(),
 roundId:z.string().uuid(),
 startAt:z.union([z.date(),z.iso.datetime({offset:true}).transform(value=>new Date(value))]),
 endAt:z.union([z.date(),z.iso.datetime({offset:true}).transform(value=>new Date(value))]),
 timezone:z.literal("Asia/Kolkata"),
 mode:z.enum(["ON_CAMPUS","VIRTUAL"]),
 meetingLocation:z.string().trim().max(500,{message:"Interview venue or link exceeds the 500-character slot limit. Review the legacy value; it cannot be truncated silently."})
  .refine(value=>value===undefined||!/[\x00-\x1f\x7f]/.test(value),{message:"Invalid meeting location"}).optional(),
 panelLabel:z.string().trim().max(160,{message:"Interviewer panel exceeds the 160-character slot limit. Review the legacy name before migration."})
  .refine(value=>!/[\x00-\x1f\x7f]/.test(value),{message:"Invalid interview panel label"}).optional(),
 capacity:z.union([z.number().int(),z.string().regex(/^[1-9][0-9]*$/).transform(Number)])
  .pipe(z.number().int().min(1).max(100)),
}).refine(row=>row.endAt.getTime()>row.startAt.getTime()&&
 row.endAt.getTime()-row.startAt.getTime()<=8*60*60*1000,{
 message:"Slot must have a positive duration of at most eight hours",
});
/** Direct legacy interview creation has a 60-minute duration by default.
 * The slot-booking endpoint still requires explicit start/end for safe overlap
 * checks; configured min/max are resolved and passed by the caller.
 */
export function directInterviewTimeWindow(input:{
 startAt:Date;durationMinutes?:number|null;minMinutes?:number;maxMinutes?:number;
}):{startAt:Date;endAt:Date;durationMinutes:number}{
 const duration=input.durationMinutes??60;
 const min=input.minMinutes??15,max=input.maxMinutes??480;
 if(!Number.isSafeInteger(min)||!Number.isSafeInteger(max)||min<1||max>1440||max<min||
    !Number.isSafeInteger(duration)||duration<min||duration>max)
  throw new Error(`Duration must be between ${min} and ${max} minutes`);
 if(!(input.startAt instanceof Date)||!Number.isFinite(input.startAt.getTime()))
  throw new Error("Invalid interview start time");
 return {startAt:input.startAt,endAt:new Date(input.startAt.getTime()+duration*60_000),
  durationMinutes:duration};
}
export const HR_INTERVIEW_ROUND_DESCRIPTION_ERROR =
 "Round description is required. Please describe what this round is about so we can send clear context to the candidate.";
export function requireHrInterviewRoundDescription(value:string|null|undefined):string{
 const text=value?.trim();
 if(!text||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text))
  throw new Error(HR_INTERVIEW_ROUND_DESCRIPTION_ERROR);
 return text;
}
export const hrInterviewSlotActionSchema=z.strictObject({
 slotId:z.string().uuid(),
 expectedVersion:z.union([z.number().int(),z.string().regex(/^[1-9][0-9]*$/).transform(Number)])
  .pipe(z.number().int().positive()),
 action:z.enum(["OFFER","BOOK","CANCEL"]),
});
export function slotTransitionAllowed(status:string,action:"OFFER"|"BOOK"|"CANCEL",bookedCount=0,capacity=1){
 if(!Number.isSafeInteger(bookedCount)||bookedCount<0||
    !Number.isSafeInteger(capacity)||capacity<1||bookedCount>capacity)return false;
 return (status==="PROPOSED"&&(action==="OFFER"||action==="CANCEL"))||
        (status==="OFFERED"&&((action==="BOOK"&&bookedCount<capacity)||action==="CANCEL"))||
        (status==="BOOKED"&&action==="BOOK"&&bookedCount<capacity);
}
export function slotsOverlap(a:{startAt:Date;endAt:Date},b:{startAt:Date;endAt:Date}){
 const [as,ae,bs,be]=[a.startAt.getTime(),a.endAt.getTime(),b.startAt.getTime(),b.endAt.getTime()];
 // Corrupt persisted intervals must block scheduling, not masquerade as free time.
 if(![as,ae,bs,be].every(Number.isFinite)||as>=ae||bs>=be)return true;
 return as<be&&bs<ae;
}

export function parseIstLocalSlot(value:unknown):string{
 const input=z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).parse(value);
 const utc=new Date(input+":00+05:30");
 if(!Number.isFinite(utc.getTime()))throw new Error("INVALID_IST_DATE");
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Kolkata",
  year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 }).formatToParts(utc);
 const piece=(type:string)=>parts.find(part=>part.type===type)?.value??"";
 const actual=piece("year")+"-"+piece("month")+"-"+piece("day")+"T"+piece("hour")+":"+piece("minute");
 if(actual!==input)throw new Error("INVALID_IST_DATE");
 return input+":00+05:30";
}

/** Internal aggregate slot changes are restricted to the recruiter who created that block. */
export function canRecruiterMutateOwnSlot(createdByUserId:string,recruiterUserId:string):boolean{
 return Boolean(createdByUserId.trim() && recruiterUserId.trim() &&
  createdByUserId === recruiterUserId);
}

/** Format a persisted UTC instant for the IST datetime-local control.
 * Reject second precision instead of silently losing legacy scheduling data.
 * parseIstLocalSlot is the inverse for every supported minute-precision value.
 */
export function formatUtcInterviewSlotAsIstLocal(value:Date):string{
 if(!(value instanceof Date)||!Number.isFinite(value.getTime())||
   value.getUTCSeconds()!==0||value.getUTCMilliseconds()!==0)
  throw new Error("Interview start must be a valid minute-precision UTC instant");
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Kolkata",
  year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 }).formatToParts(value);
 const part=(type:string)=>parts.find(row=>row.type===type)?.value??"";
 const local=part("year")+"-"+part("month")+"-"+part("day")+"T"+part("hour")+":"+part("minute");
 if(new Date(parseIstLocalSlot(local)).getTime()!==value.getTime())
  throw new Error("Interview UTC/IST conversion did not round-trip");
 return local;
}
