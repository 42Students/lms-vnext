/** Hidden search inputs must not continue filtering the draft. */
export function facultyProfileActiveSearch(query:string,recordCount:number,minimum=5):string {
 return recordCount>minimum?query:"";
}
