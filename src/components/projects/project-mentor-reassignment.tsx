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

/** Never surface raw internal API error codes or confidential tenant details.
 * A failed row remains selected for idempotent retry after the operator
 * resolves permissions, lifecycle or overlapping project mutations.
 */
function reassignmentFailureReason(code:string):string{
  switch(code){
    case "PROJECT_ACCESS_DENIED":
    case "PROJECT_LIFECYCLE_ACCESS_DENIED":
      return "Permission changed. Check your selected college and account access.";
    case "PROJECT_INVALID_STATE":
    case "PROJECT_REASSIGNMENT_INVALID_STATE":
      return "The workspace state changed. Refresh and select it again.";
    case "PROJECT_MEMBER_NOT_FOUND":
    case "PROJECT_MENTOR_NOT_FOUND":
      return "The mentor membership is no longer eligible. Choose another mentor.";
    case "PROJECT_REASSIGNMENT_CONFLICT":
    case "PROJECT_MEMBER_CONFLICT":
      return "Another editor changed this workspace. Refresh before retrying.";
    default:
      return "The reassignment could not be confirmed. Refresh and retry only this workspace.";
  }
}

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
  const [mentorPage,setMentorPage]=useState(0);
  const [workspacePage,setWorkspacePage]=useState(1);
  const [targetAttempted,setTargetAttempted]=useState(false);
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
  const workspacePageCount=Math.max(1,Math.ceil(workspaces.length/10));
  const currentWorkspacePage=Math.min(workspacePage,workspacePageCount);
  const visibleWorkspaces=workspaces.slice((currentWorkspacePage-1)*10,currentWorkspacePage*10);
  const allPageSelected=Boolean(visibleWorkspaces.length)&&
    visibleWorkspaces.every(row=>selected.includes(row.id));
  useEffect(()=>{
    const sequence=++mentorRequest.current;
    const controller=new AbortController();
    const query=search.trim();
    if(!query){
      setRemoteMentors([]);setMentorLoading(false);setMentorError("");
      return()=>{controller.abort();};
    }
    setMentorLoading(true);setMentorError("");
    const params=new URLSearchParams({collegeId,q:query,limit:"100",
      offset:String(mentorPage*100)});
    const timer=window.setTimeout(()=>{void fetch("/api/projects/mentor-candidates?"+params.toString(),{
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
    });},250);
    return()=>{window.clearTimeout(timer);controller.abort();};
  },[collegeId,search,mentorPage]);
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
    setTargetAttempted(true);
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
          <span role="status" aria-live="polite" className="text-sm text-body">{selected.length} selected across pages</span>
          {matchingCapped?<p role="status" className="w-full text-sm text-warning-text">
            More than 1,000 workspaces match. Selection is limited to the first 1,000;
            narrow the filters to include the remaining workspaces.
          </p>:null}
        </div>
        {!workspaces.length?(
          <p className="mb-0 mt-3 text-sm text-body">
            No active workspaces match this filter.
          </p>
        ):(
          <div className="mt-3 min-w-0 space-y-2">
            <div className="min-w-0 overflow-x-auto border-y border-border">
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                <caption className="sr-only">Select workspaces for mentor reassignment</caption>
                <thead><tr className="border-b border-border bg-muted/20">
                  <th scope="col" className="w-12 px-3 py-2">
                    <Checkbox aria-label="Select all workspaces on this page"
                      disabled={pending} checked={allPageSelected}
                      onChange={event=>setSelected(old=>{
                        const ids=visibleWorkspaces.map(row=>row.id);
                        return event.target.checked?[...new Set([...old,...ids])]:
                          old.filter(id=>!ids.includes(id));
                      })}/>
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">Workspace</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Current mentor</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Status</th>
                </tr></thead>
                <tbody>
                  {visibleWorkspaces.map(workspace=><tr key={workspace.id}
                    className="border-b border-border last:border-0">
                    <td className="px-3 py-2">
                      <Checkbox disabled={pending}
                        aria-label={"Select "+workspace.title}
                        checked={selected.includes(workspace.id)}
                        onChange={()=>toggle(workspace.id)}/>
                    </td>
                    <th scope="row" className="px-3 py-2 font-semibold">{workspace.title}</th>
                    <td className="px-3 py-2">
                      {workspace.mentorName??"—"}
                      {mentorMembershipId&&workspace.mentorMembershipId===mentorMembershipId&&
                        normalizedRole(workspace.roleLabel)===normalizedRole(roleLabel)?
                        <span className="ml-2"><StatusBadge tone="warning">
                          Already this mentor — will skip</StatusBadge></span>:null}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge tone={workspace.status==="ACTIVE"?"success":
                         workspace.status==="COMPLETED"?"neutral":"warning"}>
                        {workspace.status.replaceAll("_"," ").toLowerCase()
                          .replace(/^./,letter=>letter.toUpperCase())}
                      </StatusBadge>
                    </td>
                  </tr>)}
                </tbody>
              </table>
            </div>
            {workspacePageCount>1?<nav aria-label="Workspace selection pages"
              className="flex flex-wrap items-center gap-2 text-sm">
              <span>Page {currentWorkspacePage} of {workspacePageCount}</span>
              <Button type="button" size="sm" variant="secondary"
                disabled={currentWorkspacePage===1}
                onClick={()=>setWorkspacePage(n=>Math.max(1,n-1))}>Previous</Button>
              <Button type="button" size="sm" variant="secondary"
                disabled={currentWorkspacePage===workspacePageCount}
                onClick={()=>setWorkspacePage(n=>Math.min(workspacePageCount,n+1))}>Next</Button>
            </nav>:null}
          </div>
        )}
      </section>

      <section className="border-b border-border pb-5">
        <h2 className="m-0 text-base font-semibold text-foreground">
          Reassign to new mentor
        </h2>
        <p className="mt-2 text-sm leading-6 text-body">
          The previous primary mentor is replaced for the selected workspaces.
          Existing co-mentors and reviewers remain, tasks assigned to the outgoing mentor
          become unassigned, and meetings scheduled by the outgoing mentor are cancelled.
          Both mentor teams and learners receive project notifications.
        </p>
        <div className="mt-[var(--lms-space-4)] grid min-w-0 gap-[var(--lms-space-4)] md:grid-cols-2">
          <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Search mentors
            <Input
              type="search"
              disabled={pending}
              maxLength={100}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setMentorPage(0);
              }}
              placeholder="Search by mentor name"
              className="w-full"
            />
          </label>
          <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            New mentor
            <Select
              aria-invalid={targetAttempted&&!mentorMembershipId}
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
          <nav aria-label="Mentor search results pages"
            className="flex flex-wrap items-center gap-2 text-xs text-body md:col-span-2">
            <Button type="button" variant="secondary" size="sm"
              disabled={pending||mentorLoading||mentorPage===0}
              onClick={()=>setMentorPage(page=>Math.max(0,page-1))}>Previous mentors</Button>
            <span>Page {mentorPage+1}</span>
            <Button type="button" variant="secondary" size="sm"
              disabled={pending||mentorLoading||remoteMentors.length<100||mentorPage>=999}
              onClick={()=>setMentorPage(page=>Math.min(999,page+1))}>Next mentors</Button>
          </nav>
          {targetAttempted&&!mentorMembershipId?<p role="alert"
            className="text-sm text-error md:col-span-2">Select a mentor</p>:null}
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
              placeholder="Project Mentor"
              title="The new primary mentor's role label in team rosters. Leave blank for Project Mentor."
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
            {pending?"Reassigning…":"Reassign selected"}
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
                  : {reassignmentFailureReason(failure.code)}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
        title={"Reassign "+actionableSelection.length+" of "+selected.length+" selected workspace(s) to "+selectedMentorName+"?"}
        description="The previous primary mentor is removed from the selected workspaces; existing co-mentors stay. Confirm the new mentor before updating projects."
        confirmLabel="Reassign" pending={pending}
        onConfirm={()=>void executeReassignment()}/>
      <Dialog open={failureOpen} onOpenChange={setFailureOpen}
        title={(result?.failures.length??0)+" reassignment(s) failed"}
        description="The successful workspaces were saved. Review the failed workspaces and retry only those that failed.">
        <div className="min-w-0 space-y-[var(--lms-space-4)]">
          <p role="status" className="text-sm text-body">{result?.reassignedCount ?? 0} reassigned · {result?.failures.length ?? 0} failed</p>
          <ul className="max-h-64 min-w-0 divide-y divide-[var(--lms-canvas-border)] overflow-y-auto overscroll-contain border-y border-[var(--lms-canvas-border)] pl-[var(--lms-space-5)] text-sm text-body [&_li]:py-[var(--lms-space-2)]">
            {result?.failures.map(failure=><li key={failure.projectId}>
              {workspaces.find(row=>row.id===failure.projectId)?.title ?? failure.projectId}
              {" — "}{reassignmentFailureReason(failure.code)}
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
