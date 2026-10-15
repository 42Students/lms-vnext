import { batchDirectoryState, type BatchDirectoryRow } from "./tpo-batch-directory-filter-model";
export function summarizeTpoBatchStates(rows:readonly BatchDirectoryRow[]){
 const total=rows.length;const finished=rows.filter(r=>batchDirectoryState(r)==="FINISHED").length;
 const invited=rows.filter(r=>batchDirectoryState(r)==="INVITED").length;
 return {total,planning:total-invited-finished,invited,finished};
}
