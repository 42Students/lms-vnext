import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { SkeletonBlock } from "@/components/ui/skeleton-block";

/** UX-G050: contextual public loading, bounded retry stays in the shared loader. */
export default function Loading() {
 return <MarketingLayout>
  <section aria-label="Loading enterprise solutions" className="mx-auto min-w-0 max-w-[1180px] py-12 md:py-20">
   <p className="text-sm font-semibold uppercase tracking-wider text-[var(--lms-primary-text)]">For Enterprises</p>
   <GracefulPageLoading label="Loading enterprise solutions…">
    <div aria-hidden="true" className="mt-6 space-y-5">
     <SkeletonBlock className="h-10 w-full max-w-xl" />
     <SkeletonBlock className="h-5 w-full max-w-2xl" />
     <div className="grid gap-4 pt-8 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({length:3},(_,index)=><SkeletonBlock key={index} className="h-32" />)}
     </div>
    </div>
   </GracefulPageLoading>
  </section>
 </MarketingLayout>;
}
