import {announcementAdminListSchema} from "./validation";
const keys=new Set(["includeDeleted","beforeCreatedAt","beforeId","limit"]);
export function parseAnnouncementAdminApiQuery(params:URLSearchParams){
 const values:Record<string,string>={};
 for(const [key,value] of params){
  if(!keys.has(key)||Object.hasOwn(values,key))return null;
  values[key]=value;
 }
 const raw={
  includeDeleted:values.includeDeleted||undefined,
  beforeCreatedAt:values.beforeCreatedAt||undefined,
  beforeId:values.beforeId||undefined,
  limit:values.limit||undefined,
 };
 return announcementAdminListSchema.safeParse(raw).success?raw:null;
}
