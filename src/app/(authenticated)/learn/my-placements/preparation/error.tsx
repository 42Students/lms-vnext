"use client";

export default function Error({reset}:{
  error:Error & {digest?:string};reset:()=>void;
}) {
  return <section role="alert" className="py-6">
    <h1 className="font-semibold text-[var(--lms-heading)] text-[30px] leading-9">Unable to load placement preparation</h1>
    <p className="mt-2 text-sm text-body">
      Your registered information could not be loaded. This does not mean you
      are ineligible or that your record is empty.
    </p>
    <button type="button" onClick={reset}
      className="mt-4 min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">
      Retry
    </button>
  </section>;
}
