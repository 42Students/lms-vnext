import {redirect} from "next/navigation";
import {PageBackLink} from "@/components/ui/page-back-link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requirePermission} from "@/modules/permissions/policy";
import {PageHeader} from "@/components/ui/page-header";
import {CollegeFacultyCsvImport} from "@/components/college/college-faculty-csv-import";

export default async function CollegeFacultyImportPage(){
  const context=await getCurrentRequestContext();
  const member=context.membership;
  if(!member)redirect("/dashboard");
  requirePermission(context,"people.manage",{
    collegeId:member.collegeId,organizationId:member.organizationId,
  });
  return <div className="min-w-0 max-w-full space-y-[16px]">
    <PageHeader title="Import faculty"
      description="Validate and register faculty using the legacy CSV template."
      actions={<PageBackLink href="/college/faculty" label="Back to Faculty"/>}/>
    <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <section aria-label="Faculty registration" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
        <CollegeFacultyCsvImport/>
      </section>
      <section aria-label="Registration guidance" className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
        <h2 className="text-base font-semibold text-[var(--lms-heading)]">Before you register faculty</h2>
        <p className="text-sm text-body">Use the CSV template to prepare faculty details. Validate the file before registering. The preview shows valid and invalid rows independently.</p>
        <p className="text-sm text-body">Registrations create college-scoped faculty memberships. Correct failed rows and import again; successful rows are not rolled back.</p>
      </section>
    </div>
  </div>;
}
