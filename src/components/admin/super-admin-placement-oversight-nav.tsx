"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Disclosure } from "@/components/ui/disclosure";
import {
  SUPER_ADMIN_PLACEMENT_OVERSIGHT_PRIMARY,
  SUPER_ADMIN_PLACEMENT_OVERSIGHT_ADDITIONAL,
} from "@/modules/placements/super-admin-placement-nav-model";

function NavLinks({ links }: { links: readonly { href: string; label: string }[] }) {
  const pathname = usePathname() ?? "/";
  return <>{links.map(link => {
    const active = pathname === link.href || pathname.startsWith(link.href + "/");
    return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}
      className={"inline-flex min-h-9 max-w-full items-center border-b-2 px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary " +
        (active ? "border-primary text-primary-text" : "border-transparent text-body hover:border-primary hover:text-primary-text")}>
      {link.label}</Link>;
  })}</>;
}

export function SuperAdminPlacementOversightNav() {
  const pathname = usePathname() ?? "/";
  const additionalActive = SUPER_ADMIN_PLACEMENT_OVERSIGHT_ADDITIONAL.some(link =>
    pathname === link.href || pathname.startsWith(link.href + "/")
  );
  return <div className="space-y-2">
    <nav aria-label="Super Admin placement oversight" className="flex min-w-0 flex-wrap gap-2">
      <NavLinks links={SUPER_ADMIN_PLACEMENT_OVERSIGHT_PRIMARY} />
    </nav>
    <Disclosure title="More placement reports" defaultOpen={additionalActive} className="border-t border-border pt-3">
      <nav aria-label="Additional placement reports" className="mt-3 flex flex-wrap gap-2">
        <NavLinks links={SUPER_ADMIN_PLACEMENT_OVERSIGHT_ADDITIONAL} />
      </nav>
    </Disclosure>
  </div>;
}
