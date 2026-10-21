import { useEffect } from "react";
import { useRouter } from "next/router";

import AdminLayout from "@/layouts/AdminLayout";
import { PageSkeleton } from "@/components/Common/Skeletons";
import { groupDefaultPath } from "@/common/adminNavGroups";

/**
 * /college-admin/projects has no page of its own — the group's landing screen is its first tab.
 * Removing the old dashboard left this URL 404ing, and it is the one people reach by trimming the
 * address bar or following an older link.
 *
 * Resolved from the nav config, not hardcoded: college-admin lands on Workspaces (running this
 * college's live projects) where superadmin lands on Templates, and that difference is deliberate,
 * so the redirect reads the same source the tab strip does rather than duplicating the choice.
 */
export default function AdminProjectsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    router.replace(`/college-admin/${groupDefaultPath("projects")}`);
  }, [router, router.isReady]);

  return (
    <div className="ln-module admin-list-page">
      <PageSkeleton label="Opening projects" />
    </div>
  );
}

AdminProjectsIndexPage.adminLayout = AdminLayout;
