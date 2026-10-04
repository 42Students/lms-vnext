"use client";

import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function DepartmentActions({
  departmentId,
  name,
}: {
  departmentId: string;
  name: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] =
    useState(false);
  const [nextName, setNextName] = useState(name);
  const [pending, startTransition] = useTransition();

  function rename() {
    startTransition(async () => {
      const response = await fetch(
        `/api/departments/${departmentId}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: nextName }),
        },
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast({
          tone: "error",
          title: "Rename failed",
          description:
            payload?.error === "DEPARTMENT_NAME_CONFLICT"
              ? "That department name is already active in this college."
              : "The department could not be renamed.",
        });
        return;
      }

      setOpen(false);
      showToast({
        tone: "success",
        title: "Department renamed",
      });
      router.refresh();
    });
  }

  function archive() {
    startTransition(async () => {
      const response = await fetch(
        `/api/departments/${departmentId}`,
        { method: "DELETE" },
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
        Rename
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={() => setArchiveOpen(true)}
      >
        Archive
      </Button>
      </div>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Rename department"
        description="Department names stay unique within the active college."
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
                !nextName.trim() ||
                nextName.trim() === name
              }
              onClick={rename}
            >
              {pending ? "Saving…" : "Save name"}
            </Button>
          </>
        }
      >
        <label
          htmlFor={`department-name-${departmentId}`}
          className="mb-1.5 block text-xs font-semibold text-body"
        >
          Department name
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
        <p className="m-0 text-sm text-body">
          Existing dependencies are checked
          server-side immediately before the
          archive is applied.
        </p>
      </Dialog>
    </>
  );
}
