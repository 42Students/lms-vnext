import { z } from "zod";

const MAX_SEARCH_CODEPOINTS=100;
const MAX_ROUND_SEARCH_RESULTS=200;
/** Query length is counted by Unicode code points, not UTF-16 units.
 * The secondary 400-unit cap bounds URL processing for hostile inputs. */
const queryText=z.string().trim().max(400)
 .refine(value=>[...value].length<=MAX_SEARCH_CODEPOINTS,
  "Search is limited to 100 characters");
const searchLimit=z.preprocess(value=>{
 if(value===undefined||value===null||value==="")return 25;
 const numeric=typeof value==="string"&&value.trim()===""?25:Number(value);
 if(!Number.isFinite(numeric))return 25;
 return Math.max(0,Math.min(MAX_ROUND_SEARCH_RESULTS,Math.floor(numeric)));
},z.number().int().min(0).max(MAX_ROUND_SEARCH_RESULTS));

/** Shareable search, never a tenant, membership or persisted-submission selector.
 * Limit zero is an explicit empty preview; malformed limits use safe default25.
 */
export const learnerRoundSearchQuerySchema=z.object({
 q:queryText.optional().default(""),
 limit:searchLimit.optional().default(25),
}).strict();

export function learnerRoundSearchFromQuery(raw:unknown):string {
 return learnerRoundSearchQuerySchema.parse(raw).q;
}

export function learnerRoundSearchLimitFromQuery(raw:unknown):number {
 return searchLimit.parse(raw);
}

export function learnerRoundSearchHref(currentUrl:string,query:string):string {
 const q=learnerRoundSearchQuerySchema.parse({q:query}).q;
 const url=new URL(currentUrl,"https://lms.invalid");
 if(q)url.searchParams.set("q",q);
 else url.searchParams.delete("q");
 if(url.searchParams.has("limit")){
  const rawLimit=url.searchParams.get("limit");
  const limit=learnerRoundSearchLimitFromQuery(rawLimit);
  url.searchParams.set("limit",String(limit));
 }
 return url.pathname+url.search+url.hash;
}
