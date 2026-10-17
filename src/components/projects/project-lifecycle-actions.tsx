"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";

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
          error instanceof Error
            ? error.message
            : "The request could not be completed.",
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
    <div className="mt-3 flex flex-wrap items-end gap-2">
      <label className="min-w-40">
        <span className="mb-1 block text-xs font-semibold text-body">
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
        variant="secondary"
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
  <Button size="sm" variant="secondary" disabled={pending}
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
  submissionId,mode,expectedUpdatedAt,
}: {
  projectId: string;
  taskId: string;
  submissionId: string;
  mode:"MENTOR"|"ADMIN"|"LEARNER";expectedUpdatedAt:string;
}) {
  const { pending, run } = useProjectAction();
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<
    "APPROVED" | "CHANGES_REQUESTED"
  >("APPROVED");
  const [feedback, setFeedback] = useState("");

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
        Review submission
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Review task submission"
        description="Approval completes the task. Requesting changes returns it to In progress."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
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
          </>
        }
      >
        <div className="grid gap-4">
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
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
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
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
