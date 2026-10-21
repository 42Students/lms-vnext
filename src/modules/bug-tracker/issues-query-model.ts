import {trackerAdminListSchema} from "./admin-validation";
const pageKeys=new Set(["status","severity","environment","q","search","page","reporter",
 "sort","beforeCreatedAt","beforeId"]);
/** Legacy ?search= and ?page=N links are safe, bounded aliases for vNext's
 * q and opaque cursors. The server page resolves the requested offset by
 * traversing authorized 20-row cursors rather than trusting a raw DB offset.
 */
export function parseTrackerIssuesPageParams(raw:Record<string,string|string[]|undefined>){
 if(Object.keys(raw).some(key=>!pageKeys.has(key)||Array.isArray(raw[key])))return null;
 const originalSearch=typeof raw.search==="string"?raw.search.trim():"";
 const modernSearch=typeof raw.q==="string"?raw.q.trim():"";
 if(originalSearch&&modernSearch&&originalSearch!==modernSearch)return null;
 let legacyPage:number|null=null;
 if(raw.page!==undefined){
  if(typeof raw.page!=="string"||!/^[1-9][0-9]{0,1}$/.test(raw.page))return null;
  legacyPage=Number(raw.page);
  // Cursor walk limits work to at most 20 sequential bounded pages.
  if(legacyPage>20||raw.beforeCreatedAt!==undefined||raw.beforeId!==undefined)return null;
 }
 const input={
  status:raw.status||undefined,
  severity:raw.severity||undefined,
  environment:raw.environment||undefined,
  q:modernSearch||originalSearch||undefined,
  reporter:(typeof raw.reporter==="string"?raw.reporter.trim():"")||undefined,
  sort:raw.sort||undefined,
  beforeCreatedAt:raw.beforeCreatedAt||undefined,
  beforeId:raw.beforeId||undefined,
  limit:20,
 };
 const parsed=trackerAdminListSchema.safeParse(input);
 return parsed.success?{input,display:parsed.data,legacyPage}:null;
}
