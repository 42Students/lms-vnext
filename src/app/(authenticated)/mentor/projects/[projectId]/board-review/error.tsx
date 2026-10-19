"use client";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <section role="alert" className="rounded-xl border border-border p-5">
    <h1 className="text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">Task board status could not load</h1>
    <p>The read failed, not that the project has no tasks.</p>
    <button type="button" onClick={reset} className="min-h-10 text-link underline">Retry</button>
  </section>;
}
