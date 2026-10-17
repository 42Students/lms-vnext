import {z} from "zod";
const draft=z.object({
 action:z.enum(["DEBAR","LIFT"]),reason:z.string().trim().min(1).max(500),
 untilDate:z.string(),duration:z.enum(["DATE","DRIVES","MANUAL"]),
 untilDrives:z.string(),count:z.number().int().min(1).max(25),
});
export function validateTpoBulkDebarDraft(raw:unknown):{ok:true;message:null}|{ok:false;message:string}{
 const parse=draft.safeParse(raw);
 if(!parse.success)return {ok:false,message:"Select 1–25 students and enter a reason (up to 500 characters)."};
 const d=parse.data;
 if(d.action==="DEBAR"&&d.duration==="DATE"){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d.untilDate)||Number.isNaN(Date.parse(d.untilDate+"T00:00:00Z")))
   return {ok:false,message:"Choose a valid debarment end date."};
 }
 if(d.action==="DEBAR"&&d.duration==="DRIVES"&&(!/^[1-9]\d*$/.test(d.untilDrives)||Number(d.untilDrives)>10000))
  return {ok:false,message:"Choose a whole number of drives between 1 and 10,000."};
 return {ok:true,message:null};
}
