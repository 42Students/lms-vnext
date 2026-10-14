"use client";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <section role="alert" className="space-y-3 rounded-xl border border-border p-5">
    <h1>Delivery review could not load</h1>
    <p>A failed read is not evidence that this version has no review.</p>
    <button type="button" onClick={reset} className="min-h-10 text-primary-text underline">Retry</button>
  </section>;
}
