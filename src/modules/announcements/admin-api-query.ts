import {announcementAdminListSchema} from "./validation";
const keys=new Set(["includeDeleted","beforeCreatedAt","beforeId","limit","q","receiverType","visibility","pinned","senderType"]);
export function parseAnnouncementAdminApiQuery(params:URLSearchParams){
 const values:Record<string,string>={};
 for(const [key,value] of params){
  if(!keys.has(key)||Object.hasOwn(values,key))return null;
  values[key]=value;
 }
 const raw={
  includeDeleted:values["includeDeleted"]||undefined,
  q:values["q"]?.trim()||undefined,
  receiverType:values["receiverType"]||undefined,
  visibility:values["visibility"]||undefined,
  pinned:values["pinned"]||undefined,
  senderType:values["senderType"]||undefined,
  beforeCreatedAt:values["beforeCreatedAt"]||undefined,
  beforeId:values["beforeId"]||undefined,
  limit:values["limit"]||undefined,
 };
 return announcementAdminListSchema.safeParse(raw).success?raw:null;
}
