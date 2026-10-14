"use client";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <section role="alert" className="space-y-3 rounded-xl border border-border p-5">
    <h1 className="font-semibold">Project evidence could not load</h1>
    <p>Readiness is unavailable because the request failed, not because there are no gaps.</p>
    <button type="button" onClick={reset} className="min-h-10 text-primary-text underline">Retry</button>
  </section>;
}
