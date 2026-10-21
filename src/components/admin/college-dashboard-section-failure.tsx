import Link from "next/link";
import { ErrorState } from "@/components/ui/error-state";

/** A failed secondary College Admin query never masquerades as an empty result. */
export function CollegeDashboardSectionFailure({title}:{title:string}){
 return <div className="min-w-0 border-t border-border pt-4">
  <ErrorState title={/today(?:'s)? overview/i.test(title) ? "Couldn't load today's overview" : title}
   description="Could not load this right now. Try again."
   action={<Link href="/college" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 print:hidden">Retry</Link>}/>
 </div>;
}
