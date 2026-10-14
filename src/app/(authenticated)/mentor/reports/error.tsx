"use client";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <section role="alert" className="space-y-3 rounded-xl border border-border bg-surface p-5">
    <h1>Mentor reports could not load</h1>
    <p>No project summary can be inferred from this failed read.</p>
    <button type="button" onClick={reset} className="min-h-10 text-primary-text underline">Retry</button>
  </section>;
}
