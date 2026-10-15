import {hrConversationQuerySchema} from "./hr-conversation-inbox-model";
/** Never redirect a message mutation to arbitrary origins or unrelated paths. */
export function recruiterInboxReturnUrl(raw:unknown,requestUrl:string):URL{
 const fallback=new URL("/hr/conversations",requestUrl);
 if(typeof raw!=="string"||raw.length>1024)return fallback;
 try{
  const target=new URL(raw,requestUrl);
  if(target.origin!==fallback.origin||target.pathname!==fallback.pathname||
     target.username||target.password||target.hash)return fallback;
  const input=Object.fromEntries(target.searchParams.entries());
  if(!hrConversationQuerySchema.safeParse(input).success)return fallback;
  return target;
 }catch{return fallback;}
}
