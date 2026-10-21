"use client";

import {
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { DEPARTMENT_COPY } from "@/modules/admin-ui/department-copy";

export function DepartmentActions({
  departmentId,
  name,
  usage,
}: {
  departmentId: string;
  name: string;
  usage?: { programs: number; courses: number; faculty: number } | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] =
    useState(false);
  const [nextName, setNextName] = useState(name);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [archiveError, setArchiveError] = useState("");
  const [editError, setEditError] = useState("");
  const hasDependencies = usage === null || usage === undefined || (usage.programs + usage.courses + usage.faculty) > 0;
  function requestEditClose() {
    if (pending) return;
    if (nextName.trim() !== name) setDiscardOpen(true);
    else setOpen(false);
  }
  const [pending, startTransition] = useTransition();
  const inFlightRef=useRef(false);

  function rename() {
    if(pending||inFlightRef.current)return;
    if(!nextName.trim()){setEditError("Please enter department name");return;}
    setEditError("");
    inFlightRef.current=true;
    startTransition(async () => {
      try {
      const response = await fetch(
        `/api/college/departments/${departmentId}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: nextName, confirm: true }),
        },
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message=payload?.error==="DEPARTMENT_NAME_CONFLICT"
          ? "That department name is already active in this college."
          : (Boolean(payload?.fieldErrors?.name) || response.status===400)
            ? "Check the department name and try again."
            : response.status===403
              ? "You do not have permission to update this department."
              : response.status===404
                ? "This department is no longer available. Refresh the list before trying again."
                : "Could not save this department. Please try again.";
        setEditError(message);
        showToast({tone:"error",title:DEPARTMENT_COPY.updateFailed,description:message});
        return;
      }

      setOpen(false);
      showToast({
        tone: "success",
        title: DEPARTMENT_COPY.updatedMessage,
      });
      router.refresh();
      }catch{
        setEditError("Could not save this department. Check your connection and try again.");
        showToast({tone:"error",title:DEPARTMENT_COPY.updateFailed});
      }
      finally{inFlightRef.current=false;}
    });
  }

  function archive() {
    if(pending||inFlightRef.current||hasDependencies)return;
    inFlightRef.current=true;
    startTransition(async () => {
      try {
      const response = await fetch(
        `/api/college/departments/${departmentId}`,
        { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirm: true }) },
      );
      const payload =
        await response.json().catch(() => null);

      if (!response.ok) {
        const usage = payload?.usage as
          | {
              programs?: number;
              faculty?: number;
              courses?: number;
            }
          | undefined;
        const dependencies = usage
          ? [
              usage.programs
                ? `${usage.programs} active program(s)`
                : null,
              usage.faculty
                ? `${usage.faculty} faculty assignment(s)`
                : null,
              usage.courses
                ? `${usage.courses} active course(s)`
                : null,
            ]
              .filter(Boolean)
              .join(", ")
          : "";

        setArchiveError("Department was not archived. Move or remove its programs, courses or faculty assignments, then retry.");
        showToast({
          tone: "error",
          title: "Department was not archived",
          description:
            payload?.error ===
              "DEPARTMENT_HAS_DEPENDENCIES"
              ? `Move or archive its dependencies first${dependencies ? `: ${dependencies}` : "."}`
              : "The department could not be archived.",
        });
        return;
      }

      setArchiveError("");
      setArchiveOpen(false);
      showToast({
        tone: "success",
        title: "Department archived",
        description:
          `${name} is no longer active.`,
      });
      router.refresh();
      }catch{
        setArchiveError("Department was not archived. Check your connection and retry.");
        showToast({tone:"error",title:"Department was not archived",description:"The department could not be archived."});
      }
      finally{inFlightRef.current=false;}
    });
  }

  return (
    <>
      <div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] print:hidden sm:flex-row sm:items-center md:justify-end">
      <Button variant="secondary" size="sm" disabled={pending}
        aria-label={"Edit department "+name} title="Edit department"
        onClick={() => {setNextName(name);setEditError("");setOpen(true);}}>
        <span aria-hidden="true">✎</span> {DEPARTMENT_COPY.editButton}
      </Button>
      <Button variant="secondary" size="sm" disabled={pending||hasDependencies}
        aria-label={"Archive department "+name}
        title={hasDependencies?"Resolve linked programs, courses and faculty or refresh unknown counts before archiving.":"Archive this department"}
        onClick={()=>{setArchiveError("");setArchiveOpen(true);}}>
        <span aria-hidden="true">⌫</span> Archive
      </Button>
      </div>
      {archiveError&&!archiveOpen?<Alert tone="error" title="Department was not archived" className="mt-2">
        <p>{archiveError}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={pending||hasDependencies}
            onClick={()=>{setArchiveOpen(true);setArchiveError("");}}>Retry archive</Button>
          <Button type="button" variant="ghost" onClick={()=>setArchiveError("")}>Dismiss</Button>
        </div>
      </Alert>:null}
      <Dialog
        open={open}
        onOpenChange={(next) => next ? (pending?undefined:setOpen(true)) : requestEditClose()}
        dismissible={!pending}
        title={DEPARTMENT_COPY.editTitle}
        description="Edit the department name in the college selected in the platform header. Moving it to another college is not permitted."
        footer={
          <div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] sm:flex-row sm:justify-end [&>button]:w-full sm:[&>button]:w-auto">
            <Button
              variant="secondary"
              disabled={pending}
              onClick={requestEditClose}
            >
              Cancel
            </Button>
            <Button
              disabled={
                pending ||
                !nextName.trim() ||
                nextName.trim() === name
              }
              onClick={rename}
            >
              {pending ? "Saving…" : DEPARTMENT_COPY.saveButton}
            </Button>
          </div>
        }
      >
        <label
          htmlFor={`department-name-${departmentId}`}
          className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
        >
          {DEPARTMENT_COPY.nameLabel}
        </label>
        <Input
          id={`department-name-${departmentId}`}
          value={nextName}
          onChange={(event) => {
            setNextName(event.target.value);
            setEditError("");
          }}
          maxLength={255}
          aria-invalid={Boolean(editError)}
          aria-describedby={editError?"department-edit-error":undefined}
        />
        {editError ? <Alert tone="error" className="mt-3" title="Department was not updated">
          <span id="department-edit-error">{editError}</span>
          <div><Button variant="ghost" type="button" disabled={pending}
            onClick={() => setEditError("")}>Dismiss error</Button></div>
        </Alert> : null}
      </Dialog>
      <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen}
        title="Discard department changes?" description={`Your edits to “${name}” will be lost.`}
        confirmLabel="Discard changes" confirmVariant="danger" pending={pending}
        onConfirm={() => { setDiscardOpen(false); setOpen(false); setNextName(name); }} />
      <Dialog
        open={archiveOpen}
        onOpenChange={next=>{if(!pending)setArchiveOpen(next);}}
        dismissible={!pending}
        title="Archive department"
        description={`Archive ${name}? This is allowed only when it has no linked programs, faculty assignments or courses.`}
        footer={
          <div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] sm:flex-row sm:justify-end [&>button]:w-full sm:[&>button]:w-auto">
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() =>
                setArchiveOpen(false)
              }
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={pending||hasDependencies}
              onClick={archive}
            >
              {pending
                ? "Archiving…"
                : "Archive department"}
            </Button>
          </div>
        }
      >
        {archiveError ? (
          <Alert tone="error">
            <span>{archiveError}</span>
            <div><Button variant="ghost" type="button" disabled={pending}
              onClick={archive}>Retry archive</Button></div>
          </Alert>
        ) : null}
        <p className="m-0 max-w-prose text-sm text-body">
          Archiving removes the department from active selections without deleting historical records.
          All linked programs, courses and faculty assignments must be resolved first; dependencies
          are rechecked immediately before the archive. Reactivation is not available here.
        </p>
      </Dialog>
    </>
  );
}
