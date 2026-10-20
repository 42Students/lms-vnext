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
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader title="Import faculty"
      description="Validate and register faculty using the legacy CSV template."
      actions={<PageBackLink href="/college/faculty" label="Back to Faculty"/>}/>
    <CollegeFacultyCsvImport/>
  </div>;
}
