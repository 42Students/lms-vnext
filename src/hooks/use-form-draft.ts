"use client";

/**
 * GR-60: const { draft, setDraft, restored, clearDraft, dirty } =
 *   useFormDraft("drive-create", initialForm); clearDraft() after confirmed save.
 * Browser-only, per-form draft persistence; no data sent to providers.
 * Do not persist passwords, one-time codes or other secrets.
 */
import { useEffect, useRef, useState } from "react";

export function parseStoredDraft<T>(stored: string | null): T | null {
  if (!stored) return null;
  try {
    const value: unknown = JSON.parse(stored);
    return value !== null && typeof value === "object" ? value as T : null;
  } catch { return null; }
}

export function useFormDraft<T>(key: string, initialValue: T, options: {
  debounceMs?: number; enabled?: boolean;
} = {}) {
  const { debounceMs = 500, enabled = true } = options;
  const storageKey = `lms:draft:${key}`;
  const [draft, updateDraft] = useState<T>(initialValue);
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);
  const [dirty, setDirty] = useState(false);
  const cleared = useRef(false);
  // Keep the newest user edit synchronously available to pagehide, even when
  // the debounced React state effect has not saved anything yet.
  const latestDraft = useRef<T>(initialValue);
  const editedBeforeRestore = useRef(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      try {
        const parsed = parseStoredDraft<T>(localStorage.getItem(storageKey));
        if (parsed !== null && !cleared.current && !editedBeforeRestore.current) {
          latestDraft.current = parsed;
          updateDraft(parsed);
          setRestored(true);
          dirtyRef.current = true;
          setDirty(true);
        }
      } catch { /* private browsing may disable storage */ }
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [enabled, storageKey]);

  useEffect(() => {
    if (!enabled || !ready || !dirty || cleared.current) return;
    const timer = setTimeout(() => {
      try { localStorage.setItem(storageKey, JSON.stringify(draft)); }
      catch { /* form remains in React state */ }
    }, Math.max(0, debounceMs));
    return () => clearTimeout(timer);
  }, [enabled, ready, dirty, draft, storageKey, debounceMs]);

  useEffect(() => {
    if (!enabled) return;
    const flushDraft = () => {
      if (cleared.current || !dirtyRef.current) return;
      try { localStorage.setItem(storageKey, JSON.stringify(latestDraft.current)); }
      catch { /* Private browsing may disable storage; keep the React value. */ }
    };
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      // A user who accepts the warning still gets their latest edit back.
      flushDraft();
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("pagehide", flushDraft);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("pagehide", flushDraft);
    };
  }, [enabled, storageKey]);

  const setDraft = (next: T | ((current: T) => T)) => {
    cleared.current = false;
    const value = typeof next === "function"
      ? (next as (current: T) => T)(latestDraft.current)
      : next;
    latestDraft.current = value;
    editedBeforeRestore.current = true;
    dirtyRef.current = true;
    updateDraft(value);
    setDirty(true);
  };
  const clearDraft = () => {
    cleared.current = true;
    dirtyRef.current = false;
    setDirty(false);
    setRestored(false);
    try { localStorage.removeItem(storageKey); }
    catch { /* clearing is best effort if storage is unavailable */ }
  };

  return { draft, setDraft, restored, dirty, clearDraft };
}
