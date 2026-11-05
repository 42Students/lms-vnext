import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/modules/identity/context";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AcademicsOverview } from "@/components/academics/academics-overview";
import { PageHeader } from "@/components/ui/page-header";
import { Dropdown } from "@/components/ui/dropdown";
import { getAcademicsWorkspace } from "@/modules/academics/workspace";
import { ButtonLink } from "@/components/ui/button-link";

/** Keep the directory as the single headline action; related destinations remain one tap away. */
function AcademicPageActions({ scoped }: { scoped: boolean }) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-[var(--lms-space-2)] sm:flex-row sm:items-center md:w-auto">
      {scoped ? (
        <ButtonLink variant="secondary" href="/admin/programs" className="w-full md:w-auto">
          Open Programs directory
        </ButtonLink>
      ) : null}
      <Dropdown trigger="More" label="More academic actions" align="end" mobileSheet
        className="w-full sm:w-auto" triggerClassName="w-full justify-center sm:w-auto md:min-h-9!">
        <nav aria-label="Related academic pages" className="grid min-w-0 gap-[var(--lms-space-1)]">
          <ButtonLink variant="secondary" href="/admin/electives" className="w-full">
            {scoped ? "Elective slots" : "Elective slots →"}
          </ButtonLink>
          <ButtonLink variant="secondary" href="/admin/batch-promotion" className="w-full">
            Batch Promotion Preview →
          </ButtonLink>
        </nav>
      </Dropdown>
    </div>
  );
}

export default async function SuperAdminAcademicsPage() {
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context)) redirect("/dashboard");
  const collegeId = context.adminScope?.collegeId ?? null;

  // The unscoped platform landing is the global tenant directory, not a
  // blocked college academic workspace. College-scoped setup remains here.
  if (!collegeId) redirect("/superadmin/dashboard");

  const workspace = await getAcademicsWorkspace(context, collegeId);

  return (
    <div className="min-w-0 space-y-[var(--lms-space-6)]">
      <PageHeader title="Academic Setup"
        description="Academic structure inside the selected college safety scope."
        actions={<AcademicPageActions scoped />}
      />
      <AcademicsOverview
        collegeId={collegeId}
        workspace={workspace}
        sectionBasePath="/admin/academics/sections"
      />
    </div>
  );
}
