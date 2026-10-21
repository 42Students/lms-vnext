import { useEffect, useState } from "react";
import { useRouter } from "next/router";

/**
 * Shared route transition state for every authenticated LMS shell.
 * Keeping this in one hook prevents learner/admin/superadmin from drifting into
 * different navigation behavior and guarantees route errors/cancellations restore
 * the ready state.
 */
export function useRouteTransition() {
  const router = useRouter();
  const [isRouteTransitioning, setIsRouteTransitioning] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsRouteTransitioning(true);
    const handleDone = () => {
      if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(() => setIsRouteTransitioning(false));
      } else {
        setIsRouteTransitioning(false);
      }
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleDone);
    router.events.on("routeChangeError", handleDone);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleDone);
      router.events.off("routeChangeError", handleDone);
    };
  }, [router.events]);

  return isRouteTransitioning;
}

export default useRouteTransition;
