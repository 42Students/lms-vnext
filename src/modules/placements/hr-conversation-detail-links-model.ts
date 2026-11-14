import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export function hrConversationDetailHref(threadId:string,page:number){
 const id=zUuid.parse(threadId);
 const safePage=z.number().int().min(1).max(10000).parse(page);
 return "/hr/conversations/"+id+"?page="+safePage;
}
