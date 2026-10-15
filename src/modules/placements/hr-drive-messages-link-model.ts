import {z} from "zod";
export function hrDriveMessagesHref(rawJobId:string){
 const id=z.string().uuid().parse(rawJobId);
 return "/recruiter/drives/"+id+"/messages";
}
