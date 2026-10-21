import { useEffect, useRef } from "react";

/**
 * Run `refresh` when the person comes back to this tab or window, but not more than once every `minGapMs`.
 * Lists then catch up with what students and recruiters did while the page sat in the background.
 */
export default function useRefreshOnFocus(refresh, minGapMs = 20000) {
  const ref = useRef(refresh);
  const last = useRef(Date.now());
  useEffect(() => { ref.current = refresh; }, [refresh]);
  useEffect(() => {
    const go = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      if (Date.now() - last.current < minGapMs) return;
      last.current = Date.now();
      ref.current?.();
    };
    window.addEventListener("focus", go);
    document.addEventListener("visibilitychange", go);
    return () => { window.removeEventListener("focus", go); document.removeEventListener("visibilitychange", go); };
  }, [minGapMs]);
}
