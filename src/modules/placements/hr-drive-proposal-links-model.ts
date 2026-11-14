import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export function hrSentProposalsHref(collegeId:string){
 const id=zUuid.parse(collegeId);
 return "/hr/drives/proposals?collegeId="+encodeURIComponent(id);
}
