import Link from "next/link";
import { Disclosure } from "@/components/ui/disclosure";
import {
  SUPER_ADMIN_PLACEMENT_OVERSIGHT_PRIMARY,
  SUPER_ADMIN_PLACEMENT_OVERSIGHT_ADDITIONAL,
} from "@/modules/placements/super-admin-placement-nav-model";

function NavLinks({ links }: { links: readonly { href: string; label: string }[] }) {
  return <>{links.map(link => <Link key={link.href} href={link.href}
    className="inline-flex min-h-9 max-w-full items-center border-b-2 border-transparent px-3 text-sm font-semibold text-primary-text hover:border-primary">
    {link.label}</Link>)}</>;
}

export function SuperAdminPlacementOversightNav() {
  return <div className="space-y-2">
    <nav aria-label="Super Admin placement oversight" className="flex min-w-0 flex-wrap gap-2">
      <NavLinks links={SUPER_ADMIN_PLACEMENT_OVERSIGHT_PRIMARY} />
    </nav>
    <Disclosure title="More placement reports" className="border-t border-border pt-3">
      <nav aria-label="Additional placement reports" className="mt-3 flex flex-wrap gap-2">
        <NavLinks links={SUPER_ADMIN_PLACEMENT_OVERSIGHT_ADDITIONAL} />
      </nav>
    </Disclosure>
  </div>;
}
