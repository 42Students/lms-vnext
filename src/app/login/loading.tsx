import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

/** GR-19: loading is bounded by a visible recovery action. */
export default function Loading() {
  return <main className="mx-auto flex min-h-dvh w-full max-w-xl min-w-0 items-center px-4 py-8 sm:py-12">
    <div className="w-full"><GracefulPageLoading /></div>
  </main>;
}
