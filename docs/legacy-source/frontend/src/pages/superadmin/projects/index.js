import { useEffect } from "react";
import { useRouter } from "next/router";
import { Skeleton } from "antd";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import { superAdminGroupDefaultPath } from "@/common/superAdminNavGroups";

/**
 * /superadmin/projects has no page of its own — the group's landing screen is its first tab. The
 * old dashboard that lived here was removed when the module was split into one-job-per-page tabs,
 * which left the bare group URL 404ing even though the sidebar row, breadcrumbs and plenty of
 * older links still point at it.
 *
 * The destination comes from the nav config rather than being hardcoded, so if superadmin's first
 * Projects tab ever changes (it is Templates today, because authoring the catalog is this role's
 * job) this redirect follows it instead of quietly sending people to the wrong tab.
 */
export default function SuperAdminProjectsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    router.replace(`/superadmin/${superAdminGroupDefaultPath("projects")}`);
  }, [router, router.isReady]);

  return (
    <div className="ln-module admin-list-page">
      <Skeleton active paragraph={{ rows: 6 }} />
    </div>
  );
}

SuperAdminProjectsIndexPage.superAdminLayout = SuperAdminLayout;
