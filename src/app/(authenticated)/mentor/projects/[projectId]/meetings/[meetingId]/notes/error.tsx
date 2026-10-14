"use client";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <section role="alert" className="space-y-3 rounded-xl border border-border p-5">
    <h1>Meeting notes could not load</h1>
    <p>This is a read error, not evidence that the meeting has no notes.</p>
    <button type="button" onClick={reset} className="min-h-10 text-primary-text underline">Retry</button>
  </section>;
}
