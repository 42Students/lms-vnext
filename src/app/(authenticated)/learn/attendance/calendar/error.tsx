"use client";

export default function Error({reset}:{
  error:Error & {digest?:string};
  reset:()=>void;
}) {
  return <section role="alert" className="rounded-xl border border-border bg-surface p-6">
    <h1 className="font-semibold text-foreground">Attendance calendar could not be loaded</h1>
    <p className="mt-2 text-sm text-body">
      The read failed; missing or unmarked sessions cannot be inferred from this error.
    </p>
    <button type="button" onClick={reset}
      className="mt-4 rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">
      Retry
    </button>
  </section>;
}
