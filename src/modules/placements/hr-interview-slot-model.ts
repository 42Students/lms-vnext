import {z} from "zod";
export const hrInterviewSlotCreateSchema=z.strictObject({
 roundId:z.string().uuid(),
 startAt:z.coerce.date(),
 endAt:z.coerce.date(),
 timezone:z.literal("Asia/Kolkata"),
 mode:z.enum(["ON_CAMPUS","VIRTUAL"]),
 meetingLocation:z.string().trim().max(500).optional(),
 panelLabel:z.string().trim().max(160).optional(),
 capacity:z.coerce.number().int().min(1).max(100),
}).refine(row=>row.endAt.getTime()>row.startAt.getTime()&&
 row.endAt.getTime()-row.startAt.getTime()<=8*60*60*1000,{
 message:"Slot must have a positive duration of at most eight hours",
});
export const hrInterviewSlotActionSchema=z.strictObject({
 slotId:z.string().uuid(),
 expectedVersion:z.coerce.number().int().positive(),
 action:z.enum(["OFFER","BOOK","CANCEL"]),
});
export function slotTransitionAllowed(status:string,action:"OFFER"|"BOOK"|"CANCEL"){
 return (status==="PROPOSED"&&(action==="OFFER"||action==="CANCEL"))||
        (status==="OFFERED"&&(action==="BOOK"||action==="CANCEL"));
}
export function slotsOverlap(a:{startAt:Date;endAt:Date},b:{startAt:Date;endAt:Date}){
 return a.startAt.getTime()<b.endAt.getTime()&&b.startAt.getTime()<a.endAt.getTime();
}

export function parseIstLocalSlot(value:unknown):string{
 const input=z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).parse(value);
 const utc=new Date(input+":00+05:30");
 if(!Number.isFinite(utc.getTime()))throw new Error("INVALID_IST_DATE");
 const display=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",
  year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(utc);
 const pieces=display.match(/\d+/g);
 if(!pieces||pieces.length<5||[pieces[0],pieces[1],pieces[2]].join("-")+"T"+pieces[3]+":"+pieces[4]!==input)
  throw new Error("INVALID_IST_DATE");
 return input+":00+05:30";
}
