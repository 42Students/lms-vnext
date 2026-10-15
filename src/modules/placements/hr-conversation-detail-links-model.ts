import {z} from "zod";
export function hrConversationDetailHref(threadId:string,page:number){
 const id=z.string().uuid().parse(threadId);
 const safePage=z.number().int().min(1).max(10000).parse(page);
 return "/hr/conversations/"+id+"?page="+safePage;
}
