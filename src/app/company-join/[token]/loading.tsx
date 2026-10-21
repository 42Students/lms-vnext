import authStyles from "@/components/public/public-auth-skin.module.css";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
export default function Loading() {
  return <main className={`${authStyles.page} mx-auto flex min-h-dvh w-full max-w-xl min-w-0 items-center px-4 pb-8 pt-24 min-[768px]:py-12`}>
    <div className="w-full min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 min-[768px]:p-6">
      <PageHeader title="Loading company invitation..." />
      <Skeleton variant="line" count={4} label="Loading company invitation..." />
    </div>
  </main>;
}
