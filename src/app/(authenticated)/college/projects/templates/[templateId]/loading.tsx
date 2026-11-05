import {PageHeader} from "@/components/ui/page-header";
import { Heading } from "@/components/ui/heading";
import { SkeletonBlock } from "@/components/ui/skeleton-block";

export default function ProjectTemplateDetailLoading(){
 return <div className="min-w-0 space-y-4 md:space-y-6" aria-busy="true">
  <PageHeader title="Project template"
   description="Maintained by 42Students — use this template to start a workspace."/>
  <section aria-label="Loading template information" role="status" className="min-w-0 space-y-3 rounded-[8px] border border-border bg-surface p-4">
   <p className="text-sm text-muted-foreground">Loading project template…</p>
   <SkeletonBlock className="h-5 w-40" />
   <SkeletonBlock className="h-6 w-72 max-w-full" />
   <SkeletonBlock className="h-4 w-full max-w-[460px]" />
  </section>
  {["Section counts","Overview","Sprints","Tasks","Resources"].map(label=>
   <section key={label} aria-label={"Loading "+label}
    className="min-w-0 space-y-3 rounded-[8px] border border-border bg-surface p-4">
    <Heading level={2} size="base" className="text-[var(--lms-heading)]">{label}</Heading>
    <SkeletonBlock className="h-5 w-[60%]" />
   </section>)}
 </div>;
}
