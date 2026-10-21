import { useRouter } from "next/router";
import { useEffect } from "react";
import CourseTabSkeleton from "@/components/Course/Common/CourseTabSkeleton";

export default function CourseDetails() {
  const router = useRouter();
  useEffect(() => {
    if (!router.isReady) return;

    const courseId = router.query?.courseId;
    if (!courseId || Array.isArray(courseId)) return;

    // Preserve query string (?cls=...) while appending "/home".
    const [pathname, queryString] = (router.asPath ?? "").split("?");
    const normalizedPath = (pathname ?? "").replace(/\/+$/, "");
    const qs = queryString ? `?${queryString}` : "";

    if (normalizedPath.endsWith("/home")) return;

    router.replace(`/learn/courses/${courseId}/home${qs}`);
  }, [router.isReady, router.asPath, router.query?.courseId]);

  // This route immediately client-redirects to .../home, which itself renders CourseTabSkeleton
  // while it loads. Reusing that same skeleton here (rather than a differently-shaped one-off)
  // means the brief moment before the redirect fires doesn't flash a different skeleton shape
  // right before the real course-tab skeleton takes over — the same skeleton-shape-swap bug
  // fixed elsewhere in this module, just between two loading states instead of loading-to-content.
  return <CourseTabSkeleton tab="home" />;
}
