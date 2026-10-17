"use client";

import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  const hasDependencies = usage === null || usage === undefined || (usage.programs + usage.courses + usage.faculty) > 0;
  function requestEditClose() {
    if (pending) return;
    if (nextName.trim() !== name) setDiscardOpen(true);
    else setOpen(false);
  }
  const [pending, startTransition] = useTransition();

  function rename() {
    startTransition(async () => {
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
        showToast({
          tone: "error",
          title: DEPARTMENT_COPY.updateFailed,
          description:
            payload?.error === "DEPARTMENT_NAME_CONFLICT"
              ? "That department name is already active in this college."
              : undefined,
        });
        return;
      }

      setOpen(false);
      showToast({
        tone: "success",
        title: DEPARTMENT_COPY.updatedMessage,
      });
      router.refresh();
    });
  }

  function archive() {
    startTransition(async () => {
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

        setArchiveError("Department was not deleted. Move or remove its programs, courses, faculty before deleting. Refresh and retry after resolving dependencies.");
        showToast({
          tone: "error",
          title: "Archive blocked",
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
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setNextName(name);
          setOpen(true);
        }}
      >
        {DEPARTMENT_COPY.editButton}
      </Button>
      <Button
        variant="danger"
        size="sm"
        disabled={pending || hasDependencies}
        title={hasDependencies ? "Move or remove its programs, courses, faculty before deleting." : "Archive this department"}
        onClick={() => { setArchiveError(""); setArchiveOpen(true); }}
      >
        Archive
      </Button>
      </div>
      <Dialog
        open={open}
        onOpenChange={(next) => next ? setOpen(true) : requestEditClose()}
        title={DEPARTMENT_COPY.editTitle}
        description="Department names stay unique within the active college."
        footer={
          <>
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
          </>
        }
      >
        <label
          htmlFor={`department-name-${departmentId}`}
          className="mb-1.5 block text-xs font-semibold text-body"
        >
          {DEPARTMENT_COPY.nameLabel}
        </label>
        <Input
          id={`department-name-${departmentId}`}
          value={nextName}
          onChange={(event) =>
            setNextName(event.target.value)
          }
          maxLength={255}
        />
      </Dialog>
      <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen}
        title="Discard department changes?" description={`Your edits to “${name}” will be lost.`}
        confirmLabel="Discard changes" pending={pending}
        onConfirm={() => { setDiscardOpen(false); setOpen(false); setNextName(name); }} />
      <Dialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archive department"
        description={`Archive ${name}? This is allowed only when it has no active programs, faculty assignments, or courses.`}
        footer={
          <>
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
              disabled={pending}
              onClick={archive}
            >
              {pending
                ? "Archiving…"
                : "Archive department"}
            </Button>
          </>
        }
      >
        {archiveError ? <p role="alert" className="rounded border border-border p-3 text-sm text-error">{archiveError} <button type="button" disabled={pending} onClick={archive} className="font-semibold underline focus-visible:ring-2 focus-visible:ring-primary">Retry delete</button></p> : null}
        <p className="m-0 text-sm text-body">
          Existing dependencies are checked
          server-side immediately before the
          archive is applied.
        </p>
      </Dialog>
    </>
  );
}
