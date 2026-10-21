"use client";

import { useEffect,useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";

type Workspace = {
  id: string;
  title: string;
  status: string;
  mentorName: string | null;
  mentorMembershipId?: string | null;
  roleLabel?:string|null;
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
  matchingCapped=false,
  initialProjectId,
}: {
  collegeId: string;
  initialProjectId?: string;
  matchingWorkspaces: { id: string; mentorMembershipId: string | null;roleLabel:string|null }[];
  matchingCapped?:boolean;
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
  const [failureOpen,setFailureOpen]=useState(false);
  const [remoteMentors,setRemoteMentors]=useState<Mentor[]>([]);
  const [mentorLoading,setMentorLoading]=useState(false);
  const [mentorError,setMentorError]=useState("");
  const mentorRequest=useRef(0);
  const [result, setResult] = useState<{
    reassignedCount: number;
    skippedCount: number;
    failures: {
      projectId: string;
      code: string;
    }[];
    taskAssignmentClearingSupported: boolean;
  } | null>(null);

  const selectedMentors=new Map(matchingWorkspaces.map(row=>[row.id,row]));
  const normalizedRole=(role:string|null|undefined)=>
    (role?.trim()||"Project Mentor").toLocaleLowerCase();
  const skippedSelection=selected.filter(projectId=>{
    const previous=selectedMentors.get(projectId);
    return previous?.mentorMembershipId===mentorMembershipId&&
      normalizedRole(previous?.roleLabel)===normalizedRole(roleLabel);
  });
  const actionableSelection = selected.filter(projectId => !skippedSelection.includes(projectId));
  useEffect(()=>{
    const sequence=++mentorRequest.current;
    const controller=new AbortController();
    const query=search.trim();
    if(!query){
      setRemoteMentors([]);setMentorLoading(false);setMentorError("");
      return()=>{controller.abort();};
    }
    setMentorLoading(true);setMentorError("");
    const params=new URLSearchParams({collegeId,q:query,limit:"100"});
    void fetch("/api/projects/mentor-candidates?"+params.toString(),{
      credentials:"same-origin",cache:"no-store",signal:controller.signal,
    }).then(async response=>{
      if(!response.ok)throw new Error("Failed to search mentors. Try again.");
      return response.json() as Promise<{mentors?:Mentor[]}>;
    }).then(payload=>{
      if(controller.signal.aborted||sequence!==mentorRequest.current)return;
      setRemoteMentors(Array.isArray(payload.mentors)?payload.mentors:[]);
    }).catch(()=>{
      if(controller.signal.aborted||sequence!==mentorRequest.current)return;
      setMentorError("Failed to search mentors. Try again.");
      setRemoteMentors([]);
    }).finally(()=>{
      if(sequence===mentorRequest.current&&!controller.signal.aborted)setMentorLoading(false);
    });
    return()=>controller.abort();
  },[collegeId,search]);
  const visibleMentors=useMemo(()=>{
    const pool=search.trim()?remoteMentors:mentors;
    const selectedItem=[...remoteMentors,...mentors]
      .find(row=>row.membershipId===mentorMembershipId);
    if(selectedItem&&!pool.some(row=>row.membershipId===mentorMembershipId))
      return [selectedItem,...pool];
    return pool;
  },[search,remoteMentors,mentors,mentorMembershipId]);
  const selectedMentorName=visibleMentors.find(row=>row.membershipId===mentorMembershipId)?.displayName??
    visibleMentors.find(row=>row.membershipId===mentorMembershipId)?.email??"this mentor";

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
        } catch(caught) {
          const code=caught instanceof Error?
            (caught.message.includes("permission")?"PROJECT_ACCESS_DENIED":"PROJECT_REASSIGNMENT_FAILED"):
            "PROJECT_REASSIGNMENT_FAILED";
          response.failures.push(...chunk.map(projectId => ({projectId,code})));
        }
      }
      setResult(response);
      setFailureOpen(response.failures.length > 0);
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
      // Preserve failed workspace selection so the operator can retry without reselecting.
      setSelected([...new Set(response.failures.map(row=>row.projectId))]);
      router.refresh();
    } catch {
      showToast({
        tone: "error",
        title: "Reassignment failed",
        description:
          "The request could not be completed. Your selection is still available; please retry.",
      });
    } finally {
      sendingRef.current=false;
      setPending(false);
    }
  }

  return (
    <div className="min-w-0 space-y-[var(--lms-space-5)]">
      <section className="border-b border-border pb-5">
        <h2 className="m-0 text-base font-semibold text-foreground">
          Select workspaces
        </h2>
        <div className="mt-[var(--lms-space-3)] flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]">
          <Button variant="secondary" type="button" disabled={pending || !matchingWorkspaces.length}
            onClick={() => setSelected(matchingWorkspaces.map(row => row.id))}
            className="w-full sm:w-auto">
            {matchingCapped?"Select first "+matchingWorkspaces.length+" matching workspaces":
              "Select all "+matchingWorkspaces.length+" matching workspaces"}
          </Button>
          <Button variant="secondary" type="button" disabled={pending || !selected.length}
            onClick={() => setSelected([])}
            className="w-full sm:w-auto">
            Clear selection
          </Button>
          <span className="text-sm text-body">{selected.length} selected across pages</span>
          {matchingCapped?<p role="status" className="w-full text-sm text-warning-text">
            More than 1,000 workspaces match. Selection is limited to the first 1,000;
            narrow the filters to include the remaining workspaces.
          </p>:null}
        </div>
        {!workspaces.length ? (
          <p className="mb-0 mt-3 text-sm text-muted-foreground">
            No non-archived workspaces are available.
          </p>
        ) : (
          <div role="group" aria-label="Workspaces to reassign" className="mt-[var(--lms-space-3)] max-h-[22rem] min-w-0 divide-y divide-[var(--lms-canvas-border)] overflow-y-auto overscroll-contain border-y border-[var(--lms-canvas-border)]">
            {workspaces.map((workspace) => (
              <label
                key={workspace.id}
                className="flex min-h-11 min-w-0 cursor-pointer flex-wrap items-center gap-[var(--lms-space-3)] px-[var(--lms-space-2)] py-[var(--lms-space-3)] motion-safe:transition-colors motion-reduce:transition-none hover:bg-primary-subtle focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary"
              >
                <Checkbox
                  disabled={pending}
                  checked={selected.includes(
                    workspace.id,
                  )}
                  onChange={() =>
                    toggle(workspace.id)
                  }
                />
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-semibold text-foreground">
                    {workspace.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Current mentor:{" "}
                    {workspace.mentorName ??
                      "Unassigned"}
                  </span>
                </span>
                {mentorMembershipId&&workspace.mentorMembershipId===mentorMembershipId&&
                  normalizedRole(workspace.roleLabel)===normalizedRole(roleLabel) ?
                  <StatusBadge tone="warning">Already this mentor — will skip</StatusBadge> : null}
                <StatusBadge tone="neutral">
                  {workspace.status}
                </StatusBadge>
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="border-b border-border pb-5">
        <h2 className="m-0 text-base font-semibold text-foreground">
          Reassign to mentor
        </h2>
        <div className="mt-[var(--lms-space-4)] grid min-w-0 gap-[var(--lms-space-4)] md:grid-cols-2">
          <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Search mentors
            <Input
              type="search"
              disabled={pending}
              maxLength={100}
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by mentor name"
              className="w-full"
            />
          </label>
          <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            New primary mentor
            <Select
              disabled={pending}
              value={mentorMembershipId}
              onChange={(event) =>
                setMentor(event.target.value)
              }
              className="w-full"
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
            </Select>
          </label>
          {mentorLoading?<p role="status" className="text-xs text-body md:col-span-2">
            Searching eligible mentors across the college…</p>:null}
          {mentorError?<p role="alert" className="text-sm text-error md:col-span-2">
            {mentorError}</p>:null}
          {!mentorLoading&&search.trim()&&!visibleMentors.length?
            <p className="text-xs text-body md:col-span-2">
              No matching eligible mentors. Try another name or email.</p>:null}
          <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Role label
            <Input
              disabled={pending}
              value={roleLabel}
              maxLength={80}
              onChange={(event) =>
                setRoleLabel(event.target.value)
              }
              className="w-full"
            />
            <span className="text-xs font-normal text-body">
              Changing the role label updates this mentor even when the membership is unchanged.
              Leave blank for Project Mentor.
            </span>
          </label>
        </div>

        <details className="mt-[var(--lms-space-4)] min-w-0 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-2)]">
         <summary className="inline-flex min-h-11 cursor-pointer items-center text-[13px] font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Reassignment impact</summary>
        <p className="mt-[var(--lms-space-2)] text-sm leading-6 text-body">
          The previous primary mentor is removed from
          each changed workspace. Existing co-mentors
          remain. Scheduled meetings owned by the
          outgoing mentor are cancelled.
        </p>
        <p className="mt-2 text-sm leading-6 text-body">
          Tasks assigned to the outgoing mentor will become unassigned. Both mentors
          and project learners receive a project notification.
        </p>
        </details>

        {selected.length > 0 && mentorMembershipId ?
          <p className="mt-3 text-sm text-body">
            {skippedSelection.length} of {selected.length} selected workspaces will be skipped.
          </p> : null}
        {!selected.length ? <p role="status" className="mt-3 text-sm text-body">Select at least one workspace to reassign.</p> : null}
        <div className="mt-4">
          <Button className="w-full sm:w-auto"
            loading={pending}
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
        <section className="border-b border-border pb-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="m-0 text-base font-semibold text-foreground">Last result</h2>
            <Button size="sm" variant="secondary" onClick={()=>setResult(null)}>
              Dismiss results</Button>
          </div>
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
                  : {failure.code.replace(/^PROJECT_/,"").replaceAll("_"," ").toLowerCase()}.
                  Check this workspace's permissions or state, then retry.
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
      <Dialog open={failureOpen} onOpenChange={setFailureOpen}
        title={(result?.failures.length??0)+" reassignment(s) failed"}
        description="The successful workspaces were saved. Review the failed workspaces and retry only those that failed.">
        <div className="min-w-0 space-y-[var(--lms-space-4)]">
          <p role="status" className="text-sm text-body">{result?.reassignedCount ?? 0} reassigned · {result?.failures.length ?? 0} failed</p>
          <ul className="max-h-64 min-w-0 divide-y divide-[var(--lms-canvas-border)] overflow-y-auto overscroll-contain border-y border-[var(--lms-canvas-border)] pl-[var(--lms-space-5)] text-sm text-body [&_li]:py-[var(--lms-space-2)]">
            {result?.failures.map(failure=><li key={failure.projectId}>
              {workspaces.find(row=>row.id===failure.projectId)?.title ?? failure.projectId}
              {" — "}{failure.code.replaceAll("_"," ").toLowerCase()}.
              Review access or refresh before retrying.
            </li>)}
          </ul>
          <div className="flex min-w-0 flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end">
            <Button variant="secondary" className="w-full md:w-auto" onClick={()=>setFailureOpen(false)}>Close</Button>
            <Button className="w-full md:w-auto" disabled={pending || !result?.failures.length}
              onClick={()=>{setFailureOpen(false);setConfirmOpen(true);}}>Retry failed workspaces</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
