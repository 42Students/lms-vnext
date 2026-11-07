import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { Heading } from "@/components/ui/heading";

export default function Loading() {
  return <main className="mx-auto w-full max-w-3xl min-w-0 px-4 py-6 sm:px-6 sm:py-10">
    <section className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-5 sm:p-8">
      <Heading level={1} size="xl">Loading employer opportunity...</Heading>
      <GracefulPageLoading label="Loading employer opportunity..." />
    </section>
  </main>;
}
