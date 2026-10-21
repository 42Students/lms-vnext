import {PageHeader} from "@/components/ui/page-header";

export default function ProjectTemplateDetailLoading(){
 return <div className="min-w-0 space-y-4 md:space-y-6" aria-busy="true">
  <PageHeader title="Project template"
   description="Maintained by 42Students — use this template to start a workspace."/>
  <section aria-label="Loading template information" role="status" className="min-w-0 space-y-3 rounded-[8px] border border-border bg-surface p-4">
   <p className="text-sm text-muted-foreground">Loading project template…</p>
   <div className="h-5 w-40 animate-pulse rounded bg-muted motion-reduce:animate-none"/>
   <div className="h-6 w-72 max-w-full animate-pulse rounded bg-muted motion-reduce:animate-none"/>
   <div className="h-4 w-full max-w-[460px] animate-pulse rounded bg-muted motion-reduce:animate-none"/>
  </section>
  {["Section counts","Overview","Sprints","Tasks","Resources"].map(label=>
   <section key={label} aria-label={"Loading "+label}
    className="min-w-0 space-y-3 rounded-[8px] border border-border bg-surface p-4">
    <h2 className="text-base font-semibold text-[var(--lms-heading)]">{label}</h2>
    <div aria-hidden="true" className="h-5 w-[60%] animate-pulse rounded bg-muted motion-reduce:animate-none"/>
   </section>)}
 </div>;
}
