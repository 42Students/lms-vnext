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
import { hasUnsavedCollegeProgramEdit, updateCollegeProgramSchema } from "@/modules/academics/college-program-mutation-model";
import { academicSetupErrorMessage } from "@/modules/academics/academic-setup-error-copy";

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
          description: academicSetupErrorMessage(error),
        });
      }
    });
  }

  return { pending, run };
}

export function ProgramActions({
  program,
  displayDurationYears = false,
  contents,
  departments = [],
}: {
  program: {
    id: string;
    name: string;
    code: string;
    durationTerms: number;
    departmentId?: string;
  };
  displayDurationYears?: boolean;
  departments?: readonly {id:string;name:string}[];
  contents?: { semesters: number; batches: number; classes: number } | null;
}) {
  const programHasLinkedRecords = Boolean(contents &&
    (contents.semesters > 0 || contents.batches > 0 || contents.classes > 0));
  const [editOpen, setEditOpen] =
    useState(false);
  const [archiveOpen, setArchiveOpen] =
    useState(false);
  const [discardOpen, setDiscardOpen] =
    useState(false);
  const [name, setName] =
    useState(program.name);
  const [code, setCode] =
    useState(program.code);
  const [departmentId, setDepartmentId] = useState(program.departmentId ?? "");
  const [durationTerms, setDurationTerms] =
    useState(String(displayDurationYears?program.durationTerms/2:program.durationTerms));
  const { pending, run } =
    useAcademicMutation();

  function openEdit() {
    setDepartmentId(program.departmentId ?? "");
    setName(program.name);
    setCode(program.code);
    setDurationTerms(
      String(displayDurationYears?program.durationTerms/2:program.durationTerms),
    );
    setDiscardOpen(false);
    setEditOpen(true);
  }

  function requestEditOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setEditOpen(true);
      return;
    }
    if (pending) return;
    if (departmentId !== (program.departmentId ?? "") || hasUnsavedCollegeProgramEdit(program, { name, code, durationTerms: displayDurationYears ? String(Number(durationTerms)*2) : durationTerms })) {
      setDiscardOpen(true);
    } else {
      setEditOpen(false);
    }
  }

  return (
    <>
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-[var(--lms-space-2)]">
        <Button
          size="md"
          className="min-h-11 md:min-h-[var(--lms-control-height)]"
          variant="secondary"
          onClick={openEdit}
        >
          Edit
        </Button>
        <Button
          size="md"
          className="min-h-11 md:min-h-[var(--lms-control-height)]"
          variant="ghost"
          disabled={programHasLinkedRecords}
          title={programHasLinkedRecords
            ? "Remove linked semesters, batches, classes before deleting."
            : "Archive this program"}
          onClick={() => setArchiveOpen(true)}
        >
          Archive
        </Button>
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={requestEditOpenChange}
        title="Edit program"
        description="You can change the department before any semesters, batches or learners are linked."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => requestEditOpenChange(false)}
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
                      updateCollegeProgramSchema.parse({
                        name,
                        code,
                        ...(departments.length ? {departmentId} : {}),
                        durationTerms: displayDurationYears ? Number(durationTerms)*2 : Number(durationTerms),
                      }),
                    ),
                  displayDurationYears ? `Updated program “${program.name}”.` : "Program updated",
                  () => setEditOpen(false),
                )
              }
            >
              {pending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid min-w-0 gap-[var(--lms-space-4)] md:grid-cols-2">
          {departments.length ? <label className="grid gap-1 text-sm font-semibold">Department
            <Select value={departmentId} onChange={event=>setDepartmentId(event.target.value)}>
              {departments.map(department=><option key={department.id} value={department.id}>{department.name}</option>)}
            </Select>
          </label> : null}
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-[13px] leading-4 font-semibold text-body">
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
            <label className="mb-1.5 block text-[13px] leading-4 font-semibold text-body">
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
            <label className="mb-1.5 block text-[13px] leading-4 font-semibold text-body">
              {displayDurationYears?"Duration (years)":"Duration terms"}
            </label>
            <Input
              type="number"
              min={1}
              max={displayDurationYears?10:24}
              step={1}
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
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Discard program changes?"
        description="You have unsaved program edits. Discarding them will not modify the program."
        confirmLabel="Discard changes"
        pending={pending}
        onConfirm={() => {
          setDiscardOpen(false);
          setEditOpen(false);
        }}
      />

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={`Archive ${program.name}?`}
        description="Archive removes the program from active directories. Any linked semester, cohort (including archived cohorts), or learner enrollment blocks archival. Confirm only if all dependencies have been cleared."
        confirmLabel="Archive program"
        pending={pending}
        onConfirm={() =>
          run(
            () =>
              mutate(
                `/api/academics/programs/${program.id}`,
                "DELETE",
                { confirm: true },
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
  const [reopenOpen, setReopenOpen] = useState(false);
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
    return <>
      <Button size="md" variant="secondary" onClick={() => setReopenOpen(true)}>
        Reopen
      </Button>
      <ConfirmDialog
        open={reopenOpen}
        onOpenChange={setReopenOpen}
        title="Reopen academic period?"
        description="Reopening allows additional academic operations for this period. Confirm before restoring active status."
        confirmLabel="Reopen period"
        pending={pending}
        onConfirm={() => run(
          () => mutate(`/api/academics/periods/${period.id}`, "PATCH",
            { action: "REOPEN", confirm: true }),
          "Academic period reopened",
          () => setReopenOpen(false),
        )}
      />
    </>;
  }

  return (
    <>
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-[var(--lms-space-2)]">
        {period.status === "PLANNED" ? (
          <>
            <Button
              size="md"
              variant="secondary"
              onClick={openEdit}
            >
              Edit
            </Button>
            <Button
              size="md"
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
            size="md"
            className="min-h-11 md:min-h-[var(--lms-control-height)]"
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
        <div className="grid min-w-0 gap-[var(--lms-space-4)] md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[13px] leading-4 font-semibold text-body">
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
            <label className="mb-1.5 block text-[13px] leading-4 font-semibold text-body">
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
            <label className="mb-1.5 block text-[13px] leading-4 font-semibold text-body">
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
            <label className="mb-1.5 block text-[13px] leading-4 font-semibold text-body">
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
        description="Closing blocks further scheduling and enrollment changes. Any active section or scheduled session blocks closure."
        confirmLabel="Close period"
        pending={pending}
        onConfirm={() =>
          run(
            () =>
              mutate(
                `/api/academics/periods/${period.id}`,
                "PATCH",
                { action: "CLOSE", confirm: true },
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
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-[var(--lms-space-2)]">
        {cohort.status === "PLANNED" ? (
          <>
            <Button
              size="md"
              variant="secondary"
              onClick={openEdit}
            >
              Edit
            </Button>
            <Button
              size="md"
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
              size="md"
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
            size="md"
            className="min-h-11 md:min-h-[var(--lms-control-height)]"
            variant="secondary"
            onClick={() =>
              setConfirmAction("COMPLETE")
            }
          >
            Complete
          </Button>
        ) : (
          <Button
            size="md"
            className="min-h-11 md:min-h-[var(--lms-control-height)]"
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
            <label className="mb-1.5 block text-[13px] leading-4 font-semibold text-body">
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
            <label className="mb-1.5 block text-[13px] leading-4 font-semibold text-body">
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
            <label className="mb-1.5 block text-[13px] leading-4 font-semibold text-body">
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
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-[var(--lms-space-2)]">
        <Link
          href={operationsHref}
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-[var(--lms-surface)] px-[var(--lms-space-3)] text-[14px] font-semibold text-[var(--lms-body-text)] transition-colors duration-[var(--lms-motion-fast)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-[var(--lms-control-height)]"
        >
          Open
        </Link>
        <Button
          size="md"
          className="min-h-11 md:min-h-[var(--lms-control-height)]"
          variant="secondary"
          onClick={openEdit}
        >
          Edit
        </Button>
        <Button
          size="md"
          className="min-h-11 md:min-h-[var(--lms-control-height)]"
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
        <div className="grid min-w-0 gap-[var(--lms-space-4)] md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[13px] leading-4 font-semibold text-body">
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
            <label className="mb-1.5 block text-[13px] leading-4 font-semibold text-body">
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
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-[13px] leading-4 font-semibold text-body">
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
