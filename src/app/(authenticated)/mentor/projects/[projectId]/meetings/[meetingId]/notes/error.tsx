"use client";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <section role="alert" className="space-y-3 rounded-xl border border-border p-5">
    <h1 className="text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">Meeting notes could not load</h1>
    <p>This is a read error, not evidence that the meeting has no notes.</p>
    <button type="button" onClick={reset} className="min-h-10 text-link underline">Retry</button>
  </section>;
}
