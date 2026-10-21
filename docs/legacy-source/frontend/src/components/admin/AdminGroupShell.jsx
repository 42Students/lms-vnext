import { useRouter } from "next/router";
import PageShell from "@/components/Common/PageShell";
import ModuleGroupGuard from "@/components/admin/ModuleGroupGuard";
import AdminWorkflowGuide from "@/components/admin/AdminWorkflowGuide";
import { ADMIN_NAV_GROUPS } from "@/common/adminNavGroups";
import { resolveActiveTabItem } from "@/common/navTabMatching";

function buildHref(path, query) {
  if (!query) return `/college-admin/${path}`;
  return `/college-admin/${path}?${new URLSearchParams(query).toString()}`;
}

/** Grouped college-admin pages preserve their existing module availability checks. */
export default function AdminGroupShell({ groupKey, actions, children }) {
  const router = useRouter();
  const group = ADMIN_NAV_GROUPS[groupKey];
  if (!group) return children;
  const activeItem = resolveActiveTabItem(group.items, "/college-admin", router.pathname || "", router.query || {});
  const tabs = group.items.map((item, idx) => ({
    key: `${item.path}-${item.query?.type || idx}`,
    label: item.label,
    href: buildHref(item.path, item.query),
    active: item === activeItem,
  }));
  return (
    <PageShell title={group.title} tabs={tabs} actions={actions}>
      {groupKey === "academic" && <AdminWorkflowGuide group={group} activeItem={activeItem} basePath="/college-admin" />}
      <ModuleGroupGuard groupKey={groupKey}>{children}</ModuleGroupGuard>
    </PageShell>
  );
}
