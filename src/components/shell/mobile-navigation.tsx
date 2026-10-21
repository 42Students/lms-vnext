"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SidebarNav } from "./sidebar-nav";
import { ShellLogoMark } from "./shell-nav-icons";
import { Drawer } from "@/components/ui/drawer";
import type { ShellNavItem } from "./shell-model";
import {Button} from "@/components/ui/button";

/** Shares the native focus trap, Back and backdrop with every LMS overlay. */
export function MobileNavigation({ items }: { items: readonly ShellNavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Native Drawer owns the focus trap, Escape/Back and focus recovery.
  // The opener is disabled while the drawer is open to prevent duplicate
  // overlays; blocked route handling stays with shared navigation links.
  // Close on browser Back/Forward or programmatic route changes as well as
  // the normal sidebar-link click; do not leave a stale modal over new pages.
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const media = typeof window.matchMedia === "function" ? window.matchMedia("(min-width: 768px)") : null;
    const isDesktop = () => media?.matches ?? window.innerWidth >= 768;
    const closeForDesktop = () => { if (isDesktop()) setOpen(false); };
    closeForDesktop();
    media?.addEventListener("change", closeForDesktop);
    window.addEventListener("resize", closeForDesktop);
    return () => { media?.removeEventListener("change", closeForDesktop); window.removeEventListener("resize", closeForDesktop); };
  }, []);

  return <>
    <Button type="button" aria-label={open?"Close menu":"Open menu"} disabled={open}
      aria-expanded={open} aria-haspopup="dialog" aria-controls={open ? "lms-mobile-navigation" : undefined} onClick={() => setOpen(true)}
      variant="secondary" size="icon" className="w-11 shrink-0 md:hidden">
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20"
        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M4 6h16 M4 12h16 M4 18h16" />
      </svg>
    </Button>
    <Drawer id="lms-mobile-navigation" open={open} onOpenChange={setOpen} side="left" title="Navigation menu"
      headerLeading={<ShellLogoMark />} className="lms-mobile-sidebar md:hidden"
      bodyClassName="!px-[var(--lms-space-3)] !pt-[var(--lms-space-2)] !pb-[calc(24px+env(safe-area-inset-bottom,0px))]">
      <SidebarNav items={items} onNavigate={() => setOpen(false)} />
    </Drawer>
  </>;
}
