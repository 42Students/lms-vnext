/** A replayed request-bulk run may only refer to its original decision and IDs.
 * Ordering of selected rows is immaterial, but duplicates and unknown shapes fail closed.
 */
export function sameTpoBulkRequestRun(
 metadata:unknown,
 input:{action:"APPROVE"|"REJECT";requestIds:readonly string[]},
):boolean{
 if(metadata===null||typeof metadata!=="object"||Array.isArray(metadata))return false;
 const old=metadata as Record<string,unknown>;
 if(old.action!==input.action||!Array.isArray(old.requestIds)||
    old.requestIds.length!==input.requestIds.length)return false;
 if(input.requestIds.length===0||new Set(input.requestIds).size!==input.requestIds.length)return false;
 const savedIds:unknown[]=old.requestIds;
 if(savedIds.some(id=>typeof id!=="string"))return false;
 const ids=savedIds.filter((id):id is string=>typeof id==="string");
 if(new Set(ids).size!==ids.length)return false;
 const submitted=new Set(input.requestIds);
 return ids.every(id=>submitted.has(id));
}
