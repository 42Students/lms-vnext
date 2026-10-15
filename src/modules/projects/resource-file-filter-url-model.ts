import {resourceFileFilterSchema,type ResourceFileFilter} from "./resource-file-filter-model";
const KEYS=new Set(["search","state","order","page","pageSize"]);
/** Reject ambiguous or unknown URL state before showing a file directory. */
export function resourceFileFiltersFromUrl(params:URLSearchParams):ResourceFileFilter {
 const values:Record<string,string|number>={};
 for(const [key,value] of params){
  if(!KEYS.has(key)||Object.hasOwn(values,key))throw new Error("INVALID_RESOURCE_FILE_FILTERS");
  if(key==="page"||key==="pageSize"){
   if(!/^[1-9]\d{0,4}$/.test(value))throw new Error("INVALID_RESOURCE_FILE_FILTERS");
   values[key]=Number(value);
  }else values[key]=value;
 }
 return resourceFileFilterSchema.parse(values);
}
/** Return a query string only; the authorized caller owns the resource path. */
export function resourceFileFilterQuery(raw:unknown,resetPage=false):string {
 const q=resourceFileFilterSchema.parse(raw);
 const params=new URLSearchParams();
 if(q.search)params.set("search",q.search);
 if(q.state!=="ALL")params.set("state",q.state);
 if(q.order!=="NEWEST")params.set("order",q.order);
 if(!resetPage&&q.page>1)params.set("page",String(q.page));
 if(q.pageSize!==20)params.set("pageSize",String(q.pageSize));
 const result=params.toString();
 return result?"?"+result:"";
}
