import { useEffect, useRef } from "react";

/**
 * Live conversations (13 Oct 2026): while this tab is visible, ask `fetchPulse` every `intervalMs` for the conversations'
 * version and run `onChange` when it moves (a new message, or a message read). Nothing runs while the tab is hidden; coming back
 * checks at once. The pulse never carries messages: `onChange` reloads them through the usual endpoints.
 *
 * `active: false` pauses it (e.g. until the college is known). Off under Jest by default (a screen test that does not mock the
 * pulse would otherwise leave a request open); tests of this hook pass `enabled: true`.
 */
export default function useLivePulse(fetchPulse, onChange, { intervalMs = 4000, active = true, enabled = process.env.NODE_ENV !== "test" } = {}) {
  const changeRef = useRef(onChange);
  const pulseRef = useRef(fetchPulse);
  useEffect(() => { changeRef.current = onChange; }, [onChange]);
  useEffect(() => { pulseRef.current = fetchPulse; }, [fetchPulse]);

  useEffect(() => {
    if (!enabled || !active || typeof window === "undefined") return undefined;
    let stopped = false;
    let timer = null;
    let inFlight = false;
    let version = null;

    const visible = () => typeof document === "undefined" || document.visibilityState !== "hidden";
    const schedule = () => { if (!stopped) timer = setTimeout(tick, intervalMs); };

    async function tick() {
      timer = null;
      if (stopped || inFlight) return;
      if (!visible()) return; // resumes on visibilitychange
      inFlight = true;
      try {
        const res = await pulseRef.current?.();
        const next = res?.data?.version ?? res?.data?.data?.version;
        if (next != null) {
          if (version != null && next !== version) changeRef.current?.();
          version = next;
        }
      } catch {
        // A missed pulse is harmless: the next one catches up.
      } finally {
        inFlight = false;
        schedule();
      }
    }

    const onVisible = () => {
      if (!visible() || stopped) return;
      if (timer) { clearTimeout(timer); timer = null; }
      if (!inFlight) tick();
    };

    tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, active, intervalMs]);
}
