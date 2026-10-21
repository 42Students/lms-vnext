import { Button } from "antd";
import React, { useMemo } from "react";
import Head from "next/head";
import { courseTabList } from "@/common/lists";
import PageShell from "@/components/Common/PageShell";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { matchesSelectedCourseRoute, canDisplayCourseContext } from "@/utils/courseTabsContext";

function CoursetabsLayout(page) {
  const router = useRouter();
  const { courseTab, courseId } = router.query;
  const userType = useSelector(state => state?.loginUser?.userType);
  const loggedIn = useSelector(state => !!state?.loginUser?.isUserLoggedIn);
  const selectedCourse = useSelector(state => state?.loginUser?.selectedCourse);
  const routeRoot = (router.pathname || "").split("/").filter(Boolean)[0] || "learn";
  const authorized = canDisplayCourseContext(userType, loggedIn, routeRoot);
  const visibleCourseTabs = useMemo(
    () => authorized ? courseTabList.filter(tab => !tab.roles || tab.roles.includes(userType)) : [],
    [authorized, userType]
  );
  const activeTabPath = useMemo(
    () => (Array.isArray(courseTab) ? courseTab[0] : courseTab) || "home",
    [courseTab]
  );
  const activeKey = useMemo(() => {
    const match = visibleCourseTabs.find(tab => tab.path === activeTabPath);
    return match?.key ?? visibleCourseTabs[0]?.key ?? "1";
  }, [visibleCourseTabs, activeTabPath]);
  const resolvedCourseId = Array.isArray(courseId) ? courseId[0] : courseId;
  const coursesHref = `/${routeRoot}/courses`;

  // Role changes may happen without a route change: never show the previous role's
  // course title or tabs while the new course bootstrap/authorization is pending.
  const courseName = authorized && matchesSelectedCourseRoute(selectedCourse, resolvedCourseId)
    ? selectedCourse?.name || selectedCourse?.course_name || selectedCourse?.courseName || ""
    : "";
  const activeTabLabel = visibleCourseTabs.find(tab => tab.key === activeKey)?.label ?? "";
  const buildTabHref = (tab) => {
    if (!authorized || !resolvedCourseId) return "#";
    const basePath = `${coursesHref}/${encodeURIComponent(resolvedCourseId)}`;
    const queryString = (router.asPath ?? "").split("?")[1] ?? "";
    const params = new URLSearchParams(queryString);
    ["lesson", "content", "filter"].forEach(key => params.delete(key));
    const sanitizedQuery = params.toString();
    return `${basePath}/${tab.path}${sanitizedQuery ? `?${sanitizedQuery}` : ""}`;
  };
  const tabs = visibleCourseTabs.map((tab) => ({
    key: tab.key,
    label: tab.label,
    href: buildTabHref(tab),
    active: tab.key === activeKey,
  }));
  return (
    <div className={`scroll-container learn-projects learn-course-layout learn-course-layout--${activeTabPath}`}>
      {courseName && <Head>
        <title>{activeTabLabel ? `${courseName} · ${activeTabLabel}` : courseName}</title>
      </Head>}
      <PageShell
        title={courseName || "Course"}
        subtitle="Course workspace"
        ariaLabel="Course workspace"
        actions={<Button onClick={() => router.push(coursesHref)}>Back to courses</Button>}
        tabs={tabs}
        tabsAriaLabel="Course sections"
        contentClassName="learn-course-tab-page"
      >
        {page}
      </PageShell>
    </div>
  );
}

export default CoursetabsLayout;
