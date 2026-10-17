import {z} from "zod";
const uuid=z.string().uuid();
export const tpoInterviewSlotActionSchema=z.discriminatedUnion("action",[
 z.object({action:z.literal("GENERATE_DAY"),confirmed:z.literal(true),startsAt:z.iso.datetime({offset:true}),
  durationMinutes:z.number().int().min(5).max(240),gapMinutes:z.number().int().min(0).max(120),
  slotsPerRoom:z.number().int().min(1).max(100),rooms:z.array(z.string().trim().min(1).max(160)).min(1).max(20)}).strict(),
 z.object({action:z.literal("BOOK"),confirmed:z.literal(true),slotId:uuid,applicationId:uuid,expectedVersion:z.number().int().positive()}).strict(),
 z.object({action:z.literal("MOVE"),confirmed:z.literal(true),slotId:uuid,targetSlotId:uuid,expectedVersion:z.number().int().positive(),
  reason:z.string().trim().min(3).max(500)}).strict(),
 z.object({action:z.literal("CLEAR_AVAILABLE"),confirmed:z.literal(true)}).strict(),
 z.object({action:z.literal("CANCEL"),confirmed:z.literal(true),slotId:uuid,expectedVersion:z.number().int().positive(),
  reason:z.string().trim().min(3).max(500)}).strict(),
 z.object({action:z.literal("ASSIGN_ROOMS_BY_ROLL"),confirmed:z.literal(true),
  fromRoll:z.string().trim().min(1).max(80),toRoll:z.string().trim().min(1).max(80),
  room:z.string().trim().min(1).max(160)}).strict(),
 z.object({action:z.literal("CONFIRM_RECRUITER_PROPOSAL"),confirmed:z.literal(true),
  proposalId:uuid,expectedVersion:z.number().int().positive(),
  venue:z.string().trim().min(2).max(300)}).strict(),
 z.object({action:z.literal("MOVE_REQUEST"),confirmed:z.literal(true),
  requestId:uuid,targetSlotId:uuid,reason:z.string().trim().min(3).max(500)}).strict(),
 z.object({action:z.literal("KEEP_REQUEST"),confirmed:z.literal(true),
  requestId:uuid,reason:z.string().trim().min(3).max(500)}).strict(),
 z.object({action:z.literal("ASSIGN_ROOM"),confirmed:z.literal(true),slotId:uuid,expectedVersion:z.number().int().positive(),
  room:z.string().trim().min(1).max(160)}).strict(),
]);
export function planInterviewDay(input:{startsAt:string;durationMinutes:number;gapMinutes:number;
 slotsPerRoom:number;rooms:readonly string[]}){
 const start=Date.parse(input.startsAt);
 if(!Number.isFinite(start))throw Error("Invalid interview date");
 if(new Set(input.rooms.map(r=>r.toLowerCase())).size!==input.rooms.length)throw Error("Room names must be different");
 return input.rooms.flatMap(room=>Array.from({length:input.slotsPerRoom},(_,index)=>{
  const begins=new Date(start+index*(input.durationMinutes+input.gapMinutes)*60_000);
  const ends=new Date(begins.getTime()+input.durationMinutes*60_000);
  const localDay=(value:Date)=>new Intl.DateTimeFormat("en-CA",{
   timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  }).format(value);
  if(localDay(new Date(start))!==localDay(new Date(ends.getTime()-1)))
   throw Error("An interview day must end before midnight in college time. Shorten the slots or start earlier.");
  return {room,startsAt:begins,endsAt:ends};
 }));
}
