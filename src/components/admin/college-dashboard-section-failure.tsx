import Link from "next/link";
/** A failed secondary College Admin query never masquerades as an empty result. */
export function CollegeDashboardSectionFailure({title}:{title:string}){
 return <section role="alert" aria-label={title} className="space-y-3 - border-t border-border pt-5">
  <h2 className="font-semibold text-foreground">{title}</h2>
  <p className="text-sm text-body">Could not load this right now. Try again.</p>
  <Link href="/college" className="inline-flex min-h-10 items-center rounded-[var(--lms-control-radius,9px)] border border-border px-3 font-semibold text-primary-text underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
   Retry
  </Link>
 </section>;
}
