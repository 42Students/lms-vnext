export function hrConversationsHref(input:{
 collegeId:string;q:string;unreadOnly:"true"|"false";page:number;sort?:"LATEST"|"OLDEST";scope?:"ALL"|"GENERAL"|"DRIVE";
}){
 const query=new URLSearchParams({
  collegeId:input.collegeId,q:input.q,unreadOnly:input.unreadOnly,
  page:String(input.page),sort:input.sort??"LATEST",scope:input.scope??"ALL",
 });
 return "/hr/conversations?"+query.toString();
}
