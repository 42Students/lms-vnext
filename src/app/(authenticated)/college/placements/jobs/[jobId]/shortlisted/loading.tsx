import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

/** Legacy Shortlisted loads ten rows with eight columns. */
export default function Loading(){
 return <div className="min-w-0 space-y-5" aria-busy="true">
  <PageHeader title="Shortlisted applicants" />
  <section aria-label="Shortlisted applicants table loading" className="min-w-0 overflow-x-auto rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)]">
   <table className="w-full min-w-[960px] table-fixed border-collapse" aria-label="Shortlisted applicants">
    <thead><tr>{["Student","Registration","Department","Class","Screening","Stage","Applied","Actions"].map(label=>
     <th key={label} scope="col" className="border-b border-[var(--lms-canvas-border)] px-3 py-4 text-left text-xs font-semibold text-muted-foreground">{label}</th>)}</tr></thead>
    <tbody>{Array.from({length:10},(_,i)=><tr key={i}>
     {Array.from({length:8},(_,j)=><td key={j} className="border-b border-[var(--lms-canvas-border)] px-3 py-3">
      <Skeleton label={`Loading applicant ${i+1}, column ${j+1}`} variant="line" height={14}/>
     </td>)}
    </tr>)}</tbody>
   </table>
  </section>
 </div>;
}
