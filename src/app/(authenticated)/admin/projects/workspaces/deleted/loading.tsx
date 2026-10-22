import {ProjectAdminNav} from "@/components/projects/project-admin-nav";
import {PageHeader} from "@/components/ui/page-header";
import {Skeleton} from "@/components/ui/skeleton";

/** Match the deleted-workspace table's loading silhouette without showing
 * synthetic restoration actions while the scoped list is pending. */
export default function Loading(){
 return <div role="status" aria-live="polite" aria-busy="true"
   aria-label="Loading deleted workspaces" className="min-w-0 space-y-4 md:space-y-6">
  <ProjectAdminNav basePath="/admin/projects" active="workspaces"/>
  <PageHeader title="Deleted workspaces" description="Deleted workspaces you can still restore."/>
  <section className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
   <h2 className="text-base font-semibold text-[var(--lms-heading)]">Deleted workspaces</h2>
   <Skeleton label="Loading deleted workspaces" variant="row" count={6}/>
  </section>
 </div>;
}
