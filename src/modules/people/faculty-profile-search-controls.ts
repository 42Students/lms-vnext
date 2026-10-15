/** Hidden search inputs must not continue filtering the draft. */
export function facultyProfileActiveSearch(query:string,recordCount:number,minimum=5):string {
 return recordCount>minimum?query:"";
}

/** When a profile search hides records, moving by absolute index is misleading. */
export function facultyProfileCanReorderVisible(total:number,visible:number):boolean{
 return total===visible;
}
