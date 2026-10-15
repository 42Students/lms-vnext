type FilterChoice={value:string;label:string};
export type GridFilterChoice={allValue?:string;options:readonly FilterChoice[]};
/** Bookmark values can go stale; never use an unlisted value as a selected option. */
export function invalidTpoGridFilterValue(raw:string|null,field:GridFilterChoice):boolean {
 if(!raw||raw===(field.allValue??""))return false;
 return !field.options.some(option=>option.value===raw);
}
export function resolvedTpoGridFilterValue(raw:string|null,field:GridFilterChoice):string {
 return invalidTpoGridFilterValue(raw,field)?(field.allValue??""):(raw||field.allValue||"");
}

/** Only genuine non-default filter selections count; columns and search never inflate the badge. */
export function activeTpoGridFilterCount(query:URLSearchParams,fields:readonly {key:string;urlKey?:string;allValue?:string}[]):number {
 return fields.filter(field=>{
  const value=query.get(field.urlKey??"filter."+field.key);
  return value!==null&&value!==""&&value!==(field.allValue??"");
 }).length;
}
