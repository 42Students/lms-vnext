export type ProfileRefreshInput={
 visible:boolean; editing:boolean; saving:boolean; nowMs:number;lastRefreshMs:number;
};
export function learnerProfileCanRefresh(input:ProfileRefreshInput){
 return input.visible&&!input.editing&&!input.saving&&Number.isFinite(input.nowMs)&&
   input.nowMs-input.lastRefreshMs>=45_000;
}
/** Only replace a local profile if it is still the exact last server snapshot. */
export function learnerProfileReconcile<T>(local:T,priorServer:T,nextServer:T){
 return JSON.stringify(local)===JSON.stringify(priorServer)?nextServer:local;
}
