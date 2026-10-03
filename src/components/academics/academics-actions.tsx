"use client";

import Link from "next/link";
import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
  program,
}: {
  program: {
    id: string;
    name: string;
    code: string;
    durationTerms: number;
  };
}) {
  const [editOpen, setEditOpen] =
    useState(false);
  const [archiveOpen, setArchiveOpen] =
    useState(false);
  const [name, setName] =
    useState(program.name);
  const [code, setCode] =
    useState(program.code);
  const [durationTerms, setDurationTerms] =
    useState(String(program.durationTerms));
  const { pending, run } =
    useAcademicMutation();

  function openEdit() {
    setName(program.name);
    setCode(program.code);
    setDurationTerms(
      String(program.durationTerms),
    );
    setEditOpen(true);
  }

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={openEdit}
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setArchiveOpen(true)}
        >
          Archive
        </Button>
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit program"
        description="Department ownership is immutable; update the Program identity and duration here."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={
                pending ||
                !name.trim() ||
                !code.trim() ||
                !durationTerms
              }
              onClick={() =>
                run(
                  () =>
                    mutate(
                      `/api/academics/programs/${program.id}`,
                      "PATCH",
                      {
                        name,
                        code,
                        durationTerms:
                          Number(durationTerms),
                      },
                    ),
                  "Program updated",
                  () => setEditOpen(false),
                )
              }
            >
              {pending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-body">
              Program name
            </label>
            <Input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              maxLength={255}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-body">
              Code
            </label>
            <Input
              value={code}
              onChange={(event) =>
                setCode(event.target.value)
              }
              maxLength={64}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-body">
              Duration terms
            </label>
            <Input
              type="number"
              min={1}
              max={24}
              value={durationTerms}
              onChange={(event) =>
                setDurationTerms(
                  event.target.value,
                )
              }
            />
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={`Archive ${program.name}?`}
        description="Programs with non-archived Cohorts cannot be archived."
        confirmLabel="Archive program"
        pending={pending}
        onConfirm={() =>
          run(
            () =>
              mutate(
                `/api/academics/programs/${program.id}`,
                "DELETE",
              ),
            "Program archived",
            () => setArchiveOpen(false),
          )
        }
      />
    </>
  );
}

export function AcademicPeriodActions({
  period,
}: {
  period: {
    id: string;
    name: string;
    code: string;
    startDate: string;
    endDate: string;
    status: "PLANNED" | "ACTIVE" | "CLOSED";
  };
}) {
  const [editOpen, setEditOpen] =
    useState(false);
  const [closeOpen, setCloseOpen] =
    useState(false);
  const [name, setName] =
    useState(period.name);
  const [code, setCode] =
    useState(period.code);
  const [startDate, setStartDate] =
    useState(period.startDate);
  const [endDate, setEndDate] =
    useState(period.endDate);
  const { pending, run } =
    useAcademicMutation();

  function openEdit() {
    setName(period.name);
    setCode(period.code);
    setStartDate(period.startDate);
    setEndDate(period.endDate);
    setEditOpen(true);
  }

  if (period.status === "CLOSED") {
    return null;
  }

  return (
    <>
      <div className="flex justify-end gap-2">
        {period.status === "PLANNED" ? (
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={openEdit}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                run(
                  () =>
                    mutate(
                      `/api/academics/periods/${period.id}`,
                      "PATCH",
                      { action: "ACTIVATE" },
                    ),
                  "Academic period activated",
                )
              }
            >
              Activate
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setCloseOpen(true)}
          >
            Close
          </Button>
        )}
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit academic period"
        description="Periods are editable only while planned."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={
                pending ||
                !name.trim() ||
                !code.trim() ||
                !startDate ||
                !endDate
              }
              onClick={() =>
                run(
                  () =>
                    mutate(
                      `/api/academics/periods/${period.id}`,
                      "PATCH",
                      {
                        name,
                        code,
                        startDate,
                        endDate,
                      },
                    ),
                  "Academic period updated",
                  () => setEditOpen(false),
                )
              }
            >
              {pending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-body">
              Name
            </label>
            <Input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              maxLength={255}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-body">
              Code
            </label>
            <Input
              value={code}
              onChange={(event) =>
                setCode(event.target.value)
              }
              maxLength={64}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-body">
              Start date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(
                  event.target.value,
                )
              }
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-body">
              End date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
            />
          </div>
        </div>
      </Dialog>

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
                `/api/academics/periods/${period.id}`,
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
  cohort,
  periods,
}: {
  cohort: {
    id: string;
    name: string;
    code: string;
    expectedEndPeriodId: string | null;
    status:
      | "PLANNED"
      | "ACTIVE"
      | "COMPLETED"
      | "ARCHIVED";
  };
  periods: readonly {
    id: string;
    name: string;
    code: string;
  }[];
}) {
  const [editOpen, setEditOpen] =
    useState(false);
  const [confirmAction, setConfirmAction] =
    useState<"COMPLETE" | "ARCHIVE" | null>(
      null,
    );
  const [name, setName] =
    useState(cohort.name);
  const [code, setCode] =
    useState(cohort.code);
  const [endPeriodId, setEndPeriodId] =
    useState(
      cohort.expectedEndPeriodId ?? "",
    );
  const { pending, run } =
    useAcademicMutation();

  function openEdit() {
    setName(cohort.name);
    setCode(cohort.code);
    setEndPeriodId(
      cohort.expectedEndPeriodId ?? "",
    );
    setEditOpen(true);
  }

  if (cohort.status === "ARCHIVED") {
    return null;
  }

  return (
    <>
      <div className="flex justify-end gap-2">
        {cohort.status === "PLANNED" ? (
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={openEdit}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                run(
                  () =>
                    mutate(
                      `/api/academics/cohorts/${cohort.id}`,
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
          </>
        ) : cohort.status === "ACTIVE" ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setConfirmAction("COMPLETE")
            }
          >
            Complete
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setConfirmAction("ARCHIVE")
            }
          >
            Archive
          </Button>
        )}
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit planned cohort"
        description="The Program and start period are immutable after creation."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={
                pending ||
                !name.trim() ||
                !code.trim()
              }
              onClick={() =>
                run(
                  () =>
                    mutate(
                      `/api/academics/cohorts/${cohort.id}`,
                      "PATCH",
                      {
                        name,
                        code,
                        expectedEndPeriodId:
                          endPeriodId || null,
                      },
                    ),
                  "Cohort updated",
                  () => setEditOpen(false),
                )
              }
            >
              {pending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-body">
              Name
            </label>
            <Input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              maxLength={255}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-body">
              Code
            </label>
            <Input
              value={code}
              onChange={(event) =>
                setCode(event.target.value)
              }
              maxLength={64}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-body">
              Expected end period
            </label>
            <Select
              value={endPeriodId}
              onChange={(event) =>
                setEndPeriodId(
                  event.target.value,
                )
              }
            >
              <option value="">
                No expected end yet
              </option>
              {periods.map((period) => (
                <option
                  key={period.id}
                  value={period.id}
                >
                  {period.name} · {period.code}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        title={
          confirmAction === "COMPLETE"
            ? "Complete cohort?"
            : "Archive cohort?"
        }
        description={
          confirmAction === "COMPLETE"
            ? "The Cohort will stop accepting active progression changes."
            : "The Cohort will no longer be available for new academic operations."
        }
        confirmLabel={
          confirmAction === "COMPLETE"
            ? "Complete cohort"
            : "Archive cohort"
        }
        pending={pending}
        onConfirm={() => {
          if (!confirmAction) return;
          run(
            () =>
              mutate(
                `/api/academics/cohorts/${cohort.id}`,
                "PATCH",
                { action: confirmAction },
              ),
            confirmAction === "COMPLETE"
              ? "Cohort completed"
              : "Cohort archived",
            () => setConfirmAction(null),
          );
        }}
      />
    </>
  );
}

export function SectionActions({
  section,
  operationsHref,
}: {
  section: {
    id: string;
    name: string;
    code: string;
    capacity: number | null;
  };
  operationsHref: string;
}) {
  const [editOpen, setEditOpen] =
    useState(false);
  const [archiveOpen, setArchiveOpen] =
    useState(false);
  const [name, setName] =
    useState(section.name);
  const [code, setCode] =
    useState(section.code);
  const [capacity, setCapacity] =
    useState(
      section.capacity === null
        ? ""
        : String(section.capacity),
    );
  const { pending, run } =
    useAcademicMutation();

  function openEdit() {
    setName(section.name);
    setCode(section.code);
    setCapacity(
      section.capacity === null
        ? ""
        : String(section.capacity),
    );
    setEditOpen(true);
  }

  return (
    <>
      <div className="flex justify-end gap-2">
        <Link
          href={operationsHref}
          className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
        >
          Open
        </Link>
        <Button
          size="sm"
          variant="secondary"
          onClick={openEdit}
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setArchiveOpen(true)}
        >
          Archive
        </Button>
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit section"
        description="Cohort and Academic Period ownership are immutable."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={
                pending ||
                !name.trim() ||
                !code.trim()
              }
              onClick={() =>
                run(
                  () =>
                    mutate(
                      `/api/academics/sections/${section.id}`,
                      "PATCH",
                      {
                        name,
                        code,
                        capacity: capacity
                          ? Number(capacity)
                          : null,
                      },
                    ),
                  "Section updated",
                  () => setEditOpen(false),
                )
              }
            >
              {pending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-body">
              Name
            </label>
            <Input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              maxLength={255}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-body">
              Code
            </label>
            <Input
              value={code}
              onChange={(event) =>
                setCode(event.target.value)
              }
              maxLength={64}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-body">
              Capacity · blank for unlimited
            </label>
            <Input
              type="number"
              min={1}
              max={10000}
              value={capacity}
              onChange={(event) =>
                setCapacity(event.target.value)
              }
            />
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={`Archive ${section.name}?`}
        description="Historical roster and schedule records remain preserved."
        confirmLabel="Archive section"
        pending={pending}
        onConfirm={() =>
          run(
            () =>
              mutate(
                `/api/academics/sections/${section.id}`,
                "DELETE",
              ),
            "Section archived",
            () => setArchiveOpen(false),
          )
        }
      />
    </>
  );
}
