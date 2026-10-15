/** PostgreSQL ILIKE defaults to backslash escaping of pattern wildcards. */
export function superAdminHrLiteralSearchPattern(raw:string){
 return "%"+raw.replace(/[\\%_]/g,character=>"\\"+character)+"%";
}
