import { redirect } from "next/navigation";
import { PageBackLink } from "@/components/ui/page-back-link";
import { ButtonLink } from "@/components/ui/button-link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { CollegeStudentRegisterForm } from "@/components/college/college-student-register-form";
import { listCollegeStudentImportOptions } from "@/modules/people/college-student-import-options";

export default async function CollegeStudentRegisterPage() {
  const context=await getCurrentRequestContext();
  if(!context.membership)redirect("/dashboard");
  const choices=await listCollegeStudentImportOptions(context);
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader title="Register students"
      description="Register a learner with a program and class, personal details and roll number."
      actions={<div className="flex min-w-0 flex-wrap gap-2"><PageBackLink href="/college/students" label="Back to students"/><ButtonLink variant="secondary" href="/college/students/import" className="w-full sm:w-auto">Import a CSV instead</ButtonLink></div>}/>
    <CollegeStudentRegisterForm choices={choices}/>
  </div>;
}
