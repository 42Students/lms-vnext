"use client";
export default function CompanyShareError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
  <section role="alert" className="space-y-4 rounded-xl border border-border bg-surface p-6">
   <h1 className="text-xl font-semibold text-foreground">Applicant list unavailable</h1>
   <p className="text-sm text-body">
    The shared applicant list could not be loaded. The link might have expired,
    been revoked or the service may be temporarily unavailable.
    Contact the placement officer if the issue continues.
   </p>
   <button type="button" onClick={reset}
    className="min-h-11 rounded bg-primary px-4 text-sm font-semibold text-on-primary">
    Try again
   </button>
   <a href="/" className="inline-flex min-h-11 items-center px-4 text-sm font-semibold text-primary-text underline">Home</a>
  </section>
 </main>;
}
