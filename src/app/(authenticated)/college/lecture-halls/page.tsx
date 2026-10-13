import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LectureHallManager } from "@/components/admin/lecture-hall-manager";
import { PageHeader } from "@/components/ui/page-header";
import { listLectureHalls } from "@/modules/academics/lecture-hall-service";
import { listDepartments } from "@/modules/departments/service";

export default async function CollegeLectureHallsPage() {
  const context = await getCurrentRequestContext();
  const membership = context.membership;
  if (!membership) redirect("/dashboard");

  const [halls, departments] = await Promise.all([
    listLectureHalls(context, { collegeId: membership.collegeId }),
    listDepartments(context, membership.collegeId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin"
        title="Lecture halls"
        description={`Rooms available for scheduling classes in ${halls.collegeName}.`}
      />
      <LectureHallManager
        collegeId={membership.collegeId}
        halls={halls.items}
        departments={departments.map((d) => ({ id: d.id, name: d.name }))}
      />
    </div>
  );
}
