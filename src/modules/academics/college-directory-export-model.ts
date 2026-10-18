import { escapeActivityCsvCell } from "@/modules/activity/college-activity-export-model";
/** Keep spreadsheet formula controls inert even with leading Unicode format marks.
 * The common CSV serializer handles ordinary formulas; this guard also covers
 * invisible prefixes that some spreadsheet engines silently strip. */
function safeCollegeCsvCell(value:string):string {
 const visible=value.replace(/^[\s\p{Cf}\p{Mn}]*/u,"");
 return escapeActivityCsvCell(/^[=+@-]/u.test(visible)?"'"+value:value);
}

export function exportParams(params:URLSearchParams):Record<string,string>|null {
 const result:Record<string,string>={};
 for(const key of params.keys()){
  if(params.getAll(key).length!==1)return null;
  const value=params.get(key);
  if(value)result[key]=value;
 }
 return result;
}
export function buildCollegeDirectoryCsv(headers:readonly string[],
 rows:readonly (readonly string[])[],truncated:boolean,cap:number){
 const lines=[headers.map(safeCollegeCsvCell).join(",")];
 for(const cells of rows)lines.push(cells.map(safeCollegeCsvCell).join(","));
 if(truncated)lines.push(["EXPORT TRUNCATED",
  "Only the first "+cap+" matching records were exported. Narrow your filters."].map(safeCollegeCsvCell).join(","));
 return "\ufeff"+lines.join("\r\n");
}
export async function collectCollegeExportRows<T>(
 read:(page:number)=>Promise<{items:T[];total:number;totalPages:number}>,
 pageSize:number,cap=1000){
 // This is also invoked by internal export jobs; do not rely solely on
 // HTTP-boundary schemas to prevent an infinite or oversized paging walk.
 if(!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>1000)
  throw new RangeError("INVALID_EXPORT_PAGE_SIZE");
 if(!Number.isSafeInteger(cap)||cap<1||cap>1000)
  throw new RangeError("INVALID_EXPORT_CAP");
 const first=await read(1);
 const rows=[...first.items];
 const maxPages=Math.ceil(cap/pageSize);
 for(let page=2;page<=Math.min(first.totalPages,maxPages);page++){
  const next=await read(page);
  rows.push(...next.items);
 }
 return {rows:rows.slice(0,cap),truncated:first.total>cap,cap};
}
