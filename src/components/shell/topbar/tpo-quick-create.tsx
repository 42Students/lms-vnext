"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Dropdown } from "@/components/ui/dropdown";
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
  const company = pathname === "/tpo/companies"
    ? (params.get("name") ?? "").trim().slice(0, 150) : "";
  const suffix = company ? " for " + company : "";
  const links = company ? [
    { label: "New recruiter lead" + suffix,
      href: "/tpo/recruiters?add=1&company=" + encodeURIComponent(company) },
    { label: "New drive" + suffix,
      href: "/tpo/placements/new?company=" + encodeURIComponent(company) },
  ] : TPO_TOPBAR_QUICK_LINKS.filter(link => link.label !== "Follow-up");

  return <Dropdown align="end" className={style.createMenu} label="New placement work"
    triggerClassName={style.new} trigger={<><PlusIcon/><span className={style.newLabel}>New</span></>}>
    <nav className="grid min-w-60 gap-1"
      aria-label={company ? "Create work for " + company : "Create placement work"}>
      {links.map(link => <Link key={link.href} href={link.href}
        className={style.menuItem}>
        {link.label}
      </Link>)}
      <hr className={style.menuDivider}/>
      <div className={style.followupAction}>
        <TpoNewFollowupModal collegeId={collegeId}/>
      </div>
    </nav>
  </Dropdown>;
}
