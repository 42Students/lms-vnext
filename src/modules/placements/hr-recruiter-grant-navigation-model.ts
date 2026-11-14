import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const HR_GRANT_DESTINATIONS=[
 {kind:"Today",path:"/hr/home"},
 {kind:"Drives",path:"/hr/drives"},
 {kind:"Company & Team",path:"/hr/company"},
] as const;
export function hrRecruiterGrantLinks(collegeId:string){
 const id=zUuid.parse(collegeId);
 return HR_GRANT_DESTINATIONS.map(destination=>({
  label:destination.kind,
  href:destination.path+"?collegeId="+encodeURIComponent(id),
 }));
}
