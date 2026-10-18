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

/** A replay reports exactly the originally audited number of decided rows.
 * Missing, malformed or impossible counts cannot be replaced with fresh
 * statuses, because the underlying decisions may have changed since the run. */
export function persistedTpoBulkRequestCount(metadata:unknown,selectedSize:number):number|null{
 if(!metadata||typeof metadata!=="object"||Array.isArray(metadata)||
    !Number.isSafeInteger(selectedSize)||selectedSize<1||selectedSize>10)return null;
 const value=(metadata as Record<string,unknown>).verifiedCount;
 return typeof value==="number"&&Number.isSafeInteger(value)&&
  value>=0&&value<=selectedSize?value:null;
}
