import {PageHeader} from "@/components/ui/page-header";
import { Table } from "@/components/ui/table";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";
import { SkeletonBlock } from "@/components/ui/skeleton-block";

/** Six legacy-width table placeholders distinguish pending reads from empty success. */
export default function DeletedWorkspacesLoading(){
 return <div className="min-w-0 space-y-4 md:space-y-6" aria-busy="true">
  <PageHeader title="Deleted workspaces" description="Deleted workspaces you can still restore."
   actions={<ButtonLink variant="secondary" href="/college/projects">
    Back to workspaces
   </ButtonLink>}/>
  <section aria-label="Deleted workspaces loading" role="status" className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
   <Heading level={2} size="base" className="text-[var(--lms-heading)]">Deleted workspaces</Heading>
   <p className="text-sm text-muted-foreground">Loading deleted workspaces…</p>
   <div className="min-w-0 overflow-x-auto">
    <Table className="min-w-[632px]">
     <caption className="sr-only">Loading the deleted workspaces table</caption>
     <thead><tr className="border-b border-border"><th className="py-3">Workspace</th><th>Mentor</th><th>Action</th></tr></thead>
     <tbody>{Array.from({length:6},(_,index)=><tr key={index} className="border-b border-border">
      <td className="py-4"><SkeletonBlock className="block h-4 w-48" /></td>
      <td><SkeletonBlock className="block h-4 w-32" /></td>
      <td><SkeletonBlock className="block h-8 w-24" /></td>
     </tr>)}</tbody>
    </Table>
   </div>
  </section>
 </div>;
}
