"use client";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
return <section role="alert" className="border-b border-border bg-transparent py-6"><h1 className="font-semibold text-[30px] text-[var(--lms-heading)]">Unable to load contact details</h1><p className="mt-2 text-sm text-body">The read failed; this does not mean contact fields are empty.</p><button onClick={reset} className="mt-4 rounded-md border border-border px-4 py-2 text-sm font-semibold">Retry</button></section>;
}
