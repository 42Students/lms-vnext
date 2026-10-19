"use client";

import { useEffect, useState } from "react";
import { SidebarNav } from "./sidebar-nav";
import { ShellLogoMark } from "./shell-nav-icons";
import { Drawer } from "@/components/ui/drawer";
import type { ShellNavItem } from "./shell-model";
import {Button} from "@/components/ui/button";

/** Shares the native focus trap, Back and backdrop with every LMS overlay. */
export function MobileNavigation({ items }: { items: readonly ShellNavItem[] }) {
  const [open, setOpen] = useState(false);

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
    <Button type="button" aria-label="Open navigation menu"
      aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(true)}
      className="w-11 shrink-0 md:hidden">
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20"
        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M4 6h16 M4 12h16 M4 18h16" />
      </svg>
    </Button>
    <Drawer open={open} onOpenChange={setOpen} side="left" title="Navigation menu"
      headerLeading={<ShellLogoMark />} className="lms-mobile-sidebar md:hidden"
      bodyClassName="!p-0">
      <SidebarNav items={items} onNavigate={() => setOpen(false)} />
    </Drawer>
  </>;
}
