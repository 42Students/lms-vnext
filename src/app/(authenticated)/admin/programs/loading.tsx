import {GracefulPageLoading} from "@/components/ui/graceful-page-loading";
export default function Loading(){
 return <section role="status" aria-busy="true" className="min-w-0 space-y-4">
   <h1 className="text-2xl font-semibold text-[var(--lms-heading)]">Programs</h1>
   <GracefulPageLoading label="Loading programs…" shape="directory" />
   <div aria-hidden="true" className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,10fr)_minmax(0,14fr)]">
     <div className="space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
       <div className="h-6 w-2/3 animate-pulse rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none"/>
       {Array.from({length:4},(_,i)=><div key={i} className="h-11 animate-pulse rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none"/>)}
     </div>
     <div className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
       <div className="h-6 w-1/2 animate-pulse rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none"/>
       {Array.from({length:7},(_,i)=><div key={i} className="grid grid-cols-4 gap-2">
         {Array.from({length:4},(_,j)=><div key={j} className="h-5 animate-pulse rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none"/>)}
       </div>)}
     </div>
   </div>
 </section>;
}
