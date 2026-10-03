"use client";

import Link from "next/link";
import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

async function mutate(
  path: string,
  method: "PATCH" | "DELETE",
  body?: unknown,
) {
  const response = await fetch(path, {
    method,
    headers:
      body === undefined
        ? undefined
        : { "content-type": "application/json" },
    body:
      body === undefined
        ? undefined
        : JSON.stringify(body),
  });
  const payload = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.error ?? "REQUEST_FAILED",
    );
  }

  return payload;
}

function useAcademicMutation() {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] =
    useTransition();

  function run(
    task: () => Promise<unknown>,
    title: string,
    onSuccess?: () => void,
  ) {
    startTransition(async () => {
      try {
        await task();
        onSuccess?.();
        showToast({
          tone: "success",
          title,
        });
        router.refresh();
      } catch (error) {
        showToast({
          tone: "error",
          title: "Academic update failed",
          description:
            error instanceof Error
              ? error.message
              : "The request could not be completed.",
        });
      }
    });
  }

  return { pending, run };
}

export function ProgramActions({
  programId,
  name,
}: {
  programId: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const { pending, run } =
    useAcademicMutation();

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setOpen(true)}
      >
        Archive
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Archive ${name}?`}
        description="Programs with non-archived Cohorts cannot be archived."
        confirmLabel="Archive program"
        pending={pending}
        onConfirm={() =>
          run(
            () =>
              mutate(
                `/api/academics/programs/${programId}`,
                "DELETE",
              ),
            "Program archived",
            () => setOpen(false),
          )
        }
      />
    </>
  );
}

export function AcademicPeriodActions({
  periodId,
  status,
}: {
  periodId: string;
  status: "PLANNED" | "ACTIVE" | "CLOSED";
}) {
  const [closeOpen, setCloseOpen] =
    useState(false);
  const { pending, run } =
    useAcademicMutation();

  if (status === "CLOSED") {
    return null;
  }

  if (status === "PLANNED") {
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() =>
          run(
            () =>
              mutate(
                `/api/academics/periods/${periodId}`,
                "PATCH",
                { action: "ACTIVATE" },
              ),
            "Academic period activated",
          )
        }
      >
        {pending ? "Working…" : "Activate"}
      </Button>
    );
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setCloseOpen(true)}
      >
        Close
      </Button>
      <ConfirmDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title="Close academic period?"
        description="Closed periods are terminal in the current Academics lifecycle."
        confirmLabel="Close period"
        pending={pending}
        onConfirm={() =>
          run(
            () =>
              mutate(
                `/api/academics/periods/${periodId}`,
                "PATCH",
                { action: "CLOSE" },
              ),
            "Academic period closed",
            () => setCloseOpen(false),
          )
        }
      />
    </>
  );
}

export function CohortActions({
  cohortId,
  status,
}: {
  cohortId: string;
  status:
    | "PLANNED"
    | "ACTIVE"
    | "COMPLETED"
    | "ARCHIVED";
}) {
  const [confirmAction, setConfirmAction] =
    useState<"COMPLETE" | "ARCHIVE" | null>(
      null,
    );
  const { pending, run } =
    useAcademicMutation();

  if (status === "ARCHIVED") {
    return null;
  }

  if (status === "PLANNED") {
    return (
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            run(
              () =>
                mutate(
                  `/api/academics/cohorts/${cohortId}`,
                  "PATCH",
                  { action: "ACTIVATE" },
                ),
              "Cohort activated",
            )
          }
        >
          Activate
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            setConfirmAction("ARCHIVE")
          }
        >
          Archive
        </Button>
        <ConfirmDialog
          open={confirmAction === "ARCHIVE"}
          onOpenChange={(open) =>
            setConfirmAction(
              open ? "ARCHIVE" : null,
            )
          }
          title="Archive planned cohort?"
          description="The Cohort will no longer be available for new academic operations."
          confirmLabel="Archive cohort"
          pending={pending}
          onConfirm={() =>
            run(
              () =>
                mutate(
                  `/api/academics/cohorts/${cohortId}`,
                  "PATCH",
                  { action: "ARCHIVE" },
                ),
              "Cohort archived",
              () => setConfirmAction(null),
            )
          }
        />
      </div>
    );
  }

  if (status === "ACTIVE") {
    return (
      <>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            setConfirmAction("COMPLETE")
          }
        >
          Complete
        </Button>
        <ConfirmDialog
          open={confirmAction === "COMPLETE"}
          onOpenChange={(open) =>
            setConfirmAction(
              open ? "COMPLETE" : null,
            )
          }
          title="Complete cohort?"
          description="The Cohort will stop accepting active progression changes."
          confirmLabel="Complete cohort"
          pending={pending}
          onConfirm={() =>
            run(
              () =>
                mutate(
                  `/api/academics/cohorts/${cohortId}`,
                  "PATCH",
                  { action: "COMPLETE" },
                ),
              "Cohort completed",
              () => setConfirmAction(null),
            )
          }
        />
      </>
    );
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() =>
          setConfirmAction("ARCHIVE")
        }
      >
        Archive
      </Button>
      <ConfirmDialog
        open={confirmAction === "ARCHIVE"}
        onOpenChange={(open) =>
          setConfirmAction(
            open ? "ARCHIVE" : null,
          )
        }
        title="Archive completed cohort?"
        confirmLabel="Archive cohort"
        pending={pending}
        onConfirm={() =>
          run(
            () =>
              mutate(
                `/api/academics/cohorts/${cohortId}`,
                "PATCH",
                { action: "ARCHIVE" },
              ),
            "Cohort archived",
            () => setConfirmAction(null),
          )
        }
      />
    </>
  );
}

export function SectionActions({
  sectionId,
  name,
  operationsHref,
}: {
  sectionId: string;
  name: string;
  operationsHref: string;
}) {
  const [open, setOpen] = useState(false);
  const { pending, run } =
    useAcademicMutation();

  return (
    <div className="flex justify-end gap-2">
      <Link
        href={operationsHref}
        className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
      >
        Open
      </Link>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setOpen(true)}
      >
        Archive
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Archive ${name}?`}
        description="Historical roster and schedule records remain preserved."
        confirmLabel="Archive section"
        pending={pending}
        onConfirm={() =>
          run(
            () =>
              mutate(
                `/api/academics/sections/${sectionId}`,
                "DELETE",
              ),
            "Section archived",
            () => setOpen(false),
          )
        }
      />
    </div>
  );
}
