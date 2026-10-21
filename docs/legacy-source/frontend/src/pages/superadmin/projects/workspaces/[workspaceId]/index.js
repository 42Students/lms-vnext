import { useEffect } from "react";
import { useRouter } from "next/router";
import { Skeleton } from "antd";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";

/**
 * The bare workspace URL has no content of its own any more — the old single detail page was
 * split into the nine section pages under this directory. Anything still linking to
 * /superadmin/projects/workspaces/{id} (a bookmark, an older email, the deep link the workspaces
 * list uses for "No template — attach one") lands here and is forwarded to Summary, query string
 * intact so those deep links keep working.
 */
export default function SuperAdminWorkspaceIndexPage() {
  const router = useRouter();
  const { workspaceId, ...rest } = router.query;

  useEffect(() => {
    if (!router.isReady || !workspaceId) return;
    router.replace({
      pathname: `/superadmin/projects/workspaces/${encodeURIComponent(workspaceId)}/summary`,
      query: rest,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, workspaceId]);

  return (
    <div className="ln-module admin-list-page">
      <Skeleton active paragraph={{ rows: 6 }} />
    </div>
  );
}

SuperAdminWorkspaceIndexPage.superAdminLayout = SuperAdminLayout;
