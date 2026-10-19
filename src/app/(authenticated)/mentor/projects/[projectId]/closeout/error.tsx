"use client";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void;}){
  return <section role="alert" className="space-y-3 p-5"><h1 className="font-semibold text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">Closeout could not load</h1><p>The read failed; project status is unknown.</p><button type="button" onClick={reset} className="text-link underline">Retry</button></section>;
}