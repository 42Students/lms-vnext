"use client";

export default function Error({reset}:{
  error:Error & {digest?:string};reset:()=>void;
}){
  return <section role="alert" className="border-b border-border bg-transparent py-6">
    <h1 className="font-semibold text-[var(--lms-heading)] text-[30px] leading-9">Could not load placement notification preferences</h1>
    <p className="mt-2 text-sm text-body">The read failed. No saved-state assumption was made.</p>
    <button type="button" onClick={reset}
      className="mt-4 rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">Retry</button>
  </section>;
}
