import { escapeActivityCsvCell } from "@/modules/activity/college-activity-export-model";
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
 const lines=[headers.map(escapeActivityCsvCell).join(",")];
 for(const cells of rows)lines.push(cells.map(escapeActivityCsvCell).join(","));
 if(truncated)lines.push(["EXPORT TRUNCATED",
  "Only the first "+cap+" matching records were exported. Narrow your filters."].map(escapeActivityCsvCell).join(","));
 return "\ufeff"+lines.join("\r\n");
}
export async function collectCollegeExportRows<T>(
 read:(page:number)=>Promise<{items:T[];total:number;totalPages:number}>,
 pageSize:number,cap=1000){
 const first=await read(1);
 const rows=[...first.items];
 const maxPages=Math.ceil(cap/pageSize);
 for(let page=2;page<=Math.min(first.totalPages,maxPages);page++){
  const next=await read(page);
  rows.push(...next.items);
 }
 return {rows:rows.slice(0,cap),truncated:first.total>cap,cap};
}
