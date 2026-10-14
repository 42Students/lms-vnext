"use client";

export default function Error({reset}:{
  error:Error & {digest?:string};reset:()=>void;
}){
  return <section role="alert" className="rounded-xl border border-border bg-surface p-6">
    <h1 className="text-lg font-semibold text-foreground">Could not load placement notification preferences</h1>
    <p className="mt-2 text-sm text-body">The read failed. No saved-state assumption was made.</p>
    <button type="button" onClick={reset}
      className="mt-4 rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">Retry</button>
  </section>;
}
