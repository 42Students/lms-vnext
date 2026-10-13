import { getCurrentRequestContext } from "@/auth/request-context";
import { LectureHallManager } from "@/components/admin/lecture-hall-manager";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listLectureHalls } from "@/modules/academics/lecture-hall-service";
import { listDepartments } from "@/modules/departments/service";

/**
 * Super Admin works within the exact college chosen in the top-bar scope
 * selector. The services and API endpoints separately enforce that scope.
 */
export default async function SuperAdminLectureHallsPage() {
  const context = await getCurrentRequestContext();
  const collegeId = context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Super Admin · Academics"
          title="Lecture halls"
          description="Lecture hall administration requires an exact college safety scope."
        />
        <EmptyState
          title="Select a college scope"
          description="Choose a college in the Super Admin scope selector before viewing or changing lecture halls."
        />
      </div>
    );
  }

  const [halls, departments] = await Promise.all([
    listLectureHalls(context, { collegeId }),
    listDepartments(context, collegeId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin · Academics"
        title="Lecture halls"
        description={`Rooms available for scheduling classes in ${halls.collegeName}. Changes are restricted to this selected college.`}
      />
      <LectureHallManager
        key={collegeId}
        collegeId={collegeId}
        halls={halls.items}
        departments={departments.map((department) => ({
          id: department.id,
          name: department.name,
        }))}
      />
    </div>
  );
}
