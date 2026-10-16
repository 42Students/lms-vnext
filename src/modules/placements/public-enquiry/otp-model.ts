import { createHmac,randomInt,timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { publicRecruiterWorkEmailSchema } from "../public-college-join-model";
export const publicEnquirySendSchema=z.strictObject({email:publicRecruiterWorkEmailSchema});
export const PUBLIC_ENQUIRY_TTL_MS=600000;
export function canSendPublicEnquiryCode(n:{email:number;college:number;ip:number}) {
  return [n.email,n.college,n.ip].every(v=>Number.isSafeInteger(v)&&v>=0)&&
    n.email<5&&n.college<300&&n.ip<20;
}
export function newEnquiryCode(){return randomInt(0,1000000).toString().padStart(6,"0");}
export function enquiryMac(id:string,email:string,code:string,secret:string){
 if(!z.string().uuid().safeParse(id).success||!publicRecruiterWorkEmailSchema.safeParse(email).success||
   !/^[0-9]{6}$/.test(code)||Buffer.byteLength(secret,"utf8")<32)
    throw new Error("PUBLIC_ENQUIRY_CODE_NOT_READY");
 return createHmac("sha256",secret).update("public-enquiry-v1:")
   .update(id).update(":").update(email).update(":").update(code).digest("hex");
}
export function enquiryMacMatches(stored:string,id:string,email:string,code:string,secret:string){
 if(!/^[a-f0-9]{64}$/.test(stored)||!/^[0-9]{6}$/.test(code))return false;
 const actual=enquiryMac(id,email,code,secret);
 return timingSafeEqual(Buffer.from(stored,"hex"),Buffer.from(actual,"hex"));
}
