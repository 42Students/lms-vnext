import {trackerAdminListSchema} from "./admin-validation";
const keys=new Set(["status","severity","environment","q","sort","beforeCreatedAt","beforeId","limit"]);
export function parseTrackerIssuesApiQuery(params:URLSearchParams){
 const raw:Record<string,string>={};
 for(const [key,value] of params){
  if(!keys.has(key)||Object.hasOwn(raw,key))return null;
  raw[key]=value;
 }
 const input={
  status:raw["status"]||undefined,
  severity:raw["severity"]||undefined,
  environment:raw["environment"]||undefined,
  q:raw["q"]?.trim()||undefined,
  sort:raw["sort"]||undefined,
  beforeCreatedAt:raw["beforeCreatedAt"]||undefined,
  beforeId:raw["beforeId"]||undefined,
  limit:raw["limit"]||undefined,
 };
 return trackerAdminListSchema.safeParse(input).success?input:null;
}
