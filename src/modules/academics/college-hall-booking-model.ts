import {z} from "zod";
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value=>{
  const start=new Date(value+"T00:00:00+05:30");
  return Number.isFinite(start.getTime())&&
    new Date(start.getTime()+330*60000).toISOString().slice(0,10)===value;
},"Valid IST calendar date required");
const time=z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const collegeHallBookingSchema=z.strictObject({
  sectionId:z.string().uuid(),
  facultyMembershipId:z.string().uuid().nullable(),
  date,
  from:time,to:time,
  title:z.string().trim().min(1).max(160),
  expectedSectionUpdatedAt:z.iso.datetime({offset:true}),
  confirm:z.literal(true),
}).refine(v=>v.to>v.from,{path:["to"],message:"End time must follow start"});
export function hallBookingWindow(input:{date:string;from:string;to:string}) {
  return {startsAt:new Date(input.date+"T"+input.from+":00+05:30"),
    endsAt:new Date(input.date+"T"+input.to+":00+05:30")};
}
export function hallCanFitClass(hallCapacity:number,sectionCapacity:number|null){
  return sectionCapacity===null||sectionCapacity<=hallCapacity;
}
