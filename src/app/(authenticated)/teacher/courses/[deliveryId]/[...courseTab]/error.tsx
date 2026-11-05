"use client";
import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

/** Distinguish role/access failure from an ordinary course tab load failure.
 * Unknown server digests are not interpreted as a proved permission denial. */
export default function FacultyCourseTabError({error,reset}: {
  error: Error & {digest?:string};
  reset: () => void;
}) {
  const pathname=usePathname();
  const accessDenied=["FORBIDDEN","FACULTY_ACCESS_DENIED","FACULTY_TEACHING_SCOPE_REQUIRED"]
    .includes(error.message);
  const roster=pathname.endsWith("/students");
  const syllabus=pathname.endsWith("/syllabus") || pathname.endsWith("/lessons");
  const title=accessDenied?"Faculty access required":
    roster?"Could not load class roster":
    syllabus?"Could not load syllabus":"Could not load teacher course context";
  const description=accessDenied?"Sign in with a Faculty account to open this course.":
    roster?"We couldn't load the class roster. Check your connection and try again.":
    syllabus?"Some course state could not be loaded. Please retry the syllabus.":
    "Please retry. If this continues, your course assignment may be missing or unavailable.";
  return <section role="alert" className="min-w-0 space-y-4">
    <PageHeader title={title} />
    <p className="max-w-xl text-sm leading-6 text-body">{description}</p>
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      {!accessDenied?<Button onClick={reset}>Try again</Button>:null}
      <ButtonLink variant="secondary" href="/teacher/courses">
        Back to courses
      </ButtonLink>
    </div>
  </section>;
}
