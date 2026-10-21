import {PageHeader} from "@/components/ui/page-header";
import {Skeleton} from "@/components/ui/skeleton";

/** Legacy company directory: initial table skeleton rather than blocking the shell. */
export default function CompaniesLoading(){
 return <section className="min-w-0 space-y-[var(--lms-space-4)]" aria-busy="true">
  <PageHeader title="Companies" description="Company directory"/>
  <p role="status" aria-live="polite" className="text-sm text-body">Loading companies…</p>
  <div className="min-w-0 overflow-x-auto border-y border-border">
   <div className="min-w-[760px] space-y-[var(--lms-space-3)] py-4" aria-hidden="true">
    <div className="grid grid-cols-6 gap-3 text-xs font-semibold text-muted-foreground">
     {["Company","Industry","Drives","Last active","Status","Actions"].map(label=>
      <span key={label}>{label}</span>)}
    </div>
    <Skeleton variant="row" count={8} label="Loading companies"/>
   </div>
  </div>
 </section>;
}
