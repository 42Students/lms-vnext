import { SuperAdminTemplateSubviewPage } from "@/components/projects/super-admin-template-subview-page";

export default async function SuperAdminTemplateVersionsPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;

  return (
    <SuperAdminTemplateSubviewPage
      templateId={templateId}
      section="versions"
    />
  );
}
