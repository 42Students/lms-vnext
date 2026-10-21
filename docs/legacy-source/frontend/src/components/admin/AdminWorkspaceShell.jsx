import { useRouter } from "next/router";
import { Button, Space } from "antd";
import PageShell from "@/components/Common/PageShell";
import { buildEntitySectionTabs } from "@/components/admin/entitySectionTabs";
import AdminWorkspaceBreadcrumb from "@/components/admin/AdminWorkspaceBreadcrumb";
import ModuleGroupGuard from "@/components/admin/ModuleGroupGuard";
import { ADMIN_WORKSPACE_SECTIONS } from "@/common/adminNavGroups";
import { resolveWorkspaceBackTarget } from "@/components/admin/workspaceBackTarget";

/** Workspace detail uses a single tab strip and a contextual breadcrumb. */
export default function AdminWorkspaceShell({ workspaceId, title, subtitle, actions, children }) {
  const router = useRouter();
  const pathname = router.pathname || "";
  const back = resolveWorkspaceBackTarget("/college-admin", router.query?.from);
  const tabs = buildEntitySectionTabs({
    sections: ADMIN_WORKSPACE_SECTIONS,
    basePath: "/college-admin/projects/workspaces",
    entityId: workspaceId,
    pathname,
    query: router.query,
    routePattern: "/college-admin/projects/workspaces/[workspaceId]",
  });
  const activeSection = tabs.find((tab) => tab.active)?.label;
  return (
    <PageShell title={title || "Workspace"} subtitle={subtitle} tabs={tabs} tabsAriaLabel="Workspace sections"
      actions={<Space wrap><Button onClick={() => router.push(back.href)}>{back.label}</Button>{actions}</Space>}>
      <ModuleGroupGuard groupKey="projects">
        <AdminWorkspaceBreadcrumb basePath="/college-admin" workspaceId={workspaceId} workspaceName={title} activeSection={activeSection} />
        {children}
      </ModuleGroupGuard>
    </PageShell>
  );
}
