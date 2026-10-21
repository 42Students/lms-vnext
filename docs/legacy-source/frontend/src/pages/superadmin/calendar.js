import React from "react";
import { useRouter } from "next/router";
import InterviewCalendarContent from "@/components/InterviewCalendar/InterviewCalendarContent";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

const SuperAdminCalendar = () => {
  const router = useRouter();
  const { selectedCollegeId } = useSuperAdminScope();

  const handleViewApplications = (jobId, job) => {
    if (!jobId) return;
    const collegeIdForUrl = job?.collegeId ?? selectedCollegeId;
    if (!collegeIdForUrl) return;
    const params = `?collegeId=${collegeIdForUrl}`;
    router.push(`/superadmin/jobs/${jobId}/applications${params}`);
  };

  return (
    <div className="ln-module admin-list-page placements-page">
      <SuperAdminGroupShell groupKey="placements">
        <InterviewCalendarContent
          key={selectedCollegeId ?? "none"} // BE-0198: a college switch starts the calendar afresh
          organizationId={selectedCollegeId}
          onViewApplications={handleViewApplications}
          router={router}
          emptyMessage="Select an Organization + College in the header above to view interviews."
          scopeLabel="All companies"
          jobIdIsRouteScope={false}
        />
      </SuperAdminGroupShell>
    </div>
  );
};

export default SuperAdminCalendar;
SuperAdminCalendar.superAdminLayout = SuperAdminLayout;
