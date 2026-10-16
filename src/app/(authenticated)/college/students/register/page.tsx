import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { CollegeStudentRegisterForm } from "@/components/college/college-student-register-form";
import { listCollegeStudentImportOptions } from "@/modules/people/college-student-import-options";

export default async function CollegeStudentRegisterPage() {
  const context=await getCurrentRequestContext();
  if(!context.membership)redirect("/dashboard");
  const choices=await listCollegeStudentImportOptions(context);
  return <div className="space-y-6">
    <PageHeader eyebrow="College Admin · Students" title="Register students"
      description="Register a learner with a program and class, personal details and roll number."
      actions={<Link href="/college/students"
        className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">Back to students</Link>}/>
    <CollegeStudentRegisterForm choices={choices}/>
  </div>;
}
