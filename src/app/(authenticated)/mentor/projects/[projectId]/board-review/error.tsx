"use client";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <section role="alert" className="rounded-xl border border-border p-5">
    <h1>Task board status could not load</h1>
    <p>The read failed, not that the project has no tasks.</p>
    <button type="button" onClick={reset} className="min-h-10 text-primary-text underline">Retry</button>
  </section>;
}
