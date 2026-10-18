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
/** Normalize names for logical room equality across planners and stored rows. */
export function sameInterviewRoom(left:string,right:string):boolean{
 return left.normalize("NFKC").trim().toLocaleLowerCase("en-IN")===
  right.normalize("NFKC").trim().toLocaleLowerCase("en-IN");
}
/** Shared physical-room overlap gate for day generation, bulk roll moves,
 * and individual room edits. Exactly touching windows are not conflicts.
 * Invalid timing data for the same room must fail closed.
 */
export function overlapsInterviewRoom(
 proposed:{room:string;startsAt:Date;endsAt:Date},
 existing:readonly {room:string;startsAt:Date;endsAt:Date}[],
):boolean{
 const begins=proposed.startsAt.getTime(),ends=proposed.endsAt.getTime();
 if(!Number.isFinite(begins)||!Number.isFinite(ends)||ends<=begins)return true;
 return existing.some(slot=>{
  if(!sameInterviewRoom(proposed.room,slot.room))return false;
  const from=slot.startsAt.getTime(),until=slot.endsAt.getTime();
  if(!Number.isFinite(from)||!Number.isFinite(until)||until<=from)return true;
  return from<ends&&begins<until;
 });
}
export function planInterviewDay(input:{startsAt:string;durationMinutes:number;gapMinutes:number;
 slotsPerRoom:number;rooms:readonly string[]}){
 // TPO-drive-workspace-44: exported planners must validate even when called
 // without the route-level schema. Do not allocate from unchecked row counts.
 const parsed=tpoInterviewSlotActionSchema.safeParse({
  action:"GENERATE_DAY",confirmed:true,...input,
 });
 if(!parsed.success||parsed.data.action!=="GENERATE_DAY")
  throw Error("Invalid interview day configuration");
 const plan=parsed.data;
 const start=Date.parse(plan.startsAt);
 if(!Number.isFinite(start))throw Error("Invalid interview date");
 if(new Set(plan.rooms.map(r=>r.normalize("NFKC").trim().toLocaleLowerCase("en-IN"))).size!==plan.rooms.length)
  throw Error("Room names must be different");
 return plan.rooms.flatMap(room=>Array.from({length:plan.slotsPerRoom},(_,index)=>{
  const begins=new Date(start+index*(plan.durationMinutes+plan.gapMinutes)*60_000);
  const ends=new Date(begins.getTime()+plan.durationMinutes*60_000);
  const localDay=(value:Date)=>new Intl.DateTimeFormat("en-CA",{
   timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  }).format(value);
  if(localDay(new Date(start))!==localDay(new Date(ends.getTime()-1)))
   throw Error("An interview day must end before midnight in college time. Shorten the slots or start earlier.");
  return {room,startsAt:begins,endsAt:ends};
 }));
}
