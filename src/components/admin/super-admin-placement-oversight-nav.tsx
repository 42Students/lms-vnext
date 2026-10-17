import Link from "next/link";
import {
  SUPER_ADMIN_PLACEMENT_OVERSIGHT_PRIMARY,
  SUPER_ADMIN_PLACEMENT_OVERSIGHT_ADDITIONAL,
} from "@/modules/placements/super-admin-placement-nav-model";

function NavLinks({ links }: { links: readonly { href: string; label: string }[] }) {
  return <>{links.map(link => <Link key={link.href} href={link.href}
    className="inline-flex min-h-10 max-w-full items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-primary-text">
    {link.label}</Link>)}</>;
}

export function SuperAdminPlacementOversightNav() {
  return <div className="space-y-2">
    <nav aria-label="Super Admin placement oversight" className="flex min-w-0 flex-wrap gap-2">
      <NavLinks links={SUPER_ADMIN_PLACEMENT_OVERSIGHT_PRIMARY} />
    </nav>
    <details className="rounded-md border border-border bg-surface p-3">
      <summary className="cursor-pointer text-sm font-semibold text-primary-text">More placement reports</summary>
      <nav aria-label="Additional placement reports" className="mt-3 flex flex-wrap gap-2">
        <NavLinks links={SUPER_ADMIN_PLACEMENT_OVERSIGHT_ADDITIONAL} />
      </nav>
    </details>
  </div>;
}
