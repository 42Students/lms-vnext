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
