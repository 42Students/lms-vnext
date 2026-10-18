import {z} from "zod";
export const hrInterviewSlotCreateSchema=z.strictObject({
 action:z.literal("CREATE").optional(),
 roundId:z.string().uuid(),
 startAt:z.union([z.date(),z.iso.datetime({offset:true}).transform(value=>new Date(value))]),
 endAt:z.union([z.date(),z.iso.datetime({offset:true}).transform(value=>new Date(value))]),
 timezone:z.literal("Asia/Kolkata"),
 mode:z.enum(["ON_CAMPUS","VIRTUAL"]),
 meetingLocation:z.string().trim().max(500).optional(),
 panelLabel:z.string().trim().max(160)
  .refine(value=>!/[\x00-\x1f\x7f]/.test(value),{message:"Invalid interview panel label"}).optional(),
 capacity:z.union([z.number().int(),z.string().regex(/^[1-9][0-9]*$/).transform(Number)])
  .pipe(z.number().int().min(1).max(100)),
}).refine(row=>row.endAt.getTime()>row.startAt.getTime()&&
 row.endAt.getTime()-row.startAt.getTime()<=8*60*60*1000,{
 message:"Slot must have a positive duration of at most eight hours",
});
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
