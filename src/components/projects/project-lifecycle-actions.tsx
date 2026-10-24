"use client";

import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";
import { FriendlyFetchError } from "@/lib/api-fetch";
import { friendlyApiError } from "@/lib/friendly-error";

function useProjectAction() {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, setPending] = useState(false);

  async function run(
    action: () => Promise<unknown>,
    success: string,
    after?: () => void,
  ) {
    setPending(true);
    try {
      await action();
      after?.();
      showToast({
        tone: "success",
        title: success,
      });
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Project update failed",
        description:
          error instanceof FriendlyFetchError
            ? error.message
            : friendlyApiError({}),
      });
    } finally {
      setPending(false);
    }
  }

  return { pending, run };
}

export function SprintLifecycleActions({
  projectId,
  sprintId,
  status,
  releaseStatus,
}: {
  projectId: string;
  sprintId: string;
  status: string;
  releaseStatus: string;
}) {
  const { pending, run } = useProjectAction();

  const transition =
    status === "PLANNED"
      ? {
          action: "start",
          label: "Start sprint",
          success: "Sprint started",
        }
      : status === "ACTIVE"
        ? {
            action: "complete",
            label: "Complete sprint",
            success: "Sprint completed",
          }
        : status === "COMPLETED" &&
            releaseStatus !== "SHIPPED"
          ? {
              action: "reopen",
              label: "Reopen sprint",
              success: "Sprint reopened",
            }
          : null;

  if (!transition) {
    return null;
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      loading={pending}
      disabled={pending}
      onClick={() =>
        run(
          () =>
            projectMutation(
              `/api/projects/${projectId}/sprints/${sprintId}/${transition.action}`,
              "POST",
            ),
          transition.success,
        )
      }
    >
      {pending ? "Working…" : transition.label}
    </Button>
  );
}

const taskStatuses = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "DONE",
] as const;

export function TaskLifecycleActions({
  projectId,
  taskId,
  status,
  sprintStatus,
}: {
  projectId: string;
  taskId: string;
  status: string;
  sprintStatus: string;
}) {
  const { pending, run } = useProjectAction();
  const [nextStatus, setNextStatus] =
    useState(status);

  if (
    sprintStatus !== "ACTIVE" ||
    status === "IN_REVIEW"
  ) {
    return null;
  }

  return (
    <div className="mt-[var(--lms-space-3)] flex min-w-0 flex-col gap-[var(--lms-space-2)] sm:flex-row sm:items-end">
      <label className="grid min-w-0 flex-1 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] sm:min-w-40">
        <span className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Task state
        </span>
        <Select
          value={nextStatus}
          disabled={pending}
          onChange={(event) =>
            setNextStatus(event.target.value)
          }
        >
          {taskStatuses.map((value) => (
            <option key={value} value={value}>
              {value
                .toLowerCase()
                .replaceAll("_", " ")}
            </option>
          ))}
        </Select>
      </label>
      <Button
        size="sm"
        variant="primary"
        className="w-full sm:w-auto"
        loading={pending}
        disabled={
          pending || nextStatus === status
        }
        onClick={() =>
          run(
            () =>
              projectMutation(
                `/api/projects/${projectId}/tasks/${taskId}`,
                "PATCH",
                { status: nextStatus },
              ),
            "Task state updated",
          )
        }
      >
        {pending ? "Saving…" : "Update"}
      </Button>
    </div>
  );
}

export function ReleaseLifecycleActions({
  projectId,releaseId,status,expectedUpdatedAt,
}:{projectId:string;releaseId:string;status:string;expectedUpdatedAt:string;}){
 const {pending,run}=useProjectAction();
 const [confirmOpen,setConfirmOpen]=useState(false);
 const shipped=status==="SHIPPED";
 const action=shipped?"unship":"ship";
 const label=shipped?"Un-ship release":"Ship release";
 return <>
  <Button size="sm" variant="secondary" loading={pending} disabled={pending}
   onClick={()=>setConfirmOpen(true)}>{pending?"Checking…":label}</Button>
  <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
   title={shipped?"Un-ship this release?":"Ship this release?"}
   description={shipped?"This removes the shipped marker; linked sprints and tasks remain unchanged.":"This marks the release as delivered. Complete every linked sprint before shipping."}
   confirmLabel={label} pending={pending}
   onConfirm={()=>void run(
    ()=>projectMutation("/api/projects/"+projectId+"/releases/"+releaseId+"/"+action,"POST",{expectedUpdatedAt}),
    shipped?"Release un-shipped.":"Release shipped.",
    ()=>setConfirmOpen(false),
   )}/>
 </>;
}

export function TaskReviewActions({
  projectId,
  taskId,
  submissionId,mode,expectedUpdatedAt,initialDecision="APPROVED",triggerLabel="Review submission",shortcut,
  onReviewSuccess,
}: {
  projectId: string;
  taskId: string;
  submissionId: string;
  mode:"MENTOR"|"ADMIN"|"LEARNER";expectedUpdatedAt:string;
  initialDecision?:"APPROVED"|"CHANGES_REQUESTED";triggerLabel?:string;
  shortcut?:"a"|"s";
  onReviewSuccess?:(taskId:string,decision:"APPROVED"|"CHANGES_REQUESTED")=>void;
}) {
  const { pending, run } = useProjectAction();
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<
    "APPROVED" | "CHANGES_REQUESTED"
  >(initialDecision);
  const [feedback, setFeedback] = useState("");
  useEffect(()=>{
    if(mode!=="MENTOR"||!shortcut)return;
    const onKey=(event:KeyboardEvent)=>{
      if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||
          event.key.toLowerCase()!==shortcut||event.repeat||event.defaultPrevented)return;
      const element=event.target;
      if(element instanceof Element&&
        element.closest("input,textarea,select,button,a,[contenteditable],[role=dialog]"))return;
      if(document.querySelector('[role="dialog"]'))return;
      event.preventDefault();
      setDecision(initialDecision);
      setOpen(true);
    };
    document.addEventListener("keydown",onKey);
    return()=>document.removeEventListener("keydown",onKey);
  },[initialDecision,mode,shortcut]);

  function review() {
    if (
      decision === "CHANGES_REQUESTED" &&
      !feedback.trim()
    ) {
      return;
    }

    void run(
      () =>
        projectMutation(
          `/api/projects/${projectId}/tasks/${taskId}/submissions/${submissionId}/review`,
          "POST",
          {
            decision,
            ...(mode==="MENTOR"?{expectedUpdatedAt,confirmed:true}:{}),
            feedback:feedback.trim()||undefined,
          },
        ),
      decision === "APPROVED"
        ? "Task approved"
        : "Changes requested",
      () => {
        setOpen(false);
        setFeedback("");
        onReviewSuccess?.(taskId,decision);
      },
    );
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>
      <Dialog
        open={open}
        onOpenChange={next=>{if(!pending)setOpen(next);}}
        title="Review task submission"
        description="Approval completes the task. Requesting changes returns it to In progress."
        footer={
          <div className="flex w-full min-w-0 flex-col-reverse gap-[var(--lms-space-2)] sm:flex-row sm:justify-end">
            <Button
              className="w-full sm:w-auto"
              variant="secondary"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto"
              loading={pending}
              disabled={
                pending ||
                (decision ===
                  "CHANGES_REQUESTED" &&
                  !feedback.trim())
              }
              onClick={review}
            >
              {pending
                ? "Saving…"
                : decision === "APPROVED"
                  ? "Approve task"
                  : "Request changes"}
            </Button>
          </div>
        }
      >
        <div className="grid min-w-0 gap-[var(--lms-space-4)]">
          <label className="min-w-0">
            <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Decision
            </span>
            <Select
              value={decision}
              onChange={(event) =>
                setDecision(
                  event.target.value as
                    | "APPROVED"
                    | "CHANGES_REQUESTED",
                )
              }
            >
              <option value="APPROVED">
                Approve
              </option>
              <option value="CHANGES_REQUESTED">
                Request changes
              </option>
            </Select>
          </label>
          <label className="min-w-0">
            <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Feedback
            </span>
            <Textarea
              value={feedback}
              maxLength={4000}
              placeholder={
                decision === "CHANGES_REQUESTED"
                  ? "Tell the learner what must change…"
                  : "Optional review note…"
              }
              onChange={(event) =>
                setFeedback(event.target.value)
              }
            />
          </label>
        </div>
      </Dialog>
    </>
  );
}
