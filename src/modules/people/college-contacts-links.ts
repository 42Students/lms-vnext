import { ROLE } from "@/modules/identity/roles";
export function contactRecordLinks(row:{membershipId:string;roles:readonly ("FACULTY"|"LEARNER")[]}){
 return [
  ...(row.roles.includes(ROLE.LEARNER)?[{label:"Student details",href:"/college/students/"+encodeURIComponent(row.membershipId)}]:[]),
  ...(row.roles.includes(ROLE.FACULTY)?[{label:"Faculty details",href:"/college/faculty/"+encodeURIComponent(row.membershipId)}]:[]),
 ];
}
