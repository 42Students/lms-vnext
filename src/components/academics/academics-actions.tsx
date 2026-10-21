"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Dropdown } from "@/components/ui/dropdown";
import { Menu, MenuItem } from "@/components/ui/menu";
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

let programArchiveInFlight = false;

class AcademicMutationResponseError extends Error {
  constructor(code: string, readonly fieldErrors: Readonly<Record<string, string>>) {
    super(code);
  }
}

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
    const fields: Record<string, string> = {};
    const candidate: unknown = payload?.fieldErrors;
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      for (const [key, value] of Object.entries(candidate)) {
        if (/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(key) && typeof value === "string") fields[key] = value;
      }
    }
    throw new AcademicMutationResponseError(
      typeof payload?.error === "string" ? payload.error : "REQUEST_FAILED",
      fields,
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
    onError?: (error: unknown) => void,
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
        onError?.(error);
        if (!onError || !(error instanceof AcademicMutationResponseError) ||
            Object.keys(error.fieldErrors).length === 0) {
          showToast({
            tone: "error",
            title: "Academic update failed",
            description: academicSetupErrorMessage(error),
          });
        }
      }
    });
  }

  return { pending, run };
}

function AcademicActionMenu({ children }: { children: ReactNode }) {
  return <Dropdown
    align="end" mobileSheet label="More actions"
    trigger={<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.75" /><circle cx="12" cy="12" r="1.75" /><circle cx="19" cy="12" r="1.75" /></svg>}
    triggerClassName="!min-h-11 !w-11 justify-center !p-0 md:!min-h-9 md:!w-9"
  ><Menu className="w-full min-w-0">{children}</Menu></Dropdown>;
}

function AcademicDialogFooter({ children }: { children: ReactNode }) {
  return <div className="min-w-0 flex w-full flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">{children}</div>;
}

export function ProgramActions({
  program,
  displayDurationYears = false,
  contents,
  departments = [],
  compactActions = false,
}: {
  program: {
    id: string;
    name: string;
    code: string;
    durationTerms: number;
    departmentId?: string;
  };
  displayDurationYears?: boolean;
  compactActions?: boolean;
  departments?: readonly {id:string;name:string}[];
  contents?: { semesters: number; batches: number; classes: number } | null;
}) {
  const blockingRecords = contents ?
    ([
      contents.semesters > 0 ? `${contents.semesters} semester${contents.semesters===1?"":"s"}` : null,
      contents.batches > 0 ? `${contents.batches} batch${contents.batches===1?"":"es"}` : null,
      contents.classes > 0 ? `${contents.classes} class${contents.classes===1?"":"es"}` : null,
    ].filter(Boolean)) : [];
  const programHasLinkedRecords = blockingRecords.length > 0;
  const archiveBlockerText = blockingRecords.length
    ? "Remove linked " + blockingRecords.join(", ") + " before archiving."
    : "Archive this program while retaining historical records.";
  const [editOpen, setEditOpen] =
    useState(false);
  const [archiveOpen, setArchiveOpen] =
    useState(false);
  const [editError, setEditError] = useState("");
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [archiveError, setArchiveError] = useState("");
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
    setEditError("");
    setEditFieldErrors({});
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
    if (departmentId !== (program.departmentId ?? "") || hasUnsavedCollegeProgramEdit(program, { name:name.trim(), code, durationTerms: displayDurationYears ? String(Number(durationTerms)*2) : durationTerms })) {
      setDiscardOpen(true);
    } else {
      setEditOpen(false);
    }
  }

  return (
    <>
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-[var(--lms-space-2)]">
        <Button size={compactActions ? "sm" : "md"} variant="secondary"
          aria-label={"Edit program " + program.name}
          onClick={openEdit} disabled={pending}>
          <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true" fill="none">
            <path d="M4 16l3.5-.7L16 6.8 13.2 4 4.7 12.5 4 16Z"
              stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="m12 5.2 2.8 2.8" stroke="currentColor" strokeWidth="1.6" />
          </svg> Edit
        </Button>
        <Button size={compactActions ? "sm" : "md"} variant="danger"
          disabled={pending || programHasLinkedRecords}
          aria-label={"Delete program " + program.name}
          title={archiveBlockerText}
          onClick={() => { setArchiveError(""); setArchiveOpen(true); }}>
          <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true" fill="none">
            <path d="M3 6h14M8 6V4h4v2m3 0-.8 11H5.8L5 6m3 3v5m4-5v5"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg> Delete
        </Button>
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={requestEditOpenChange}
        title={`Edit “${program.name}”`}
        description="You can change the department before any semesters, batches or learners are linked."
        className="!max-w-[520px]" dismissible={!pending}
        footer={
          <AcademicDialogFooter>
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
                  `Updated program “${name.trim()}”.`,
                  () => { setEditError(""); setEditOpen(false); },
                  (error) => {
                    setEditError(academicSetupErrorMessage(error, "Program was not updated"));
                    if (error instanceof AcademicMutationResponseError) {
                      const fields = error.fieldErrors;
                      setEditFieldErrors({
                        name: fields.name ?? fields.programName ?? fields.program_name ?? "",
                        code: fields.code ?? fields.programCode ?? fields.program_code ?? "",
                        durationTerms: fields.durationTerms ?? fields.duration_terms ?? "",
                        departmentId: fields.departmentId ?? fields.department_id ?? "",
                      });
                    }
                  },
                )
              }
            >
              {pending ? "Saving…" : "Save Changes"}
            </Button>
          </AcademicDialogFooter>
        }
      >
        <div className="grid min-w-0 gap-[var(--lms-space-4)]">
          {editError ? <div role="alert" className="flex items-start justify-between gap-3 rounded-[var(--lms-control-radius)] border border-error p-3 text-sm">
            <p><strong>Program was not updated</strong>: {editError}</p>
            <Button type="button" variant="secondary" disabled={pending}
              onClick={() => setEditError("")}>Dismiss</Button>
          </div> : null}
          {departments.length ? <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Department
            <Select value={departmentId} disabled={pending || programHasLinkedRecords}
              title={programHasLinkedRecords?"Department is fixed after semesters, batches or classes are linked.":undefined}
              aria-invalid={Boolean(editFieldErrors.departmentId)}
              onChange={event => {setDepartmentId(event.target.value);setEditFieldErrors(current=>({...current,departmentId:""}));}}>
              {departments.map(department=><option key={department.id} value={department.id}>{department.name}</option>)}
            </Select>
            {editFieldErrors.departmentId ? <span role="alert" className="text-xs text-error">{editFieldErrors.departmentId}</span> : null}
          </label> : null}
          <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Program Name
            <Input value={name} maxLength={255} disabled={pending}
              aria-invalid={Boolean(editFieldErrors.name)}
              onChange={event=>{setName(event.target.value);setEditFieldErrors(current=>({...current,name:""}));}}/>
            {editFieldErrors.name ? <span role="alert" className="text-xs text-error">{editFieldErrors.name}</span> : null}
          </label>
          <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            {displayDurationYears?"Duration (Years)":"Duration (Terms)"}
            <Input type="number" min={1} max={displayDurationYears?10:24} step={1}
              disabled={pending} value={durationTerms} aria-invalid={Boolean(editFieldErrors.durationTerms)}
              onChange={event=>{setDurationTerms(event.target.value);
                setEditFieldErrors(current=>({...current,durationTerms:""}));}}/>
            {editFieldErrors.durationTerms ? <span role="alert" className="text-xs text-error">{editFieldErrors.durationTerms}</span> : null}
          </label>
        </div>
      </Dialog>

      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Discard changes to this program?"
        description={`Unsaved changes to “${program.name}” will be lost.`}
        confirmLabel="Discard changes"
        pending={pending}
        onConfirm={() => {
          setDiscardOpen(false);
          setEditOpen(false);
        }}
      />

      {archiveError ? <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--lms-control-radius)] border border-error p-3 text-sm">
        <p><strong>Program was not archived</strong>: {archiveError}</p>
        <div className="flex gap-2">
          <Button variant="secondary" type="button" disabled={pending}
            onClick={() => { setArchiveError(""); setArchiveOpen(true); }}>Retry archive</Button>
          <Button variant="ghost" type="button" onClick={() => setArchiveError("")}>Dismiss</Button>
        </div>
      </div> : null}
      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={`Delete “${program.name}”?`}
        description="It has no semesters, batches or classes. Delete it? In this workspace, Delete safely archives this record and preserves historical records."
        confirmLabel="Delete"
        pending={pending}
        onConfirm={() =>
          run(
            async () => {
              if (programArchiveInFlight) throw new Error("Another program deletion is still in progress.");
              programArchiveInFlight = true;
              try {
                return await mutate(`/api/academics/programs/${program.id}`, "DELETE", {confirm:true});
              } finally {
                programArchiveInFlight = false;
              }
            },
            `Archived program “${program.name}”.`,
            () => { setArchiveError(""); setArchiveOpen(false); },
            (error) => { setArchiveOpen(false); setArchiveError(academicSetupErrorMessage(error, "Program was not archived")); },
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
      <div className="flex min-w-0 flex-wrap items-center justify-start gap-[var(--lms-space-2)] md:justify-end">
        {period.status === "PLANNED" ? (
          <>
            <Button
              size="md"
              variant="secondary"
              onClick={openEdit}
            >
              Edit
            </Button>
            <AcademicActionMenu><MenuItem disabled={pending}
                onClick={() => run(
                  () => mutate(`/api/academics/periods/${period.id}`, "PATCH", { action: "ACTIVATE" }),
                  "Academic period activated",
                )}
              >Activate</MenuItem></AcademicActionMenu>
          </>
        ) : (
          <Button
            size="md"
           
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
          <AcademicDialogFooter>
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
          </AcademicDialogFooter>
        }
      >
        <div className="grid min-w-0 gap-[var(--lms-space-4)] md:grid-cols-2">
          <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Name
            <Input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              maxLength={255}
            />
          </label>
          <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Code
            <Input
              value={code}
              onChange={(event) =>
                setCode(event.target.value)
              }
              maxLength={64}
            />
          </label>
          <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Start date
            <Input
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(
                  event.target.value,
                )
              }
            />
          </label>
          <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            End date
            <Input
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
            />
          </label>
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
  compactActions = false,
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
  compactActions?: boolean;
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
      {compactActions && cohort.status === "PLANNED" ? (
        <div className="flex min-w-0 justify-end">
          <Dropdown trigger="Actions" align="end" mobileSheet triggerClassName="md:!min-h-9">
            <Menu>
              <MenuItem disabled={pending} onClick={openEdit}>Edit</MenuItem>
              <MenuItem disabled={pending} onClick={() =>
                run(() => mutate("/api/academics/cohorts/" + cohort.id, "PATCH", { action: "ACTIVATE" }), "Cohort activated")
              }>Activate</MenuItem>
              <MenuItem disabled={pending} onClick={() => setConfirmAction("ARCHIVE")}>Archive</MenuItem>
            </Menu>
          </Dropdown>
        </div>
      ) : (
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
            <AcademicActionMenu>
              <MenuItem disabled={pending} onClick={() => run(
                () => mutate(`/api/academics/cohorts/${cohort.id}`, "PATCH", { action: "ACTIVATE" }),
                "Cohort activated",
              )}>Activate</MenuItem>
              <MenuItem onClick={() => setConfirmAction("ARCHIVE")}>Archive</MenuItem>
            </AcademicActionMenu>
          </>
        ) : cohort.status === "ACTIVE" ? (
          <Button
            size="md"
           
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
           
            variant="ghost"
            onClick={() =>
              setConfirmAction("ARCHIVE")
            }
          >
            Archive
          </Button>
        )}
      </div>
      )}

      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit planned cohort"
        description="The Program and start period are immutable after creation."
        footer={
          <AcademicDialogFooter>
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
          </AcademicDialogFooter>
        }
      >
        <div className="grid min-w-0 gap-[var(--lms-space-4)] md:grid-cols-2">
          <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Name
            <Input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              maxLength={255}
            />
          </label>
          <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Code
            <Input
              value={code}
              onChange={(event) =>
                setCode(event.target.value)
              }
              maxLength={64}
            />
          </label>
          <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:col-span-2">
            Expected end period
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
          </label>
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
  compactActions = false,
}: {
  section: {
    id: string;
    name: string;
    code: string;
    capacity: number | null;
  };
  operationsHref: string;
  compactActions?: boolean;
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
      {compactActions ? (
        <div className="flex min-w-0 flex-wrap items-center justify-start gap-[var(--lms-space-2)] sm:flex-nowrap sm:justify-end">
        <Link
          href={operationsHref}
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-[var(--lms-surface)] px-[var(--lms-space-3)] text-[14px] font-[650] text-[var(--lms-body-text)] transition-colors duration-[var(--lms-motion-fast)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
        >
          Open
        </Link>
          <Dropdown trigger="Actions" align="end" mobileSheet triggerClassName="md:!min-h-9">
            <Menu>
              <MenuItem disabled={pending} onClick={openEdit}>Edit</MenuItem>
              <MenuItem disabled={pending} onClick={() => setArchiveOpen(true)}>Archive</MenuItem>
            </Menu>
          </Dropdown>
        </div>
      ) : (
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-[var(--lms-space-2)]">
        <Link
          href={operationsHref}
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-[var(--lms-surface)] px-[var(--lms-space-3)] text-[14px] font-[650] text-[var(--lms-body-text)] transition-colors duration-[var(--lms-motion-fast)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
        >
          Open
        </Link>
        <AcademicActionMenu>
          <MenuItem onClick={openEdit}>Edit</MenuItem>
          <MenuItem onClick={() => setArchiveOpen(true)}>Archive</MenuItem>
        </AcademicActionMenu>
      </div>
      )}

      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit section"
        description="Cohort and Academic Period ownership are immutable."
        footer={
          <AcademicDialogFooter>
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
          </AcademicDialogFooter>
        }
      >
        <div className="grid min-w-0 gap-[var(--lms-space-4)] md:grid-cols-2">
          <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Name
            <Input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              maxLength={255}
            />
          </label>
          <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Code
            <Input
              value={code}
              onChange={(event) =>
                setCode(event.target.value)
              }
              maxLength={64}
            />
          </label>
          <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:col-span-2">
            Capacity · blank for unlimited
            <Input
              type="number"
              min={1}
              max={10000}
              value={capacity}
              onChange={(event) =>
                setCapacity(event.target.value)
              }
            />
          </label>
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
