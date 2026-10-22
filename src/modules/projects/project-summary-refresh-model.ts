/** Distinguish our own acknowledged PATCH from a concurrent editor during
 * router.refresh. Never overwrite unsaved form data on an external change. */
export function projectSummaryRefreshDecision(input:{
 incomingProjectId:string;incomingVersion:string;
 baselineProjectId:string;baselineVersion:string;
 dirty:boolean;selfSavedProjectId:string|null;selfSavedVersion:string|null;
}):"UNCHANGED"|"KEEP_DIRTY"|"REINITIALIZE"{
 if(input.incomingProjectId===input.baselineProjectId&&
    input.incomingVersion===input.baselineVersion)return "UNCHANGED";
 if(input.incomingProjectId===input.baselineProjectId&&input.dirty&&
    (input.selfSavedProjectId!==input.incomingProjectId||
     input.selfSavedVersion!==input.incomingVersion))return "KEEP_DIRTY";
 return "REINITIALIZE";
}
