export type TpoBulkActionCount={action:string;label:string;ready:number;skipped:number;reasonSamples:string[]};
/** Suggestions never apply changes: the operator must inspect the signed row preview. */
export function suggestTpoBulkAction(counts:readonly TpoBulkActionCount[]):TpoBulkActionCount|null{
 const candidates=counts.filter(x=>Number.isSafeInteger(x.ready)&&x.ready>0);
 if(candidates.length===0)return null;
 return [...candidates].sort((a,b)=>b.ready-a.ready)[0]??null;
}
