import { Badge } from "antd";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { isFacultyRole, isLearnerRole, isAdminRole, getProfilePath } from "@/utils/roleUtils";
import { getFacultyCoursesPath, getFacultyBasePath } from "@/utils/facultyRouteUtils";
import { useNotificationFeed } from "@/hooks/useNotificationFeed";
import { isRecruiterType } from "@/config/roles";

function MobileFooter({ id }) {
  const router = useRouter();
  const loginUser = useSelector(state => state.loginUser);
  const isTeacher = isFacultyRole(loginUser);
  const isMentor = loginUser?.userType === "FACULTY" && loginUser?.facultyType === "MENTOR";
  const isLearner = isLearnerRole(loginUser);
  const isAdmin = isAdminRole(loginUser);
  const isRecruiter = isRecruiterType(loginUser?.userType);
  const inTpoWorkspace = typeof window !== "undefined" && window.location.pathname.startsWith("/tpo");
  // Inside /tpo the footer is the placement workspace footer, whatever the account (college admin or faculty acting as TPO admin).
  const isTpo = loginUser?.userType === "FACULTY" && (loginUser?.facultyType === "TPO" || inTpoWorkspace);
  // Same feed the header notification dropdown uses (live SSE updates included) — this used to
  // run its own independent fetch-once-on-mount call, so on mobile (where both this footer and
  // the header dropdown can be mounted at once) the two could show different, independently
  // stale counts.
  const { data } = useNotificationFeed();

  return (
    <footer className="ln-footer d-block d-md-none">
      <nav aria-label="Mobile navigation">
      <ul className="ln-footer-nav">
        {/* ── Admin mobile nav ── */}
        {isAdmin && !isTpo && (
          <>
            <li className={id === "dashboard" ? "active apply-pointer" : "apply-pointer"}>
              <Link href="/college-admin/dashboard" aria-label="Dashboard" aria-current={id === "dashboard" ? "page" : undefined}>
                <Image src="/assets/images/common/analytics.svg" alt="" width={24} height={24} />
                <span className="ln-footer-label">Dashboard</span>
              </Link>
            </li>
            <li className={id === "departments" ? "active apply-pointer" : "apply-pointer"}>
              <Link href="/college-admin/departments" aria-label="Academic setup" aria-current={id === "departments" ? "page" : undefined}>
                <Image src="/assets/images/common/folder.svg" alt="" width={24} height={24} />
                <span className="ln-footer-label">Academic</span>
              </Link>
            </li>
            <li className={id === "courses" ? "active apply-pointer" : "apply-pointer"}>
              <Link href="/college-admin/courses" aria-label="Courses" aria-current={id === "courses" ? "page" : undefined}>
                <Image src="/assets/images/common/course.svg" alt="" width={24} height={24} />
                <span className="ln-footer-label">Courses</span>
              </Link>
            </li>
            <li className={id === "jobs" ? "active apply-pointer" : "apply-pointer"}>
              <Link href="/college-admin/jobs" aria-label="Placements" aria-current={id === "jobs" ? "page" : undefined}>
                <Image src="/assets/images/common/assignment.svg" alt="" width={24} height={24} />
                <span className="ln-footer-label">Placements</span>
              </Link>
            </li>
            <li className={id === "profile" ? "active apply-pointer" : "apply-pointer"}>
              <Link href="/college-admin/profile" aria-label="Profile" aria-current={id === "profile" ? "page" : undefined}>
                <Image src="/assets/images/common/myAccount.svg" alt="" width={24} height={24} />
                <span className="ln-footer-label">Profile</span>
              </Link>
            </li>
          </>
        )}

        {/* ── Learner mobile nav ── */}
        {isLearner && !isTpo && (
          <>
            <li className={id === "courses" ? "active apply-pointer" : "apply-pointer"}>
              <Link href="/learn/courses" aria-label="Courses" aria-current={id === "courses" ? "page" : undefined}>
                <Image
                  src={id === "courses" ? "/assets/images/common/course.svg" : "/assets/images/common/courses.svg"}
                  alt="" width={24} height={24}
                />
                <span className="ln-footer-label">Courses</span>
              </Link>
            </li>
            <li className={id === "notifications" ? "active apply-pointer" : "apply-pointer"}>
              <Link href="/learn/notifications" aria-label="Notifications" aria-current={id === "notifications" ? "page" : undefined}>
                <Badge count={data && data.length > 99 ? "99+" : (data?.length || 0)} size="small" overflowCount={99}>
                  <Image src="/assets/images/common/bell.svg" alt="" width={24} height={24} />
                </Badge>
                <span className="ln-footer-label">Alerts</span>
              </Link>
            </li>
            <li className={id === "calendar" ? "active apply-pointer" : "apply-pointer"}>
              <Link href="/learn/calendar" aria-label="Class Schedule" aria-current={id === "calendar" ? "page" : undefined}>
                <Image src="/assets/images/common/calender.svg" alt="" width={24} height={24} />
                {/* "Classes", not "Schedule": Placements has its own Schedule (tests and interviews) one tap away (student UX audit, 20 Oct 2026). */}
                <span className="ln-footer-label">Classes</span>
              </Link>
            </li>
            <li className={id === "my-placements" ? "active apply-pointer" : "apply-pointer"}>
              <Link href="/learn/my-placements" aria-label="My Placements" aria-current={id === "my-placements" ? "page" : undefined}>
                <Image src="/assets/images/common/assignment.svg" alt="" width={24} height={24} />
                <span className="ln-footer-label">Placements</span>
              </Link>
            </li>
            <li className={id === "projects" ? "active apply-pointer" : "apply-pointer"}>
              <Link href="/learn/projects" aria-label="Projects" aria-current={id === "projects" ? "page" : undefined}>
                <Image src="/assets/images/common/folder.svg" alt="" width={24} height={24} />
                <span className="ln-footer-label">Projects</span>
              </Link>
            </li>
            <li className={id === "profile" ? "active apply-pointer" : "apply-pointer"}>
              <Link href={getProfilePath(loginUser)} aria-label="Profile" aria-current={id === "profile" ? "page" : undefined}>
                <Image src="/assets/images/common/myAccount.svg" alt="" width={24} height={24} />
                <span className="ln-footer-label">Profile</span>
              </Link>
            </li>
          </>
        )}

        {/* ── Teacher mobile nav ── (not mentors: /mentor has no courses, quizzes or assignments — those
            links bounced to Projects or 404'd) */}
        {isTeacher && !isTpo && !isMentor && (
          <>
            <li className={id === "courses" ? "active apply-pointer" : "apply-pointer"}>
              <Link href={getFacultyCoursesPath(router.pathname, loginUser?.facultyType)} aria-label="Courses" aria-current={id === "courses" ? "page" : undefined}>
                <Image
                  src={id === "courses" ? "/assets/images/common/course.svg" : "/assets/images/common/courses.svg"}
                  alt="" width={24} height={24}
                />
                <span className="ln-footer-label">Courses</span>
              </Link>
            </li>
            <li className={id === "allQuizzes" ? "active apply-pointer" : "apply-pointer"}>
              <Link href={`${getFacultyBasePath(router.pathname, loginUser?.facultyType)}/allQuizzes`} aria-label="Quizzes" aria-current={id === "allQuizzes" ? "page" : undefined}>
                <Image src="/assets/images/common/quiz.svg" alt="" width={24} height={24} />
                <span className="ln-footer-label">Quizzes</span>
              </Link>
            </li>
            <li className={id === "allAssignments" ? "active apply-pointer" : "apply-pointer"}>
              <Link href={`${getFacultyBasePath(router.pathname, loginUser?.facultyType)}/allAssignments`} aria-label="Assignments" aria-current={id === "allAssignments" ? "page" : undefined}>
                <Image
                  src={id === "allAssignments" ? "/assets/images/common/assignment-active.svg" : "/assets/images/common/assignment.svg"}
                  alt="" width={24} height={24}
                />
                <span className="ln-footer-label">Assignments</span>
              </Link>
            </li>
            <li className={id === "profile" ? "active apply-pointer" : "apply-pointer"}>
              <Link href={getProfilePath(loginUser)} aria-label="Profile" aria-current={id === "profile" ? "page" : undefined}>
                <Image src="/assets/images/common/myAccount.svg" alt="" width={24} height={24} />
                <span className="ln-footer-label">Profile</span>
              </Link>
            </li>
          </>
        )}

        {isTpo && (
          <>
            {/* Distinct icons per destination (MORE-02) - all five used the same folder icon before. */}
            {[
              ["home", "/tpo/home", "Home", "/assets/images/common/analytics.svg"],
              ["recruiters", "/tpo/recruiters", "Engage", "/assets/images/common/contact.svg"],
              ["drives", "/tpo/drives", "Drives", "/assets/images/common/assignment.svg"],
              ["students", "/tpo/students", "Students", "/assets/images/common/myAccount.svg"], // existing-student.svg reads as a log-out arrow
              ["more", "/tpo/more", "More", "/assets/images/common/Menu-Icon.svg"],
            ].map(([key, href, label, icon]) => (
              <li key={key} className={id === key ? "active apply-pointer" : "apply-pointer"}>
                <Link href={href} aria-label={label} aria-current={id === key ? "page" : undefined}>
                  <Image src={icon} alt="" width={24} height={24} />
                  <span className="ln-footer-label">{label}</span>
                </Link>
              </li>
            ))}
          </>
        )}

        {isRecruiter && (
          <>
            {/* The same five places as the sidebar. There is no Colleges tab: a recruiter session belongs to one college. */}
            {[
              ["home", "/recruiter/home", "Today", "/assets/images/common/analytics.svg"],
              ["drives", "/recruiter/drives", "Drives", "/assets/images/common/assignment.svg"],
              ["calendar", "/recruiter/calendar", "Calendar", "/assets/images/common/calender.svg"],
              ["messages", "/recruiter/messages", "Messages", "/assets/images/common/message-square.svg"],
              ["company", "/recruiter/company", "Company", "/assets/images/common/contact.svg"],
            ].map(([key, href, label, icon]) => (
              <li key={key} className={id === key ? "active apply-pointer" : "apply-pointer"}>
                <Link href={href} aria-label={label} aria-current={id === key ? "page" : undefined}>
                  <Image src={icon} alt="" width={24} height={24} />
                  <span className="ln-footer-label">{label}</span>
                </Link>
              </li>
            ))}
          </>
        )}

        {isMentor && (
          <>
            <li className={id === "projects" ? "active apply-pointer" : "apply-pointer"}>
              <Link href="/mentor/projects" aria-label="Projects" aria-current={id === "projects" ? "page" : undefined}>
                <Image src="/assets/images/common/folder.svg" alt="" width={24} height={24} />
                <span className="ln-footer-label">Projects</span>
              </Link>
            </li>
            {/* Same three places as the mentor sidebar, plus Profile. */}
            <li className={id === "calendar" ? "active apply-pointer" : "apply-pointer"}>
              <Link href="/mentor/calendar" aria-label="Meetings">
                <Image src="/assets/images/common/calender.svg" alt="" width={24} height={24} />
                <span className="ln-footer-label">Meetings</span>
              </Link>
            </li>
            <li className={id === "notifications" ? "active apply-pointer" : "apply-pointer"}>
              <Link href="/mentor/notifications" aria-label="Notifications">
                <Image src="/assets/images/common/notification.svg" alt="" width={24} height={24} />
                <span className="ln-footer-label">Alerts</span>
              </Link>
            </li>
            <li className={id === "profile" ? "active apply-pointer" : "apply-pointer"}>
              <Link href={getProfilePath(loginUser)} aria-label="Profile">
                <Image src="/assets/images/common/myAccount.svg" alt="" width={24} height={24} />
                <span className="ln-footer-label">Profile</span>
              </Link>
            </li>
          </>
        )}
      </ul>
      </nav>
    </footer>
  );
}

export default MobileFooter;
