"use client";
export default function Error({reset}:{reset:()=>void}){
 return <section role="alert" className="space-y-3 rounded-xl border border-warning-border bg-surface p-5">
  <h1 className="font-semibold">Could not load Home</h1>
  <p className="text-sm text-body">Something went wrong while loading this content. Your current context has been kept.</p>
  <button type="button" className="min-h-11 rounded border border-border px-4 py-2 text-sm font-semibold text-primary-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={reset}>Retry</button>
 </section>;
}
