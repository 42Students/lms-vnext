import { SuperAdminTemplateSubviewPage } from "@/components/projects/super-admin-template-subview-page";

export default async function SuperAdminTemplateVersionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { templateId } = await params;

  return (
    <SuperAdminTemplateSubviewPage
      templateId={templateId}
      section="versions"
      historyQuery={{ page: (await searchParams).page }}
    />
  );
}
