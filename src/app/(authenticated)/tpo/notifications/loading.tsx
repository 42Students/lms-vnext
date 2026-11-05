import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
export default function LoadingTpoNotifications() {
 return <div aria-busy="true" className="min-w-0 space-y-4">
  <PageHeader title="Notifications" description="Loading notifications…"/>
  <div className="rounded-[14px] border border-[var(--lms-canvas-border)] bg-surface p-4 shadow-(--lms-elevation-3)">
   <Skeleton variant="row" label="Loading notifications" count={5}/>
  </div>
 </div>;
}
