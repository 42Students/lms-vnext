"use client";

import { usePathname } from "next/navigation";
import { Disclosure } from "@/components/ui/disclosure";
import { Tabs } from "@/components/ui/tabs";
import {
  SUPER_ADMIN_PLACEMENT_OVERSIGHT_PRIMARY,
  SUPER_ADMIN_PLACEMENT_OVERSIGHT_ADDITIONAL,
} from "@/modules/placements/super-admin-placement-nav-model";

type OversightLink = { href: string; label: string };
function items(links: readonly OversightLink[]) {
  return links.map(link => ({ value: link.href, label: link.label, href: link.href }));
}
function active(links: readonly OversightLink[], pathname: string) {
  return links.find(link => pathname === link.href || pathname.startsWith(link.href + "/"))?.href
    ?? links[0]?.href ?? "";
}

export function SuperAdminPlacementOversightNav() {
  const pathname = usePathname() ?? "/";
  const additionalActive = SUPER_ADMIN_PLACEMENT_OVERSIGHT_ADDITIONAL.some(link =>
    pathname === link.href || pathname.startsWith(link.href + "/")
  );
  return <div className="space-y-2 print:hidden">
    <Tabs ariaLabel="Super Admin placement oversight" renderPanel={false}
      value={active(SUPER_ADMIN_PLACEMENT_OVERSIGHT_PRIMARY,pathname)}
      items={items(SUPER_ADMIN_PLACEMENT_OVERSIGHT_PRIMARY)} />
    <Disclosure title="More placement reports" defaultOpen={additionalActive} className="border-t border-border pt-3">
      <div className="mt-3">
        <Tabs ariaLabel="Additional placement reports" renderPanel={false}
          value={active(SUPER_ADMIN_PLACEMENT_OVERSIGHT_ADDITIONAL,pathname)}
          items={items(SUPER_ADMIN_PLACEMENT_OVERSIGHT_ADDITIONAL)} />
      </div>
    </Disclosure>
  </div>;
}
