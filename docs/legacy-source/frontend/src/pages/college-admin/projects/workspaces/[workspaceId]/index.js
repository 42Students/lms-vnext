import { useEffect } from "react";
import { useRouter } from "next/router";
import { Skeleton } from "antd";
import AdminLayout from "@/layouts/AdminLayout";

/**
 * A workspace has no single "detail" screen any more — it is nine section pages. This exists only
 * so every existing deep link to /college-admin/projects/workspaces/{id} (the workspaces list, the
 * at-risk and submissions tables, the create/attach redirects) still lands somewhere, on Summary.
 *
 * The query string is carried across deliberately: `?openTemplate=1` (Workspaces' "No template —
 * attach one") and `?reason=...` (At-risk / Submissions context) are both read on the Summary page,
 * and dropping them here would silently break those links rather than merely relocate them.
 */
export default function AdminProjectWorkspaceIndexPage() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const { workspaceId, ...rest } = router.query;
    if (!workspaceId) return;
    router.replace({
      pathname: `/college-admin/projects/workspaces/${encodeURIComponent(workspaceId)}/summary`,
      query: rest,
    });
  }, [router.isReady, router.query, router]);

  return (
    <div className="ln-module admin-list-page">
      <Skeleton active paragraph={{ rows: 6 }} />
    </div>
  );
}

AdminProjectWorkspaceIndexPage.adminLayout = AdminLayout;
