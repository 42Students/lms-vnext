import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export function hrDriveMessagesHref(rawJobId:string){
 const id=zUuid.parse(rawJobId);
 return "/recruiter/drives/"+id+"/messages";
}
