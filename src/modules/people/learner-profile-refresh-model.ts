export type ProfileRefreshInput={
 visible:boolean; editing:boolean; saving:boolean; nowMs:number;lastRefreshMs:number;
};
export function learnerProfileCanRefresh(input:ProfileRefreshInput){
 return input.visible&&!input.editing&&!input.saving&&Number.isFinite(input.nowMs)&&
   input.nowMs-input.lastRefreshMs>=45_000;
}
/** Only replace a local profile if it is still the exact last server snapshot. */
export function learnerProfileReconcile<T extends object>(local:T,priorServer:T,nextServer:T):T {
 const result={...local};
 for(const key of Object.keys(nextServer) as (keyof T)[]){
   if(JSON.stringify(local[key])===JSON.stringify(priorServer[key])){
     result[key]=nextServer[key];
   }
 }
 return result;
}
