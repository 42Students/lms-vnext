export function contactRecordLinks(row:{membershipId:string;roles:readonly ("FACULTY"|"LEARNER")[]}){
 return [
  ...(row.roles.includes("LEARNER")?[{label:"Student details",href:"/college/students/"+encodeURIComponent(row.membershipId)}]:[]),
  ...(row.roles.includes("FACULTY")?[{label:"Faculty details",href:"/college/faculty/"+encodeURIComponent(row.membershipId)}]:[]),
 ];
}
