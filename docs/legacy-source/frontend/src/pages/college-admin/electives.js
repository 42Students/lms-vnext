import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Result } from "antd";
import AdminLayout from "@/layouts/AdminLayout";
import AdminGroupShell from "@/components/admin/AdminGroupShell";
import ElectivesConsole from "@/components/admin/electives/ElectivesConsole";
import useCollegeFeatureFlags from "@/utils/useCollegeFeatureFlags";
import { moduleOffRecoveryHint } from "@/components/admin/ModuleGroupGuard";
import { appAction } from "@/redux/store";

/** Electives: slots → offerings → allocation. See docs/groups/ELECTIVES.md. */
export default function AdminElectives() {
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);
  const collegeId = loginUser?.collegeId ?? null;
  const { modules } = useCollegeFeatureFlags();

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("electives"));
  }, [dispatch]);

  if (collegeId == null) {
    return (
      <div className="ln-module">
        <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="Admin not assigned to a college"
          description="You must be assigned to a college to manage electives. Contact your administrator." />
      </div>
    );
  }
  return (
    <div className="ln-module">
      <AdminGroupShell groupKey="academic">
        {modules?.electives === false
          ? <Result status="info" title="Electives is turned off for this college"
            subTitle={`Elective slots and student allocation are unavailable. ${moduleOffRecoveryHint(loginUser)}`} />
          : <ElectivesConsole collegeId={collegeId} />}
      </AdminGroupShell>
    </div>
  );
}

AdminElectives.adminLayout = AdminLayout;
