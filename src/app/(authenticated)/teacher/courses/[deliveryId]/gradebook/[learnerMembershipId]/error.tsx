"use client";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void;}){
  return <section role="alert" className="space-y-3 p-5">
    <h1>Published learner scores could not load</h1>
    <p>The read failed. Missing scores are not assumed to be zero.</p>
    <button type="button" onClick={reset} className="text-primary-text underline">Retry</button>
  </section>;
}
