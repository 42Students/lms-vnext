"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";

type Workspace = {
  id: string;
  title: string;
  status: string;
  mentorName: string | null;
  mentorMembershipId?: string | null;
};

type Mentor = {
  membershipId: string;
  displayName: string | null;
  email: string | null;
};

export function ProjectMentorReassignment({
  collegeId,
  workspaces,
  mentors,
  matchingWorkspaces,
  initialProjectId,
}: {
  collegeId: string;
  initialProjectId?: string;
  matchingWorkspaces: { id: string; mentorMembershipId: string | null }[];
  workspaces: Workspace[];
  mentors: Mentor[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<string[]>(
    () => initialProjectId && workspaces.some(item => item.id === initialProjectId)
      ? [initialProjectId] : [],
  );
  const [mentorMembershipId, setMentor] =
    useState("");
  const [roleLabel, setRoleLabel] =
    useState("Project Mentor");
  const [search, setSearch] = useState("");
  const [pending, setPending] =
    useState(false);
  const sendingRef=useRef(false);
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [result, setResult] = useState<{
    reassignedCount: number;
    skippedCount: number;
    failures: {
      projectId: string;
      code: string;
    }[];
    taskAssignmentClearingSupported: boolean;
  } | null>(null);

  const selectedMentors = new Map(matchingWorkspaces.map(row => [row.id, row.mentorMembershipId]));
  const skippedSelection = selected.filter(projectId =>
    selectedMentors.get(projectId) === mentorMembershipId
  );
  const actionableSelection = selected.filter(projectId => !skippedSelection.includes(projectId));
  const selectedMentorName=mentors.find(row=>row.membershipId===mentorMembershipId)?.displayName??
    mentors.find(row=>row.membershipId===mentorMembershipId)?.email??"this mentor";

  const visibleMentors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mentors;
    return mentors.filter((mentor) =>
      (
        (mentor.displayName ?? "") +
        " " +
        (mentor.email ?? "")
      )
        .toLowerCase()
        .includes(q),
    );
  }, [mentors, search]);

  function toggle(projectId: string) {
    setSelected((current) =>
      current.includes(projectId)
        ? current.filter(
            (id) => id !== projectId,
          )
        : [...current, projectId],
    );
  }

  function submit() {
    if (!selected.length) {
      showToast({tone:"error",title:"Select at least one workspace to reassign."});
      return;
    }
    if(!mentorMembershipId||pending)return;
    if (!actionableSelection.length) {
      showToast({tone:"info",title:"No workspaces needed changes — they already have this mentor."});
      return;
    }
    setConfirmOpen(true);
  }
  async function executeReassignment() {
    if(sendingRef.current||pending||!actionableSelection.length||!mentorMembershipId)return;
    sendingRef.current=true;
    setConfirmOpen(false);
    setPending(true);
    setResult(null);
    try {
      const response = {
        reassignedCount: 0,
        skippedCount: skippedSelection.length,
        failures: [] as { projectId: string; code: string }[],
        taskAssignmentClearingSupported: true,
      };
      for (let offset = 0; offset < actionableSelection.length; offset += 100) {
        const chunk = actionableSelection.slice(offset, offset + 100);
        try {
          const partial = (await projectMutation("/api/projects/reassign-mentor", "POST", {
            collegeId, projectIds: chunk, mentorMembershipId, roleLabel,
          })) as {
            reassignedCount: number; skippedCount: number;
            failures: { projectId: string; code: string }[];
            taskAssignmentClearingSupported: boolean;
          };
          response.reassignedCount += partial.reassignedCount;
          response.skippedCount += partial.skippedCount;
          response.failures.push(...partial.failures);
          response.taskAssignmentClearingSupported &&= partial.taskAssignmentClearingSupported;
        } catch {
          response.failures.push(...chunk.map(projectId => ({
            projectId, code: "PROJECT_REASSIGNMENT_FAILED",
          })));
        }
      }
      setResult(response);
      if (response.reassignedCount > 0) {
        showToast({
          tone: "success",
          title: "Reassigned "+response.reassignedCount+" workspace(s) to "+selectedMentorName+".",
          description: "The new primary mentor has been saved for the changed workspaces.",
        });
      } else {
        showToast({
          tone: response.failures.length
            ? "error"
            : "info",
          title: response.failures.length
            ? "No workspaces were reassigned"
            : "No workspaces needed changes — they already have this mentor.",
          description: response.failures.length
            ? "Review the per-workspace failures below."
            : "No workspaces needed changes — they already have this mentor.",
        });
      }
      setSelected([]);
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Mentor reassignment failed",
        description:
          "The request could not be completed. Your selection is still available; please retry.",
      });
    } finally {
      sendingRef.current=false;
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="m-0 text-base font-semibold text-foreground">
          Select workspaces
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" disabled={pending || !matchingWorkspaces.length}
            onClick={() => setSelected(matchingWorkspaces.map(row => row.id))}
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold">
            Select all {matchingWorkspaces.length} matching workspaces
          </button>
          <button type="button" disabled={pending || !selected.length}
            onClick={() => setSelected([])}
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold">
            Clear selection
          </button>
          <span className="text-sm text-body">{selected.length} selected across pages</span>
        </div>
        {!workspaces.length ? (
          <p className="mb-0 mt-3 text-sm text-muted-foreground">
            No non-archived workspaces are available.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {workspaces.map((workspace) => (
              <label
                key={workspace.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(
                    workspace.id,
                  )}
                  onChange={() =>
                    toggle(workspace.id)
                  }
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {workspace.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Current mentor:{" "}
                    {workspace.mentorName ??
                      "Unassigned"}
                  </span>
                </span>
                {mentorMembershipId && workspace.mentorMembershipId === mentorMembershipId ?
                  <StatusBadge tone="warning">Already this mentor — will skip</StatusBadge> : null}
                <StatusBadge tone="neutral">
                  {workspace.status}
                </StatusBadge>
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="m-0 text-base font-semibold text-foreground">
          Reassign to mentor
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold text-foreground">
            Search mentors
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Name or email"
              className="rounded-lg border border-border bg-background px-3 py-2 font-normal"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-foreground">
            New primary mentor
            <select
              value={mentorMembershipId}
              onChange={(event) =>
                setMentor(event.target.value)
              }
              className="rounded-lg border border-border bg-background px-3 py-2 font-normal"
            >
              <option value="">
                Select a mentor
              </option>
              {visibleMentors.map((mentor) => (
                <option
                  key={mentor.membershipId}
                  value={mentor.membershipId}
                >
                  {mentor.displayName ||
                    mentor.email}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-foreground">
            Role label
            <input
              value={roleLabel}
              maxLength={120}
              onChange={(event) =>
                setRoleLabel(event.target.value)
              }
              className="rounded-lg border border-border bg-background px-3 py-2 font-normal"
            />
          </label>
        </div>

        <p className="mt-4 text-sm leading-6 text-body">
          The previous primary mentor is removed from
          each changed workspace. Existing co-mentors
          remain. Scheduled meetings owned by the
          outgoing mentor are cancelled.
        </p>
        <p className="mt-2 text-sm leading-6 text-body">
          Tasks assigned to the outgoing mentor will become unassigned. Both mentors
          and project learners receive a project notification.
        </p>

        {selected.length > 0 && mentorMembershipId ?
          <p className="mt-3 text-sm text-body">
            {skippedSelection.length} of {selected.length} selected workspaces will be skipped.
          </p> : null}
        {!selected.length ? <p role="status" className="mt-3 text-sm text-body">Select at least one workspace to reassign.</p> : null}
        <div className="mt-4">
          <Button
            disabled={
              pending ||
              !selected.length ||
              !mentorMembershipId
            }
            onClick={submit}
          >
            {pending
              ? "Reassigning…"
              : "Reassign " +
                actionableSelection.length +
                " workspace(s)"}
          </Button>
        </div>
      </section>

      {result ? (
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="m-0 text-base font-semibold text-foreground">
            Last result
          </h2>
          <p className="mt-2 text-sm text-body">
            {result.reassignedCount} reassigned ·{" "}
            {result.skippedCount} skipped ·{" "}
            {result.failures.length} failed
          </p>
          {result.failures.length ? (
            <ul className="mb-0 mt-3 space-y-1 pl-5 text-sm text-body">
              {result.failures.map((failure) => (
                <li key={failure.projectId}>
                  {workspaces.find(
                    (workspace) =>
                      workspace.id ===
                      failure.projectId,
                  )?.title ??
                    failure.projectId}
                  : Could not reassign this workspace. Refresh and try again.
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
        title={"Reassign "+actionableSelection.length+" of "+selected.length+" selected workspace(s) to "+selectedMentorName+"?"}
        description="The previous primary mentor is removed from the selected workspaces; existing co-mentors stay. Confirm the new mentor before updating projects."
        confirmLabel="Reassign workspaces" pending={pending}
        onConfirm={()=>void executeReassignment()}/>
    </div>
  );
}
