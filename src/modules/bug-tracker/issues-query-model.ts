import {trackerAdminListSchema} from "./admin-validation";
const pageKeys=new Set(["status","severity","environment","q","reporter","sort","beforeCreatedAt","beforeId"]);
export function parseTrackerIssuesPageParams(raw:Record<string,string|string[]|undefined>){
 if(Object.keys(raw).some(key=>!pageKeys.has(key)||Array.isArray(raw[key])))return null;
 const input={
  status:raw.status||undefined,
  severity:raw.severity||undefined,
  environment:raw.environment||undefined,
  q:(typeof raw.q==="string"?raw.q.trim():"")||undefined,
  reporter:(typeof raw.reporter==="string"?raw.reporter.trim():"")||undefined,
  sort:raw.sort||undefined,
  beforeCreatedAt:raw.beforeCreatedAt||undefined,
  beforeId:raw.beforeId||undefined,
  // Legacy issue directory displays 20 rows per fetch; cursors retain every facet.
  limit:20,
 };
 const parsed=trackerAdminListSchema.safeParse(input);
 return parsed.success?{input,display:parsed.data}:null;
}
