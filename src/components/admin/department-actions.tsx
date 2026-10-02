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

  return (
    <>
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
    </>
  );
}
