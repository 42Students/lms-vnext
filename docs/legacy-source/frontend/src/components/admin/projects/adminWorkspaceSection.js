import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWithErrorHandling, getProjectWorkspaceById } from "@/api/Services/AdminService";
import { unwrapApiItem } from "./adminProjectUtils";

/**
 * Loads one workspace for a college-admin section page.
 *
 * This deliberately mirrors, rather than shares, the superadmin panel's
 * `useSuperAdminWorkspace` (superAdminWorkspaceSection.js). The two panels' Projects code is kept
 * separate on purpose — superadmin can do things college-admin cannot, and a shared hook is how the
 * two ended up moving in lockstep before. What is being removed here is duplication *within* this
 * panel: six college-admin section pages each carried their own byte-identical copy of this loader,
 * and every one of them was missing the request-sequence guard the superadmin hook has. Two of them
 * had drifted further and re-fetched on a `collegeId` change without cancelling the in-flight
 * request, so switching college could paint the previous college's workspace.
 *
 * `onLoaded` is what actually differs between the pages — each seeds its own form fields from the
 * loaded item. It is held in a ref so a page can pass an inline function without re-triggering the
 * fetch on every render.
 */
export function useAdminWorkspace(workspaceId, collegeId, onLoaded) {
  const [workspace, setWorkspace] = useState(null);
  // Starts true, not false: the router's query (and so `workspaceId`) is undefined on the first
  // client render, and with `loading` false that paint fell through to the "Workspace not found"
  // branch — telling the user the workspace is missing before anything had been fetched.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestSeq = useRef(0);
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  const load = useCallback(async () => {
    if (!collegeId || !workspaceId) return;
    const requestId = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithErrorHandling(getProjectWorkspaceById(workspaceId, collegeId));
      // A superseded response is dropped rather than allowed to overwrite a fresher one.
      if (requestId !== requestSeq.current) return;
      if (result.success) {
        const item = unwrapApiItem(result);
        setWorkspace(item);
        onLoadedRef.current?.(item);
      } else {
        setWorkspace(null);
        setError(result?.message || "Failed to load workspace.");
      }
    } catch (e) {
      if (requestId !== requestSeq.current) return;
      setWorkspace(null);
      setError(e?.message || "Failed to load workspace.");
    } finally {
      if (requestId === requestSeq.current) setLoading(false);
    }
  }, [workspaceId, collegeId]);

  useEffect(() => {
    load();
  }, [load]);

  return { workspace, loading, error, reload: load };
}

/**
 * Re-reads the workspace immediately before a save that carries cross-section references.
 *
 * materializeSectionKeys clears any sprintKey/linkedTaskKey that does not resolve against the
 * sibling rows it is handed. Those siblings come from the copy of the workspace this page loaded,
 * so a sprint added on the Sprints tab after this page opened is absent from that copy — and every
 * task pointing at it, including tasks the admin never touched, gets silently detached on save.
 *
 * Returns the fresh workspace, or the caller's fallback if the re-read fails: an unresolvable
 * reference is better left alone than cleared on the strength of a snapshot that could not be
 * confirmed.
 */
export async function refreshWorkspaceForSave(workspaceId, collegeId, fallback) {
  if (!workspaceId || !collegeId) return fallback;
  try {
    const result = await fetchWithErrorHandling(getProjectWorkspaceById(workspaceId, collegeId));
    return result?.success ? unwrapApiItem(result) : fallback;
  } catch (_) {
    return fallback;
  }
}
