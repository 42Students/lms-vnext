import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { SkeletonBlock } from "@/components/ui/skeleton-block";

/** UX-G077: public platform content placeholder with the shared slow-retry. */
export default function Loading() {
 return <MarketingLayout>
  <section aria-label="Loading platform overview" className="mx-auto min-w-0 max-w-[1180px] py-12 md:py-20">
   <p className="text-sm font-semibold uppercase tracking-wider text-[var(--lms-primary-text)]">The platform</p>
   <GracefulPageLoading label="Loading platform overview…">
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
