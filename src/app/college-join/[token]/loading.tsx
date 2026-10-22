import authStyles from "@/components/public/public-auth-skin.module.css";
import { PageHeader } from "@/components/ui/page-header";

/** The legacy invitation renders four paragraph skeleton rows before preview. */
export default function Loading(){
 return <main className={authStyles["page"]}>
  <div className="mx-auto flex min-h-dvh w-full max-w-xl min-w-0 items-center px-4 pb-8 pt-24 min-[768px]:py-12">
  <section className="w-full min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 min-[768px]:p-6"
   role="status" aria-label="Loading college invitation" aria-busy="true">
   <PageHeader title="Loading college invitation..."/>
   <div className="space-y-3" aria-hidden="true">
    {Array.from({length:4},(_,index)=><div key={index}
      className={index===3
        ?"h-4 w-3/5 animate-pulse rounded bg-muted"
        :"h-4 w-full animate-pulse rounded bg-muted"}/>)}
   </div>
   <p className="sr-only">Loading college invitation</p>
  </section>
  </div>
 </main>;
}
