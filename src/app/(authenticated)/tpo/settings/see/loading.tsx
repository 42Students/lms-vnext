import {Skeleton} from "@/components/ui/skeleton";

/** The old SeeTab shows the three toggle rows inside a loading Card.
 * Keep its geometry instead of replacing the settings with a full-page spinner. */
export default function TpoWhatCompaniesSeeLoading(){
 return <div role="status" aria-live="polite" aria-busy="true"
   className="min-w-0 space-y-5">
  <span className="sr-only">Loading company visibility settings</span>
  <div aria-hidden="true" className="space-y-2 border-b border-border pb-4">
   <Skeleton label="Loading company visibility settings" variant="line" width={240} height={26}/>
   <Skeleton label="Loading company visibility settings" variant="line" width={320} height={18}/>
  </div>
  <div aria-hidden="true" className="flex gap-3 border-b border-border pb-3">
   {Array.from({length:4},(_,index)=><span key={index}
     className="lms-skeleton-shimmer h-9 w-24 rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]"/>)}
  </div>
  <section aria-hidden="true" className="max-w-[920px] space-y-5 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 md:p-6">
   <Skeleton label="Loading company visibility settings" variant="line" width={220} height={20}/>
   {Array.from({length:3},(_,index)=><div key={index}
     className="flex min-h-11 items-center justify-between gap-4 border-b border-border pb-3">
    <span className="lms-skeleton-shimmer h-4 w-[min(78%,420px)] rounded bg-[var(--lms-neutral-100)]"/>
    <span className="lms-skeleton-shimmer h-6 w-11 shrink-0 rounded-full bg-[var(--lms-neutral-100)]"/>
   </div>)}
   <span className="lms-skeleton-shimmer block h-9 w-24 rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]"/>
  </section>
 </div>;
}
