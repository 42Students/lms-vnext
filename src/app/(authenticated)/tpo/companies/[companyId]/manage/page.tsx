import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import { TpoCompanyLifecycleEditor } from "@/components/placements/tpo-company-lifecycle-editor";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { getTpoCompanyLifecycle } from "@/modules/placements/tpo-company-lifecycle-service";

export default async function TpoManageCompanyPage({
  params,
}: { params: Promise<{ companyId: string }> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  await requireTpoBatchActor(context);
  const { companyId } = await params;
  const company = await getTpoCompanyLifecycle(context, companyId);
  if (!company) notFound();
  return <div className="space-y-5">
    <Link href={"/tpo/companies/" + encodeURIComponent(companyId)}
      className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
      ← Company details
    </Link>
    <PageHeader eyebrow="TPO · Companies" title={company.name + " · Relationship settings"}
      description="Change this college's trusted state or archive/restore its employer relationship with audit history." />
    <TpoCompanyLifecycleEditor company={{
      companyId, name: company.name, status: company.status,
      isTrusted: company.isTrusted, updatedAt: company.updatedAt,
    }} />
  </div>;
}
