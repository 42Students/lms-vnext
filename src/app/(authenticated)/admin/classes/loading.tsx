import {PageHeader} from "@/components/ui/page-header";
/** Legacy Classes & Sections list loading: eight rows and eight columns. */
export default function Loading(){
 return <div className="min-w-0 space-y-6" role="status" aria-busy="true" aria-live="polite">
  <PageHeader title="Classes & Sections" description="Loading classes and sections…"/>
  <section className="min-w-0 space-y-3" aria-label="Existing Classes/Sections loading">
   <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Existing Classes/Sections</h2>
   <p className="sr-only">Loading eight rows of classes and sections</p>
   <div className="min-w-0 overflow-x-auto rounded-[var(--lms-canvas-radius)] border border-border bg-surface">
    <div className="min-w-[760px]" aria-hidden="true">
     {Array.from({length:9},(_,row)=><div key={row}
       className="grid grid-cols-8 gap-3 border-b border-border px-4 py-3 last:border-b-0">
       {Array.from({length:8},(_,col)=><span key={col}
         className={"h-4 rounded bg-muted motion-safe:animate-pulse "+(row===0?"opacity-70":"")}/>)}
      </div>)}
    </div>
   </div>
  </section>
 </div>;
}
