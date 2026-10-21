import { useRouter } from "next/router";
import { Button, Space } from "antd";
import PageShell from "@/components/Common/PageShell";
import { buildEntitySectionTabs } from "@/components/admin/entitySectionTabs";
import AdminWorkspaceBreadcrumb from "@/components/admin/AdminWorkspaceBreadcrumb";
import { SUPER_ADMIN_WORKSPACE_SECTIONS } from "@/common/superAdminNavGroups";
import { resolveWorkspaceBackTarget } from "@/components/admin/workspaceBackTarget";

/** Superadmin workspace detail is not gated by a college's module availability. */
export default function SuperAdminWorkspaceShell({ workspaceId, title, subtitle, actions, children }) {
  const router = useRouter();
  const pathname = router.pathname || "";
  const back = resolveWorkspaceBackTarget("/superadmin", router.query?.from);
  const tabs = buildEntitySectionTabs({
    sections: SUPER_ADMIN_WORKSPACE_SECTIONS,
    basePath: "/superadmin/projects/workspaces",
    entityId: workspaceId,
    pathname,
    query: router.query,
    routePattern: "/superadmin/projects/workspaces/[workspaceId]",
  });
  const activeSection = tabs.find((tab) => tab.active)?.label;
  return (
    <PageShell title={title || "Workspace"} subtitle={subtitle} tabs={tabs} tabsAriaLabel="Workspace sections"
      actions={<Space wrap><Button onClick={() => router.push(back.href)}>{back.label}</Button>{actions}</Space>}>
      <AdminWorkspaceBreadcrumb basePath="/superadmin" workspaceId={workspaceId} workspaceName={title} activeSection={activeSection} />
      {children}
    </PageShell>
  );
}
