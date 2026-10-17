"use client";
import {useCallback, useEffect, useState} from "react";

/** Protects draft drive details from page reload/back navigation until a save succeeds. */
export function useUnsavedDriveGuard() {
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  const markDirty=useCallback(()=>setDirty(true),[]);
  const clearDirty=useCallback(()=>setDirty(false),[]);
  return {dirty, markDirty, clearDirty};
}
