import { AdminProjectSectionPage } from "@/components/projects/admin-project-section-page";
import Link from "next/link";
import {notFound} from "next/navigation";
import {z} from "zod";

export default async function SuperAdminProjectSectionRoute({
  params,
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  params: Promise<{
    projectId: string;
    section: string;
  }>;
}) {
  const { projectId, section } = await params;
  // The old /superadmin/projects/workspaces/:workspaceId/:section path is
  // mapped to this canonical /admin/projects/:projectId/:section route by
  // resolving its authorized workspace UUID first. Numeric old IDs cannot
  // serve as membership-scoped project UUIDs without a verified crosswalk.
  if(!z.uuid().safeParse(projectId).success)notFound();
  const query = await searchParams;
  // Preserve only validated old workspace navigation context. The selected
  // college derives from authorized admin scope, never from a query override.
  const one = (value: string | string[] | undefined) =>
    typeof value==="string" && value.length<=120 && /^[a-zA-Z0-9 _-]*$/.test(value)
      ? value : undefined;
  return (
    <div className="min-w-0 max-w-full space-y-3">
    <nav aria-label="Project workspace breadcrumbs" className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Link href="/admin/projects" className="font-semibold text-link underline">Projects</Link>
      <span aria-hidden="true">/</span>
      <Link href={"/admin/projects/"+encodeURIComponent(projectId)} className="font-semibold text-link underline">Workspace</Link>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{section==="tasks"?"Tasks":section==="delivery"?"Delivery":section}</span>
    </nav>
    <AdminProjectSectionPage
      projectId={projectId}
      section={section}
      basePath="/admin/projects"
      from={one(query.from)}
      reason={one(query.reason)}
      polishAdminSection
    />
    </div>
  );
}
