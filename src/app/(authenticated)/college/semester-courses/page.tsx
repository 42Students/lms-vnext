import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { CollegeTermMappingManager } from "@/components/academics/college-term-mapping-manager";
import { listCollegeTermMappings } from "@/modules/academics/college-term-mapping-service";

export default async function CollegeSemesterCoursesPage() {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const curriculumData = await listCollegeTermMappings(context);
  return <main className="min-w-0 space-y-6">
    <PageHeader title="Semester–Course Mapping"
      actions={<Link href="/college/courses"
        className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
        Course offerings
      </Link>} />
    <CollegeTermMappingManager data={curriculumData} />
  </main>;
}
