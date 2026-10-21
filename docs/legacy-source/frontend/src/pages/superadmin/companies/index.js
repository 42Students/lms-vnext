import { Tabs } from "antd";
import Companies from "../sections/Companies";
import CompanyCuration from "../sections/CompanyCuration";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

/**
 * Companies (recruiter phase 1): 42's company list is global; with a college selected in the header, that college's own list
 * (its notes and contacts) sits beside it.
 */
export default function SuperAdminCompanies() {
  const { selectedCollegeId } = useSuperAdminScope();
  const items = [{ key: "all", label: "42's company list", children: <CompanyCuration /> }];
  if (selectedCollegeId != null) {
    items.push({ key: "college", label: "This college's companies", children: <Companies collegeId={selectedCollegeId} key={selectedCollegeId} /> });
  }
  return (
    <div className="ln-module admin-list-page placements-page">
      <SuperAdminGroupShell groupKey="placements">
        <Tabs items={items} defaultActiveKey={selectedCollegeId != null ? "college" : "all"} key={selectedCollegeId ?? "none"} />
      </SuperAdminGroupShell>
    </div>
  );
}

SuperAdminCompanies.superAdminLayout = SuperAdminLayout;
