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
