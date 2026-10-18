"use client";
export default function TeamError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <section role="alert" className="space-y-3 rounded-xl border border-border bg-surface p-5">
 <h2 className="font-semibold text-foreground">Placement team unavailable</h2>
 <p className="text-sm text-body">Team membership could not be loaded. This does not mean the team is empty.</p>
 <button type="button" onClick={reset} className="min-h-11 rounded-[9px] border border-border px-4 text-primary-text">Retry</button>
 </section>;
}
