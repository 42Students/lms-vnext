"use client";
export default function FacultyProfileDetailsError({reset}:{reset:()=>void}){
 return <section role="alert" className="space-y-4 rounded-xl border border-border bg-surface p-5">
  <h2 className="font-semibold text-foreground">Faculty profile could not load</h2>
  <p className="text-sm text-body">Your previous information has not been changed.</p>
  <button type="button" onClick={reset} className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold">Retry</button>
 </section>;
}
