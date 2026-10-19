"use client";
export default function Error({reset}:{error:Error & {digest?:string};reset:()=>void}){
  return <section role="alert" className="border-b border-border bg-transparent py-6">
    <h1 className="font-semibold text-[30px] text-[var(--lms-heading)]">Could not load Section submissions</h1>
    <p className="mt-2 text-sm text-body">
      The read failed; that does not mean the Section has no submissions.
    </p>
    <button type="button" onClick={reset}
      className="mt-4 rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">
      Retry
    </button>
  </section>;
}
