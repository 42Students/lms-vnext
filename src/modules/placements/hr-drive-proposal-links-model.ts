import {z} from "zod";
export function hrSentProposalsHref(collegeId:string){
 const id=z.string().uuid().parse(collegeId);
 return "/hr/drives/proposals?collegeId="+encodeURIComponent(id);
}
