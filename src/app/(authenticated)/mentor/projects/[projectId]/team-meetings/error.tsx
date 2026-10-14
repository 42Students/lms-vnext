"use client";
export default function Error({reset}:{
  error:Error & {digest?:string};reset:()=>void;
}){
  return <section role="alert" className="rounded-xl border border-border bg-surface p-6">
    <h1 className="font-semibold text-foreground">Unable to load team and meeting history</h1>
    <p className="mt-2 text-sm text-body">The scoped read failed. No meeting history was fabricated.</p>
    <button type="button" onClick={reset}
      className="mt-4 rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">
      Retry
    </button>
  </section>;
}
