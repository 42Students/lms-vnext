"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
export default function FacultyAttendanceError({reset}:{error:Error&{digest?:string};reset:()=>void;}){
 return <section role="alert" className="min-w-0 space-y-4">
  <PageHeader title="Couldn't load attendance" />
  <p className="max-w-xl text-sm leading-6 text-body">Attendance data failed to load. This is not the same as an empty month or an unmarked class.</p>
  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
   <Button onClick={reset}>Retry</Button>
   <ButtonLink variant="secondary" href="/teacher/courses">Back to courses</ButtonLink>
  </div>
 </section>;
}
