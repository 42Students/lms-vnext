import { useEffect } from "react";
import { useRouter } from "next/router";
import { Skeleton } from "antd";
import AdminLayout from "@/layouts/AdminLayout";

/**
 * Student Groups is hidden for now (2026-10-04). Generic groups (CRT, clubs, bus routes) had no
 * consumer: nothing read them and students never saw them, so a real college's admin would build
 * lists that did nothing. The page and its components (components/admin/studentGroups) come back
 * when the first feature targets a group (announcements, then TPO drive audiences; see
 * docs/groups/PROJECT-TEAMS.md). Electives and project teams use the same groups backend and are
 * unaffected. Old links land on People.
 */
export default function AdminStudentGroupsHidden() {
  const router = useRouter();
  useEffect(() => {
    if (router.isReady) router.replace("/college-admin/people");
  }, [router, router.isReady]);
  return <div className="ln-module"><Skeleton active paragraph={{ rows: 4 }} /></div>;
}

AdminStudentGroupsHidden.adminLayout = AdminLayout;
