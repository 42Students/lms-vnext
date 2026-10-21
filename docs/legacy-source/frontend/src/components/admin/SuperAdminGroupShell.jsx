import { useRouter } from "next/router";
import PageShell from "@/components/Common/PageShell";
import AdminWorkflowGuide from "@/components/admin/AdminWorkflowGuide";
import { SUPER_ADMIN_NAV_GROUPS } from "@/common/superAdminNavGroups";
import { resolveActiveTabItem } from "@/common/navTabMatching";

function buildHref(path, query) {
  if (!query) return `/superadmin/${path}`;
  return `/superadmin/${path}?${new URLSearchParams(query).toString()}`;
}

/** Super admin pages remain visible even when a college disables a module. */
export default function SuperAdminGroupShell({ groupKey, actions, children }) {
  const router = useRouter();
  const group = SUPER_ADMIN_NAV_GROUPS[groupKey];
  if (!group) return children;
  const activeItem = resolveActiveTabItem(group.items, "/superadmin", router.pathname || "", router.query || {});
  const tabs = group.items.map((item, idx) => ({
    key: `${item.path}-${item.query?.type || idx}`,
    label: item.label,
    href: buildHref(item.path, item.query),
    active: item === activeItem,
  }));
  return (
    <PageShell title={group.title} tabs={tabs} actions={actions}>
      {groupKey === "academic" && <AdminWorkflowGuide group={group} activeItem={activeItem} basePath="/superadmin" />}
      {children}
    </PageShell>
  );
}
