import { useEffect, useRef } from "react";

const STORAGE_PREFIX = "lms:route-scroll:v1:";

export const getRouteScrollStorageKey = (asPath) =>
  STORAGE_PREFIX + encodeURIComponent(String(asPath || "/"));

export function readRouteScroll(asPath, storage = typeof window !== "undefined" ? window.sessionStorage : null) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(getRouteScrollStorageKey(asPath));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const x = Number(parsed?.x);
    const y = Number(parsed?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x: Math.max(0, x), y: Math.max(0, y) };
  } catch (_) {
    return null;
  }
}

export function writeRouteScroll(
  asPath,
  position,
  storage = typeof window !== "undefined" ? window.sessionStorage : null
) {
  if (!storage || !asPath) return;
  const x = Number(position?.x);
  const y = Number(position?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  try {
    storage.setItem(
      getRouteScrollStorageKey(asPath),
      JSON.stringify({ x: Math.max(0, x), y: Math.max(0, y) })
    );
  } catch (_) {
    // Storage can be unavailable in private/restricted browser contexts. Navigation
    // must still work; restoration simply falls back to the normal top-of-page behavior.
  }
}

/**
 * Preserve scroll on browser back/forward while keeping deliberate forward navigation
 * predictable. This runs once at app-shell level so list → detail → Back behaves the
 * same across learner/faculty/TPO/admin surfaces.
 */
export function useRouteScrollRestoration(router) {
  const currentPathRef = useRef(router?.asPath || "/");
  const restoringPopRef = useRef(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !router?.events ||
      typeof router.beforePopState !== "function"
    ) {
      return undefined;
    }

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    currentPathRef.current = router.asPath || currentPathRef.current;

    const saveCurrentPosition = () => {
      writeRouteScroll(currentPathRef.current, {
        x: window.scrollX,
        y: window.scrollY,
      });
    };

    const handleRouteStart = () => {
      saveCurrentPosition();
    };

    const handleRouteComplete = (url) => {
      const nextPath = url || router.asPath || "/";
      currentPathRef.current = nextPath;

      window.requestAnimationFrame(() => {
        if (restoringPopRef.current) {
          const saved = readRouteScroll(nextPath);
          if (saved) {
            window.scrollTo({ left: saved.x, top: saved.y, behavior: "auto" });
          }
        } else if (!String(nextPath).includes("#")) {
          window.scrollTo({ left: 0, top: 0, behavior: "auto" });
        }
        restoringPopRef.current = false;
      });
    };

    router.beforePopState(() => {
      restoringPopRef.current = true;
      return true;
    });
    router.events.on("routeChangeStart", handleRouteStart);
    router.events.on("routeChangeComplete", handleRouteComplete);

    return () => {
      saveCurrentPosition();
      router.events.off("routeChangeStart", handleRouteStart);
      router.events.off("routeChangeComplete", handleRouteComplete);
      router.beforePopState(() => true);
      window.history.scrollRestoration = previousScrollRestoration || "auto";
    };
  }, [router]);
}
