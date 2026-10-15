/** Hidden search inputs must not continue filtering the draft. */
export function facultyProfileActiveSearch(query:string,recordCount:number,minimum=5):string {
 return recordCount>minimum?query:"";
}

/** When a profile search hides records, moving by absolute index is misleading. */
export function facultyProfileCanReorderVisible(total:number,visible:number):boolean{
 return total===visible;
}

/** Immediately reveal the newly added draft by resetting a narrower search. */
export function facultyProfileSearchAfterInsertion(_previous:string):string{
 return "";
}

/** Search result count is a display aid; section writes still use every record. */
export function facultyProfileSearchSummary(total:number,visible:number):string{
 return "Showing "+visible+" of "+total+" records";
}
