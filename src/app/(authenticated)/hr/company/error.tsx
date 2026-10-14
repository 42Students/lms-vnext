"use client";
export default function Error({reset}:{error:Error;reset:()=>void}){return <section role="alert" className="rounded-lg border border-border bg-surface p-5"><h2 className="font-semibold">Company & Team could not load</h2><button onClick={reset} className="mt-3 rounded bg-primary px-3 py-2 text-on-primary">Try again</button></section>;}
