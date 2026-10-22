/** College-scoped job-type selection policy shared by drive editors.
 * Configured rows must come from the authorized college inside the write
 * transaction; do not use a cross-tenant cached type directory here. */
export type DriveJobTypeChoice = {
 label:string;countsAsPlaced:boolean;
};
type ConfiguredJobType = {label:string;active:boolean;countsAsPlaced:boolean|null};
type BuiltinJobType = {label:string;countsAsPlaced:boolean};

/** Returns null for forbidden changes. Historic hidden names are grandfathered
 * only when the editor keeps that SAME persisted value, including its
 * historical counts-as-placed snapshot. */
export function resolveTpoDriveJobTypeChoice(
 input:string|null,
 current:{label:string|null;countsAsPlaced:boolean|null},
 configured:readonly ConfiguredJobType[],
 builtins:readonly BuiltinJobType[],
):DriveJobTypeChoice|null {
 const requested=input?.trim().replace(/\s+/g," ")??"";
 if(!requested)return null;
 if(current.label?.toLocaleLowerCase("en-IN")===requested.toLocaleLowerCase("en-IN")){
  return {label:current.label,countsAsPlaced:current.countsAsPlaced??true};
 }
 const normalized=requested.toLocaleLowerCase("en-IN");
 const builtin=builtins.find(row=>row.label.toLocaleLowerCase("en-IN")===normalized);
 const saved=configured.find(row=>row.label.toLocaleLowerCase("en-IN")===normalized);
 if((!builtin&&!saved)||saved?.active===false)return null;
 return {label:builtin?.label??saved!.label,
  countsAsPlaced:saved?.countsAsPlaced??builtin?.countsAsPlaced??true};
}
