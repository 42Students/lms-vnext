import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import CourseTabSkeleton from "@/components/Course/Common/CourseTabSkeleton";

export default function CourseDetails() {
  const router = useRouter();
  const redirectedRef = useRef(false);
  useEffect(() => {
    if (!router.isReady || !router.asPath || redirectedRef.current) return;
    redirectedRef.current = true;
    const [pathname, queryString] = router.asPath.split("?");
    const base = pathname.replace(/\/+$/, "");
    const qs = queryString ? `?${queryString}` : "";
    router.replace(`${base}/home${qs}`);
  }, [router.isReady, router.asPath]);

  // This route immediately client-redirects to .../home, which itself renders CourseTabSkeleton
  // while it loads. Reusing that same skeleton here (rather than a differently-shaped one-off)
  // means the brief moment before the redirect fires doesn't flash a different skeleton shape
  // right before the real course-tab skeleton takes over.
  return <CourseTabSkeleton tab="home" isTeacherRole />;
}
