import {z} from "zod";
/** Preserve exact college and title search across the role's paginated proposal history. */
export function hrSentProposalHistoryHref(input:{collegeId:string;q?:string;page?:number}){
 const id=z.string().uuid().parse(input.collegeId);
 const page=z.number().int().min(1).max(10000).parse(input.page??1);
 const query=new URLSearchParams({collegeId:id,page:String(page)});
 if(input.q?.trim())query.set("q",input.q.trim().slice(0,100));
 return "/hr/drives/proposals?"+query.toString();
}
