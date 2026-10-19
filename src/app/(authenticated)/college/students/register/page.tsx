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
  return <main className="min-w-0 space-y-6">
    <PageHeader eyebrow="College Admin · Students" title="Register students"
      description="Register a learner with a program and class, personal details and roll number."
      actions={<Link href="/college/students"
        className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Back to students</Link>}/>
    <CollegeStudentRegisterForm choices={choices}/>
  </main>;
}
