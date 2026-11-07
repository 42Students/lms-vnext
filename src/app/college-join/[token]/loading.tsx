import authStyles from "@/components/public/public-auth-skin.module.css";
import { PageHeader } from "@/components/ui/page-header";

/** A stable card footprint prevents the invitation from jumping during preview. */
export default function Loading() {
  return <main className={`${authStyles["page"]} mx-auto flex min-h-dvh w-full min-w-0 items-center justify-center px-4 py-4`}>
    <section className="w-full max-w-[440px] min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 sm:p-5"
      role="status" aria-label="Loading college invitation" aria-busy="true">
      <PageHeader title="Checking your college invitation..." />
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => <div key={index}
          className={`h-4 rounded bg-muted motion-safe:animate-pulse ${index === 3 ? "w-3/5" : "w-full"}`} />)}
      </div>
    </section>
  </main>;
}
