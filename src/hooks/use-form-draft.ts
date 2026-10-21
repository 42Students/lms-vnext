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

/** Restoring a severity-only tracker draft would falsely claim an issue was started. */
export function meaningfulDraft<T>(key:string,value:T,initialValue:T):boolean{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const saved=value as Record<string,unknown>;
 if(key==="tracker-issue-report"){
  return ["reporterName","accountRole","environment","page","screen","section",
    "issueType","description","evidenceLink"].some(field=>{
   const current=saved[field];
   const initial=(initialValue as Record<string,unknown>)[field];
   return typeof current==="string"&&current.trim()!==""&&current!==initial;
  });
 }
 return JSON.stringify(value)!==JSON.stringify(initialValue);
}
export function useFormDraft<T>(key: string, initialValue: T, options: {
  debounceMs?: number; enabled?: boolean;
} = {}) {
  const { debounceMs = key==="tracker-issue-report"?250:500, enabled = true } = options;
  const storageKey = key==="tracker-issue-report"?"42tracker_report_draft_v1":`lms:draft:${key}`;
  const previousKey=key==="tracker-issue-report"?"lms:draft:tracker-issue-report":null;
  const initialRef=useRef(initialValue);
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
        const stored=localStorage.getItem(storageKey)??(previousKey?localStorage.getItem(previousKey):null);
        const parsed = parseStoredDraft<T>(stored);
        if(parsed!==null&&!meaningfulDraft(key,parsed,initialRef.current)){
          localStorage.removeItem(storageKey);
          if(previousKey)localStorage.removeItem(previousKey);
        }
        if (parsed !== null && meaningfulDraft(key,parsed,initialRef.current) && !cleared.current && !editedBeforeRestore.current) {
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
  }, [enabled, storageKey,previousKey,key]);

  const flushDraft=()=>{
    if(!enabled||cleared.current||!dirtyRef.current)return;
    try{
      if(meaningfulDraft(key,latestDraft.current,initialRef.current)){
        localStorage.setItem(storageKey,JSON.stringify(latestDraft.current));
        if(previousKey)localStorage.removeItem(previousKey);
      }else{
        localStorage.removeItem(storageKey);
        if(previousKey)localStorage.removeItem(previousKey);
      }
    }catch{/* Browser storage can be disabled; React state remains intact. */}
  };
  useEffect(() => {
    if (!enabled || !ready || !dirty || cleared.current) return;
    const timer = setTimeout(() => {
      flushDraft();
    }, Math.max(0, debounceMs));
    return () => clearTimeout(timer);
  }, [enabled, ready, dirty, draft, storageKey, debounceMs]);

  useEffect(() => {
    if (!enabled) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current || !meaningfulDraft(key,latestDraft.current,initialRef.current)) return;
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
    try { localStorage.removeItem(storageKey);if(previousKey)localStorage.removeItem(previousKey); }
    catch { /* clearing is best effort if storage is unavailable */ }
  };

  return { draft, setDraft, restored, dirty, clearDraft, flushDraft };
}
