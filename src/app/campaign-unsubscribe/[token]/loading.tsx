import authStyles from "@/components/public/public-auth-skin.module.css";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";
const loadingPageClass = `${authStyles["page"]} mx-auto flex min-h-dvh w-full max-w-xl min-w-0 items-center px-4 pb-8 pt-24 md:py-12`;

export default function Loading() {
  return <main className={loadingPageClass}>
    <div className="w-full min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 md:p-6">
      <PageHeader title="Stop these emails?" />
      <GracefulPageLoading label="Opening unsubscribe options…" />
    </div>
  </main>;
}
