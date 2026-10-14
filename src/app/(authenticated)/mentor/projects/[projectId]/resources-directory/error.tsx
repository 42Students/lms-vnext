"use client";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <section role="alert" className="space-y-3 rounded-xl border border-border bg-surface p-5">
  <h1>Resource directory could not load</h1>
  <p>A failed read does not mean no resources are registered.</p>
  <button type="button" onClick={reset} className="min-h-10 text-primary-text underline">Retry</button>
 </section>;
}
