export function hrConversationsHref(input:{
 collegeId:string;q:string;unreadOnly:"true"|"false";page:number;
}){
 const query=new URLSearchParams({
  collegeId:input.collegeId,q:input.q,unreadOnly:input.unreadOnly,
  page:String(input.page),
 });
 return "/hr/conversations?"+query.toString();
}
