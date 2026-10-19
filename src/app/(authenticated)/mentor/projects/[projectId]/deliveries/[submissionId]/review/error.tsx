"use client";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <section role="alert" className="space-y-3 rounded-xl border border-border p-5">
    <h1 className="text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">Delivery review could not load</h1>
    <p>A failed read is not evidence that this version has no review.</p>
    <button type="button" onClick={reset} className="min-h-10 text-link underline">Retry</button>
  </section>;
}
