import {redirect} from "next/navigation";
import Link from "next/link";
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
  return <div className="min-w-0 overflow-x-clip space-y-6">
    <PageHeader eyebrow="College Admin · Faculty" title="Import faculty"
      description="Validate and register faculty using the legacy CSV template."
      actions={<Link href="/college/faculty"
        className="rounded-[var(--lms-control-radius,9px)] border border-border px-4 py-2 text-sm font-semibold text-[var(--lms-teal-deep)]">Back to Faculty</Link>}/>
    <CollegeFacultyCsvImport/>
  </div>;
}
