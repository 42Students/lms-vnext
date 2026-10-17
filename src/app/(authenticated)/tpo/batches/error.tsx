"use client";
export default function Error({reset}:{reset:()=>void}){
 return <section role="alert" className="space-y-3 rounded-lg border border-border bg-surface p-5">
  <h1 className="font-semibold">Couldn&apos;t refresh batches</h1>
  <p className="text-sm text-body">The latest batch data could not be loaded. No eligibility decisions were changed.</p>
  <button type="button" className="min-h-11 rounded border border-border px-4 text-sm font-semibold text-primary-text" onClick={reset}>Retry</button>
 </section>;
}
