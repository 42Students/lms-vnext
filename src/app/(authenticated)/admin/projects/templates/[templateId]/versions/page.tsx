import Link from "next/link";
import {z} from "zod";
import {notFound} from "next/navigation";
import {PageHeader} from "@/components/ui/page-header";
import {Banner} from "@/components/ui/banner";
import { SuperAdminTemplateSubviewPage } from "@/components/projects/super-admin-template-subview-page";
import {canonicalTemplateVersionHistoryPage} from "@/modules/projects/template-version-history-model";

export default async function SuperAdminTemplateVersionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { templateId } = await params;
  // Numeric legacy template IDs cannot safely be treated as canonical UUIDs
  // without the original college-scoped ID crosswalk (not migrated to vNext).
  // Route the administrator to the authorized template list for reselection.
  if(/^[0-9]+$/.test(templateId))return <section className="min-w-0 space-y-4">
   <PageHeader title="Template version history"/>
   <Banner tone="warning" role="alert">
     This legacy template link uses a numeric ID. Select the corresponding
     template from the current college; version history requires its UUID.
   </Banner>
   <Link href="/admin/projects/templates" className="inline-flex min-h-11 items-center font-semibold text-link underline">
     Browse templates
   </Link>
  </section>;
  if(!z.uuid().safeParse(templateId).success)notFound();
  const query=await searchParams;

  return (
    <div className="min-w-0 space-y-3">
     <nav aria-label="Template history breadcrumbs" className="text-sm">
      <Link href="/admin/projects/templates" className="font-semibold text-link underline">Project templates</Link>
      <span aria-hidden="true"> / </span><span aria-current="page">Version history</span>
     </nav>
    <SuperAdminTemplateSubviewPage
      templateId={templateId}
      section="versions"
      historyQuery={{page:canonicalTemplateVersionHistoryPage(query)}}
    />
    </div>
  );
}
