"use client";
import Image from "next/image";
import Link from "next/link";
import "@/components/shell/legacy-mobile-footer.css";
import { usePathname } from "next/navigation";

/** Legacy phone footer destinations. More opens the actual /tpo/more page
 * instead of a competing BottomSheet that hid the page navigation. */
const links = [
  {label:"Home",href:"/tpo/home",icon:"/assets/images/common/analytics.svg"},
  {label:"Engage",href:"/tpo/recruiters",icon:"/assets/images/common/contact.svg"},
  {label:"Drives",href:"/tpo/placements",icon:"/assets/images/common/assignment.svg"},
  {label:"Students",href:"/tpo/students",icon:"/assets/images/common/myAccount.svg"},
  {label:"More",href:"/tpo/more",icon:"/assets/images/common/Menu-Icon.svg"},
] as const;

const moreDestinations = [
  "/tpo/more", "/tpo/batches", "/tpo/requests", "/tpo/verification",
  "/tpo/calendar", "/tpo/team", "/tpo/reports", "/tpo/messages",
  "/tpo/announcements", "/tpo/notifications", "/tpo/settings", "/tpo/audit",
] as const;

export function TpoMobileFooter() {
  const pathname = usePathname();
  const moreActive = moreDestinations.some(href =>
    pathname === href || pathname.startsWith(href + "/"));
  return (
    <nav aria-label="TPO mobile footer"
      className="lms-tpo-mobile-footer fixed inset-x-0 bottom-0 z-40 grid min-w-0 grid-cols-5 md:hidden">
      {links.map(link => {
        const active = link.label === "More" ? moreActive :
          pathname === link.href || pathname.startsWith(link.href + "/") ||
          (link.label === "Engage" && pathname.startsWith("/tpo/companies"));
        return <Link key={link.label} href={link.href} title={link.label}
          aria-current={active ? "page" : undefined}
          className={"lms-tpo-mobile-footer-item flex h-full min-h-16 min-w-0 flex-col items-center justify-center px-1 py-1 text-center focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--lms-primary)] " + (active ? "active" : "")}>
          <Image src={link.icon} alt="" width={24} height={24}
            className="lms-tpo-mobile-footer-icon"/>
          <span className="lms-tpo-mobile-footer-label">{link.label}</span>
        </Link>;
      })}
    </nav>
  );
}
