"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";
import type { ShellNavItem } from "./shell-model";
import { legacySidebarItemActive } from "./legacy-sidebar-active-model";
import "./legacy-mobile-footer.css";

type FooterLink = {
  href: string;
  label: string;
  icon: string;
  activeIcon?: string;
  visibleLabel?: string;
};
type NotificationInboxRow = { notification: { readAt: string | null } };

/** Exact newer legacy footer inventory:
 * lms2-fe/prod-2026/src/components/MobileFooter/MobileFooter.jsx:38-232.
 * The vNext destinations replace the legacy paths but preserve labels, icons,
 * groups and the learner/faculty/recruiter/college/mentor role isolation.
 */
const learnerLinks: readonly FooterLink[] = [
  {href:"/learn/courses",label:"Courses",icon:"/assets/images/common/courses.svg",activeIcon:"/assets/images/common/course.svg"},
  {href:"/learn/notifications",label:"Notifications",visibleLabel:"Alerts",icon:"/assets/images/common/bell.svg"},
  {href:"/learn/calendar",label:"Class Schedule",visibleLabel:"Schedule",icon:"/assets/images/common/calender.svg"},
  {href:"/learn/my-placements",label:"My Placements",visibleLabel:"Placements",icon:"/assets/images/common/assignment.svg"},
  {href:"/learn/projects",label:"Projects",icon:"/assets/images/common/folder.svg"},
  {href:"/learn/profile",label:"Profile",icon:"/assets/images/common/myAccount.svg"},
];
const facultyLinks: readonly FooterLink[] = [
  {href:"/teacher/courses",label:"Courses",icon:"/assets/images/common/courses.svg",activeIcon:"/assets/images/common/course.svg"},
  {href:"/teacher/allQuizzes",label:"Quizzes",icon:"/assets/images/common/quiz.svg"},
  {href:"/teacher/allAssignments",label:"Assignments",icon:"/assets/images/common/assignment.svg",activeIcon:"/assets/images/common/assignment-active.svg"},
  {href:"/teacher/profile",label:"Profile",icon:"/assets/images/common/myAccount.svg"},
];
const recruiterLinks: readonly FooterLink[] = [
  {href:"/hr/home",label:"Today",icon:"/assets/images/common/analytics.svg"},
  {href:"/hr/drives",label:"Drives",icon:"/assets/images/common/assignment.svg"},
  {href:"/hr/calendar",label:"Calendar",icon:"/assets/images/common/calender.svg"},
  {href:"/hr/conversations",label:"Messages",icon:"/assets/images/common/message-square.svg"},
  {href:"/hr/company",label:"Company",icon:"/assets/images/common/contact.svg"},
];
const collegeLinks: readonly FooterLink[] = [
  {href:"/college",label:"Dashboard",icon:"/assets/images/common/analytics.svg"},
  {href:"/college/departments",label:"Departments",icon:"/assets/images/common/folder.svg"},
  {href:"/college/courses",label:"Courses",icon:"/assets/images/common/course.svg"},
  {href:"/college/placements",label:"Jobs",icon:"/assets/images/common/assignment.svg"},
  {href:"/college/profile",label:"Profile",icon:"/assets/images/common/myAccount.svg"},
];
const mentorLinks: readonly FooterLink[] = [
  {href:"/mentor/projects",label:"Projects",icon:"/assets/images/common/folder.svg"},
];

/** Name retained for existing shell imports; now covers all legacy mobile roles. */
export function LearnerFacultyMobileFooter({items}:{items:readonly ShellNavItem[]}) {
  const pathname = usePathname();
  const learner = pathname === "/learn" || pathname.startsWith("/learn/");
  const faculty = pathname === "/teacher" || pathname.startsWith("/teacher/");
  const recruiter = pathname === "/hr" || pathname.startsWith("/hr/") ||
    pathname === "/recruiter" || pathname.startsWith("/recruiter/");
  const college = pathname === "/college" || pathname.startsWith("/college/");
  const mentor = pathname === "/mentor" || pathname.startsWith("/mentor/");
  const [unread, setUnread] = useState<number | null>(null);

  useEffect(() => {
    if (!learner) return;
    let active = true;
    void apiFetch<{notifications?: NotificationInboxRow[]}>(
      "/api/notifications?limit=40", {cache:"no-store"},
    ).then(response=>{
      if (!active) return;
      if (!Array.isArray(response.notifications)) {
        // Invalid/unavailable count is not proof that there are zero unread.
        setUnread(null);
        return;
      }
      setUnread(response.notifications.filter(row=>row.notification.readAt===null).length);
    }).catch(()=>{
      // Retire stale counts on failed refresh; keep navigation usable offline.
      if (active) setUnread(null);
    });
    return ()=>{active=false;};
  }, [learner, pathname]);

  if (!learner && !faculty && !recruiter && !college && !mentor) return null;
  const all = learner ? learnerLinks : faculty ? facultyLinks :
    recruiter ? recruiterLinks : college ? collegeLinks : mentorLinks;
  // Match shell feature permissions: disabled learner modules cannot leak
  // into a separate bottom bar that bypasses the canonical sidebar.
  const links = all.filter(link=>items.some(item=>item.href===link.href));
  if (!links.length) return null;
  return <footer data-slot="legacy-mobile-footer" className="lms-legacy-mobile-footer">
    <nav aria-label="Mobile navigation" className="lms-legacy-mobile-footer-nav">
      <ul className="lms-legacy-mobile-footer-items min-w-0">
        {links.map(item=>{
          // Match the desktop sidebar on recruiter alias/detail URLs and
          // college utility pages; the old mobile footer highlighted a role tab.
          const current=legacySidebarItemActive(pathname,item,null,null);
          const alerts=item.href==="/learn/notifications"&&unread!==null;
          return <li key={item.href} className={current?"active min-w-0 flex-1":"min-w-0 flex-1"}>
            <Link href={item.href} aria-current={current?"page":undefined}
              aria-label={alerts?item.label+", "+unread+" unread":item.label}
              className="lms-legacy-mobile-footer-link">
              <span className="lms-legacy-mobile-footer-icon-wrap">
                <Image src={current?item.activeIcon??item.icon:item.icon} alt=""
                  width={24} height={24} draggable={false} className="lms-legacy-mobile-footer-icon"/>
                {alerts&&unread!==null&&unread>0?<span aria-hidden="true" className="lms-legacy-mobile-footer-badge">
                  {unread>99?"99+":unread}
                </span>:null}
              </span>
              <span className="lms-legacy-mobile-footer-label">{item.visibleLabel??item.label}</span>
            </Link>
          </li>;
        })}
      </ul>
    </nav>
  </footer>;
}
