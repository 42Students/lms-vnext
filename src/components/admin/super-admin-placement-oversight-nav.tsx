"use client";

import { usePathname } from "next/navigation";
import { Disclosure } from "@/components/ui/disclosure";
import { Tabs } from "@/components/ui/tabs";
import {
  SUPER_ADMIN_PLACEMENT_OVERSIGHT_PRIMARY,
  SUPER_ADMIN_PLACEMENT_OVERSIGHT_ADDITIONAL,
} from "@/modules/placements/super-admin-placement-nav-model";

/** Keep the existing destinations; only the legacy underline/navigation skin changes. */
export function SuperAdminPlacementOversightNav() {
  const pathname = usePathname();
  const active = (links: readonly { href: string; label: string }[]) =>
    links.find(link => pathname === link.href || pathname.startsWith(link.href + "/"))?.href ?? "";
  const items = (links: readonly { href: string; label: string }[]) =>
    links.map(link => ({ value: link.href, label: link.label, href: link.href }));

  return <div className="space-y-2">
    <Tabs ariaLabel="Super Admin placement oversight" renderPanel={false}
      value={active(SUPER_ADMIN_PLACEMENT_OVERSIGHT_PRIMARY)}
      items={items(SUPER_ADMIN_PLACEMENT_OVERSIGHT_PRIMARY)} />
    <Disclosure title="More placement reports" className="border-t border-border pt-3">
      <div className="mt-3">
        <Tabs ariaLabel="Additional placement reports" renderPanel={false}
          value={active(SUPER_ADMIN_PLACEMENT_OVERSIGHT_ADDITIONAL)}
          items={items(SUPER_ADMIN_PLACEMENT_OVERSIGHT_ADDITIONAL)} />
      </div>
    </Disclosure>
  </div>;
}
