import { spreadsheetCsvCell } from "@/security/csv-cell";
/** One tested spreadsheet protection path for every academic export. */
const safeCollegeCsvCell = spreadsheetCsvCell;

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
 if(!Number.isSafeInteger(cap)||cap<1||cap>1000)
  throw new RangeError("INVALID_EXPORT_CAP");
 const lines=[headers.map(safeCollegeCsvCell).join(",")];
 for(const cells of rows.slice(0,cap))lines.push(cells.map(safeCollegeCsvCell).join(","));
 if(truncated||rows.length>cap)lines.push([
  "EXPORT TRUNCATED",
  "Only the first "+cap+" matching records were exported. Narrow your filters.",
  ...Array.from({length:Math.max(0,headers.length-2)},()=>""),
 ].map(safeCollegeCsvCell).join(","));
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
 const expected=first.total;
 const requiredPages=Math.ceil(Math.min(expected,cap)/pageSize);
 if(!Number.isSafeInteger(expected)||expected<0 ||
    !Number.isSafeInteger(first.totalPages)||first.totalPages<requiredPages ||
    first.items.length>pageSize)throw new Error("COLLEGE_EXPORT_STALE");
 const rows=[...first.items];
 for(let page=2;page<=Math.min(first.totalPages,Math.ceil(cap/pageSize));page++){
  const next=await read(page);
  if(next.total!==expected||next.totalPages!==first.totalPages ||
     next.items.length>pageSize)throw new Error("COLLEGE_EXPORT_STALE");
  rows.push(...next.items);
 }
 const selected=rows.slice(0,cap);
 if(selected.length!==Math.min(expected,cap))throw new Error("COLLEGE_EXPORT_STALE");
 // Directory DTOs with stable IDs must not return the same record twice
 // across offset pages when records are added or removed during export.
 const ids=selected.map(row=>typeof row==="object"&&row!==null&&"id" in row?
  (row as {id?:unknown}).id:null).filter((id):id is string=>typeof id==="string");
 if(new Set(ids).size!==ids.length)throw new Error("COLLEGE_EXPORT_STALE");
 return {rows:selected,truncated:expected>cap,cap};
}
