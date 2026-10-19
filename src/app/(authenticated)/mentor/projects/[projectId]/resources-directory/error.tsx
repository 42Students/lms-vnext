"use client";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <section role="alert" className="space-y-3 border-b border-border pb-4">
  <h1 className="text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">Resource directory could not load</h1>
  <p>A failed read does not mean no resources are registered.</p>
  <button type="button" onClick={reset} className="min-h-10 text-link underline">Retry</button>
 </section>;
}
