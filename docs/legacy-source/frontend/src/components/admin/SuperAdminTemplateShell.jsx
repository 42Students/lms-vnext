import { useRouter } from "next/router";
import { Button, Space } from "antd";
import PageShell from "@/components/Common/PageShell";
import { buildEntitySectionTabs } from "@/components/admin/entitySectionTabs";
import { SUPER_ADMIN_TEMPLATE_SECTIONS } from "@/common/superAdminNavGroups";

/**
 * The frame for every page *inside* one template. Superadmin only — college-admin can read a
 * template but never author one, so its panel has a single read-only page and no strip at all.
 *
 * Same rule as the workspace shell: this replaces the list-level tabs instead of nesting under
 * them, so opening a template swaps the strip rather than adding a third one.
 *
 * Publish, unpublish and archive are not tabs. They are buttons on Overview, next to the state
 * they change, rather than a nav destination that reads like somewhere to browse.
 */
export default function SuperAdminTemplateShell({ templateId, title, subtitle, actions, children }) {
  const router = useRouter();
  const pathname = router.pathname || "";

  const tabs = buildEntitySectionTabs({
    sections: SUPER_ADMIN_TEMPLATE_SECTIONS,
    basePath: "/superadmin/projects/templates",
    entityId: templateId,
    pathname,
    query: router.query,
    routePattern: "/superadmin/projects/templates/[templateId]",
  });

  return (
    <PageShell
      title={title || "Template"}
      subtitle={subtitle}
      tabs={tabs}
      tabsAriaLabel="Template sections"
      actions={
        // antd Space inside CourseSectionHeader's own styled actions container — the same pattern
        // every other admin page header uses. Routing via onClick rather than wrapping a Button in
        // a Link, since a <button> inside an <a> is nested interactive content.
        <Space wrap>
          {/* Hardcoded, unlike the workspace shell's resolveWorkspaceBackTarget, because a
              template has exactly one entry point today: the Templates list. If a second one ever
              appears (an audit-log row, a "used by" link from a workspace), this needs the same
              ?from= treatment — a back button that silently lands somewhere you were not is worse
              than no back button. */}
          <Button onClick={() => router.push("/superadmin/projects/templates")}>← Back to templates</Button>
          {/* Same entry point the college-admin template page has: start a workspace from this
              template (for the college selected in the header; the form checks it is assigned). */}
          <Button type="primary" disabled={!templateId}
            onClick={() => router.push(`/superadmin/projects/workspaces/new?templateId=${encodeURIComponent(templateId)}`)}>
            Use this template
          </Button>
          {actions}
        </Space>
      }
    >
      {children}
    </PageShell>
  );
}
