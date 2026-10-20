import { redirect } from "next/navigation";
import { PageBackLink } from "@/components/ui/page-back-link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { CollegeStudentRegisterForm } from "@/components/college/college-student-register-form";
import { listCollegeStudentImportOptions } from "@/modules/people/college-student-import-options";

export default async function CollegeStudentRegisterPage() {
  const context=await getCurrentRequestContext();
  if(!context.membership)redirect("/dashboard");
  const choices=await listCollegeStudentImportOptions(context);
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Register students"
      description="Register a learner with a program and class, personal details and roll number."
      actions={<PageBackLink href="/college/students" label="Back to students"/>}/>
    <CollegeStudentRegisterForm choices={choices}/>
  </div>;
}
