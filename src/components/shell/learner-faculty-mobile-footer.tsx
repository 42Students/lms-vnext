"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";
import "./legacy-mobile-footer.css";

type FooterLink = {
  href: string;
  label: string;
  icon: string;
  activeIcon?: string;
};

const learnerLinks: readonly FooterLink[] = [
  { href: "/learn/courses", label: "Courses", icon: "/assets/images/common/courses.svg", activeIcon: "/assets/images/common/course.svg" },
  { href: "/learn/notifications", label: "Notifications", icon: "/assets/images/common/bell.svg" },
  { href: "/learn/profile", label: "Profile", icon: "/assets/images/common/myAccount.svg" },
];

const facultyLinks: readonly FooterLink[] = [
  { href: "/teacher/courses", label: "Courses", icon: "/assets/images/common/courses.svg", activeIcon: "/assets/images/common/course.svg" },
  { href: "/teacher/allQuizzes", label: "All quizzes", icon: "/assets/images/common/quiz.svg", activeIcon: "/assets/images/common/quiz-active.svg" },
  { href: "/teacher/allAssignments", label: "All assignments", icon: "/assets/images/common/assignment.svg", activeIcon: "/assets/images/common/assignment-active.svg" },
  { href: "/teacher/profile", label: "Profile", icon: "/assets/images/common/myAccount.svg" },
];

/** The original LMS mobile footer: MobileFooter.jsx:21-149 (learner/faculty).
 * Modern source CSS: legacy-styles/components___antddesign.scss:912-936.
 * No TPO footer is mounted here; the TPO layout owns its own footer.
 */
export function LearnerFacultyMobileFooter() {
  const pathname = usePathname();
  const learner = pathname === "/learn" || pathname.startsWith("/learn/");
  const faculty = pathname === "/teacher" || pathname.startsWith("/teacher/");
  const [unread, setUnread] = useState<number | null>(null);

  useEffect(() => {
    if (!learner) return;
    let active = true;
    void apiFetch<{notifications?: Array<{notification?: {readAt?: string | null}}>} >(
      "/api/notifications?limit=40", { cache: "no-store" },
    ).then(response => {
      if (!active || !Array.isArray(response.notifications)) return;
      setUnread(response.notifications.filter(row => row.notification?.readAt === null).length);
    }).catch(() => { /* A failed count must not prevent mobile navigation. */ });
    return () => { active = false; };
  }, [learner]);

  if (!learner && !faculty) return null;
  const links = learner ? learnerLinks : facultyLinks;
  return <footer data-slot="legacy-mobile-footer" className="lms-legacy-mobile-footer">
    <nav aria-label={learner ? "Learner mobile navigation" : "Faculty mobile navigation"} className="lms-legacy-mobile-footer-nav">
      <ul className="lms-legacy-mobile-footer-items">
        {links.map(item => {
          const current = pathname === item.href || pathname.startsWith(item.href + "/");
          return <li key={item.href} className={current ? "active" : undefined}>
            <Link href={item.href} aria-label={item.label} aria-current={current ? "page" : undefined} className="lms-legacy-mobile-footer-link">
              <Image src={current ? item.activeIcon ?? item.icon : item.icon} alt="" width={30} height={30}
                draggable={false} className="lms-legacy-mobile-footer-icon" />
              {item.href === "/learn/notifications" && unread !== null && unread > 0 ?
                <span className="lms-legacy-mobile-footer-badge" aria-label={unread + " unread notifications"}>
                  {unread > 99 ? "99+" : unread}
                </span> : null}
            </Link>
          </li>;
        })}
      </ul>
    </nav>
  </footer>;
}
