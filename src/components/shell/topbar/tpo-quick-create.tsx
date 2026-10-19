"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { TPO_TOPBAR_QUICK_LINKS } from "@/modules/placements/tpo-topbar-links";
import { TpoNewFollowupModal } from "@/components/tpo/tpo-new-followup-modal";
import { PlusIcon } from "./icons";
import style from "./topbar.module.css";

/** Move the legacy TPO create menu into the real header, without losing the
 * follow-up action or company-prefilled new recruiter/drive destinations.
 */
export function TpoQuickCreate({ collegeId }: { collegeId: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const root = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) {
        root.current.open = false;
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !root.current?.open) return;
      event.preventDefault();
      root.current.open = false;
      root.current.querySelector<HTMLElement>("summary")?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  const company = pathname === "/tpo/companies"
    ? (params.get("name") ?? "").trim().slice(0, 150) : "";
  const suffix = company ? " for " + company : "";
  const links = company ? [
    { label: "New recruiter lead" + suffix,
      href: "/tpo/recruiters?add=1&company=" + encodeURIComponent(company) },
    { label: "New drive" + suffix,
      href: "/tpo/placements/new?company=" + encodeURIComponent(company) },
  ] : TPO_TOPBAR_QUICK_LINKS.filter(link => link.label !== "Follow-up");

  return <details ref={root} className={style.createMenu}>
    <summary className={style.new} aria-label="New placement work">
      <PlusIcon/><span className={style.newLabel}>New</span>
    </summary>
    <nav className={style.createOptions}
      aria-label={company ? "Create work for " + company : "Create placement work"}>
      {links.map(link => <Link key={link.href} href={link.href}
        className={style.menuItem}
        onClick={() => { if (root.current) root.current.open = false; }}>
        {link.label}
      </Link>)}
      <hr className={style.menuDivider}/>
      <div className={style.followupAction}>
        <TpoNewFollowupModal collegeId={collegeId}/>
      </div>
    </nav>
  </details>;
}
