import authStyles from "@/components/public/public-auth-skin.module.css";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function Loading() {
 return <main className={`${authStyles.page} mx-auto min-h-dvh w-full max-w-[1000px] px-4 py-12`}>
  <div className="mx-auto mt-12 w-full max-w-[480px] space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-5 md:p-6" role="status" aria-label="Loading shared applicants" aria-busy="true">
   <div className="h-6 w-2/3 animate-pulse rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none"/>
   <GracefulPageLoading label="Loading shared applicants..." shape="directory" />
   {Array.from({length:4},(_,index)=><div key={index} className="h-3 animate-pulse rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none"/>)}
  </div>
 </main>;
}
