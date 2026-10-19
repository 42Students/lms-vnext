"use client";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void;}){
  return <section role="alert" className="space-y-3 p-5"><h1 className="text-[30px] font-semibold text-[var(--lms-heading)]">Gradebook could not load</h1><p>Scores are unavailable, not zero.</p><button type="button" onClick={reset} className="text-primary-text inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold">Retry</button></section>;
}