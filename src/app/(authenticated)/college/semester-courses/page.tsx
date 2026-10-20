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
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Semester–Course Mapping"
      actions={<Link href="/college/courses"
        className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-4 text-[14px] font-semibold text-[var(--lms-primary-text)] transition-[background-color,border-color] duration-[150ms] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9 motion-reduce:transition-none">
        Course offerings
      </Link>} />
    <CollegeTermMappingManager data={curriculumData} />
  </div>;
}
