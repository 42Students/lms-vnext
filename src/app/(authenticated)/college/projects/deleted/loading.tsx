import Link from "next/link";
import {PageHeader} from "@/components/ui/page-header";

/** Six legacy-width table placeholders distinguish pending reads from empty success. */
export default function DeletedWorkspacesLoading(){
 return <div className="min-w-0 space-y-4 md:space-y-6" aria-busy="true">
  <PageHeader title="Deleted workspaces" description="Deleted workspaces you can still restore."
   actions={<Link href="/college/projects" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text md:min-h-9">
    Back to workspaces
   </Link>}/>
  <section aria-label="Deleted workspaces loading" role="status" className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
   <h2 className="text-base font-semibold text-[var(--lms-heading)]">Deleted workspaces</h2>
   <p className="text-sm text-muted-foreground">Loading deleted workspaces…</p>
   <div className="min-w-0 overflow-x-auto">
    <table className="w-full min-w-[630px] text-left text-sm">
     <caption className="sr-only">Loading the deleted workspaces table</caption>
     <thead><tr className="border-b border-border"><th className="py-3">Workspace</th><th>Mentor</th><th>Action</th></tr></thead>
     <tbody>{Array.from({length:6},(_,index)=><tr key={index} className="border-b border-border">
      <td className="py-4"><span aria-hidden="true" className="block h-4 w-48 animate-pulse rounded bg-muted motion-reduce:animate-none"/></td>
      <td><span aria-hidden="true" className="block h-4 w-32 animate-pulse rounded bg-muted motion-reduce:animate-none"/></td>
      <td><span aria-hidden="true" className="block h-8 w-24 animate-pulse rounded bg-muted motion-reduce:animate-none"/></td>
     </tr>)}</tbody>
    </table>
   </div>
  </section>
 </div>;
}
