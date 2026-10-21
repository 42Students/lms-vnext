import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWithErrorHandling, getProjectWorkspaceById } from "@/api/Services/AdminService";
import { aliasSectionRowKeys, dealiasSectionRowKeys, toStructuredValue, unwrapApiItem } from "./adminProjectUtils";
import { materializeSectionKeys } from "./projectSectionFieldConfigs";

/**
 * Shared plumbing for the nine per-workspace section pages.
 *
 * Every section page loads the same workspace through the same college-scoped admin endpoint, so
 * the fetch lives here once rather than being copy-pasted nine times and drifting.
 */

// Admins are not members of the teams they administer, so the member-gated getProjectById
// (student/mentor endpoint) always rejected them with "Access denied to this project". Use the
// college-scoped admin endpoint instead.
export function useSuperAdminWorkspace(workspaceId, collegeId) {
  const [workspace, setWorkspace] = useState(null);
  // Starts true, not false: the router's query (and so `workspaceId`) is undefined on the first
  // client render, and with `loading` false that paint fell through to the "Workspace not found"
  // branch — telling the user the workspace is missing before anything had been fetched. The load
  // effect flips it off in its `finally`.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Ignore a superseded response (a manual reload racing the initial load, or a college switch)
  // instead of letting the slower one overwrite the fresher result.
  const requestSeq = useRef(0);

  const load = useCallback(async () => {
    if (!workspaceId || !collegeId) return;
    const requestId = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithErrorHandling(getProjectWorkspaceById(workspaceId, collegeId));
      if (requestId !== requestSeq.current) return;
      if (result.success) {
        setWorkspace(unwrapApiItem(result));
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


// Loads one section's rows out of a workspace DTO in the shape RepeatingItemEditor edits.
export const sectionRowsFromWorkspace = (sectionName, workspace) =>
  aliasSectionRowKeys(sectionName, toStructuredValue(workspace?.[sectionName], []));

/**
 * Resolves the final keys for the one section this page edits.
 *
 * materializeSectionKeys works across all four sections at once because a task points at a sprint
 * and a meeting points at both — so even when only one section is being saved, the other three
 * have to be handed in (unedited, straight off the workspace) for those cross-references to
 * resolve against live keys instead of being cleared as dangling.
 */
export function materializeSectionRows(sectionName, editedRows, workspace) {
  const rowsFor = (name) => (name === sectionName ? editedRows : sectionRowsFromWorkspace(name, workspace));
  const materialized = materializeSectionKeys(
    rowsFor("sprints"),
    rowsFor("tasks"),
    rowsFor("resources"),
    rowsFor("meetingsList")
  );
  const result = sectionName === "meetingsList" ? materialized.meetings : materialized[sectionName];
  return dealiasSectionRowKeys(sectionName, result);
}

export { refreshWorkspaceForSave } from "./adminWorkspaceSection";
export { aliasSectionRowKeys, toStructuredValue };
