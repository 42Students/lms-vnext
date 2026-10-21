import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function CollegeCourseProgressLoading(){
 return <div className="min-w-0 space-y-5" aria-busy="true">
  <PageHeader title="Course Progress" />
  <section aria-label="Course progress summary loading" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
   {["Courses","Learners","Completions","Progress"].map(label=>
    <div key={label} className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] p-4">
     <span className="sr-only">{label} loading</span>
     <Skeleton variant="line" label={label+" label loading"} width={104} />
     <Skeleton variant="line" label={label+" metric loading"} height={28} width={80} className="mt-3"/>
    </div>)}
  </section>
  <section aria-label="Course progress table loading" className="min-w-0 overflow-x-auto rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)]">
   <table className="w-full min-w-[720px] table-fixed border-collapse" aria-label="Course progress table">
    <thead><tr>{["Student","Course","Class","Completed","Progress","Last activity"].map(label=>
      <th key={label} scope="col" className="border-b border-[var(--lms-canvas-border)] px-3 py-4 text-left text-xs font-semibold text-muted-foreground">{label}</th>)}
    </tr></thead>
    <tbody>{Array.from({length:8},(_,row)=>
     <tr key={row}>{Array.from({length:6},(_,column)=>
      <td key={column} className="border-b border-[var(--lms-canvas-border)] px-3 py-3">
       <Skeleton variant="line" label={`Loading progress row ${row+1} column ${column+1}`} height={14}/>
      </td>)}</tr>)}</tbody>
   </table>
  </section>
 </div>;
}
