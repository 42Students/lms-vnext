import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { SkeletonBlock } from "@/components/ui/skeleton-block";

/** UX-G123: keep context and a visible slow-loading retry on the public campus route. */
export default function Loading() {
  return (
    <main aria-label="For Universities" className="flex min-h-dvh w-full min-w-0 flex-col bg-background px-5 py-12 md:py-20">
      <div className="mx-auto w-full max-w-[1180px] min-w-0">
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--lms-primary-text)]">For Universities</p>
        <GracefulPageLoading label="Loading university information…">
          <div className="mt-6 space-y-5" aria-hidden="true">
            <SkeletonBlock className="h-10 w-full max-w-xl" />
            <SkeletonBlock className="h-5 w-full max-w-2xl" />
            <div className="grid gap-4 pt-8 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <SkeletonBlock key={index} className="h-32" />
              ))}
            </div>
          </div>
        </GracefulPageLoading>
      </div>
    </main>
  );
}
