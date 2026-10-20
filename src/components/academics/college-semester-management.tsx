"use client";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/selection-controls";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-fetch";
import {Dialog} from "@/components/ui/dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { Menu, MenuItem } from "@/components/ui/menu";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {
  createCollegeSemesterSchema,
  updateCollegeSemesterSchema,
} from "@/modules/academics/semester-mutation-model";
import { SEMESTER_COPY } from "@/modules/academics/semester-copy";
import { academicSetupErrorMessage } from "@/modules/academics/academic-setup-error-copy";

type ProgramOption = { id: string; name: string; code: string };
type SemesterRow = {
  id: string;
  name: string;
  termNumber: number;
  programName: string;
  totalCredits: number | null;
  isActive: boolean;
  updatedAt: Date;
  mappedCourses: number;
};

async function mutate(method: "POST" | "PATCH" | "DELETE", url: string, body: unknown) {
  return apiFetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function CollegeSemesterCreateForm({ programs }: { programs: ProgramOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [termNumber, setTermNumber] = useState("1");
  const [name, setName] = useState("");
  const [notice, setNotice] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(pending)return;
    setNotice("");
    const parsed = createCollegeSemesterSchema.safeParse({
      programId, termNumber: Number(termNumber), name,
      totalCredits: null,
    });
    if (!parsed.success) {
      setNotice(parsed.error.issues[0]?.message ?? "Check semester details.");
      return;
    }
    startTransition(async () => {
      try {
        await mutate("POST", "/api/academics/semesters", parsed.data);
        setName("");
        setNotice(SEMESTER_COPY.createdMessage(parsed.data.name));
        router.refresh();
      } catch (error) {
        setNotice(academicSetupErrorMessage(error, SEMESTER_COPY.createFailed));
      }
    });
  }

  return (
    <details aria-label={SEMESTER_COPY.createTitle} className="group min-w-0 border-b border-border pb-4">
      <summary className="flex min-h-11 cursor-pointer list-none items-center font-semibold text-primary-text marker:hidden [&::-webkit-details-marker]:hidden md:min-h-9">{SEMESTER_COPY.createTitle}</summary>
      {programs.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Create a program before adding semesters.</p>
      ) : (
        <form onSubmit={submit} className="mt-[var(--lms-space-3)] grid min-w-0 grid-cols-1 items-start gap-[var(--lms-space-3)] md:grid-cols-2">
          <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            {SEMESTER_COPY.programLabel}
            <Select required value={programId} onChange={e => setProgramId(e.target.value)}
              className="min-h-11 md:min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
              {programs.map(program => <option key={program.id} value={program.id}>
                {program.name} ({program.code})
              </option>)}
            </Select>
          </label>
          <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            {SEMESTER_COPY.numberLabel}
            <Input required type="number" min={1} max={12} step={1} value={termNumber} placeholder={SEMESTER_COPY.numberPlaceholder}
              onChange={e => setTermNumber(e.target.value)}
              className="min-h-11 md:min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground" />
          </label>
          <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            {SEMESTER_COPY.nameLabel}
            <Input required maxLength={255} value={name} onChange={e => setName(e.target.value)} placeholder={SEMESTER_COPY.namePlaceholder}
              className="min-h-11 md:min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground" />
          </label>
          <p className="border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] text-xs text-body md:col-span-2">
            Total credits are calculated from courses mapped to this semester.
          </p>
          <div className="flex items-end justify-stretch md:col-span-2 md:justify-end">
            <Button variant="primary" type="submit" disabled={pending} className="min-h-11 w-full md:min-h-9 md:w-auto">
              {pending ? "Saving…" : SEMESTER_COPY.createButton}
            </Button>
          </div>
        </form>
      )}
      {notice ? <p role="status" className="mt-3 text-sm text-body">{notice}</p> : null}
    </details>
  );
}

export function CollegeSemesterRowActions({ row }: { row: SemesterRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [discardOpen,setDiscardOpen]=useState(false);
  const [name, setName] = useState(row.name);
  const [isActive, setIsActive] = useState(row.isActive);
  const [notice, setNotice] = useState("");
  const url = "/api/academics/semesters/" + encodeURIComponent(row.id);
  const changed=name!==row.name||isActive!==row.isActive;
  function closeEditor(){
    if(pending)return;
    if(changed){setDiscardOpen(true);return;}
    setEditing(false);
  }
  function discardEditor(){
    setName(row.name);setIsActive(row.isActive);setDiscardOpen(false);setEditing(false);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(pending)return;
    setNotice("");
    const parsed = updateCollegeSemesterSchema.safeParse({
      name, totalCredits: null, isActive,
      expectedUpdatedAt:row.updatedAt.toISOString(),confirm:true,
    });
    if (!parsed.success) {
      setNotice(parsed.error.issues[0]?.message ?? "Check semester details.");
      return;
    }

    startTransition(async () => {
      try {
        await mutate("PATCH", url, parsed.data);
        setEditing(false);
        setNotice(SEMESTER_COPY.updatedMessage);
        router.refresh();
      } catch (error) {
        setNotice(academicSetupErrorMessage(error, SEMESTER_COPY.updateFailed));
      }
    });
  }

  function remove() {
    if(pending)return;
    setNotice("");
    startTransition(async () => {
      try {
        await mutate("DELETE", url, { confirm: true });
        setConfirming(false);
        setNotice(SEMESTER_COPY.deletedMessage);
        router.refresh();
      } catch (error) {
        setNotice(academicSetupErrorMessage(error, SEMESTER_COPY.deleteFailed));
      }
    });
  }

  return (
    <div className="min-w-0 space-y-[var(--lms-space-2)]">
      {!editing && !confirming ? (
        <div className="flex min-w-0 flex-wrap items-center justify-start gap-[var(--lms-space-2)] sm:justify-end">
          <Button variant="secondary" type="button" disabled={pending} onClick={() => { setNotice(""); setName(row.name);setIsActive(row.isActive);setEditing(true); }}
            >
            Edit
          </Button>
          <Dropdown trigger="More" label="Semester actions" align="end" mobileSheet triggerClassName="md:!min-h-9">
            <Menu className="w-full min-w-0">
              <MenuItem disabled={pending} onClick={() => { setNotice(""); setConfirming(true); }}>Delete</MenuItem>
            </Menu>
          </Dropdown>
        </div>
      ) : null}
      {editing ? (
        <Dialog open={editing} onOpenChange={next=>{if(!next)closeEditor();}}
          title={SEMESTER_COPY.editTitle}
          description={SEMESTER_COPY.promotionNote}>
        <form onSubmit={save} className="grid min-w-0 gap-[var(--lms-space-4)]">
          
          
          <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            {SEMESTER_COPY.nameLabel}
            <Input required maxLength={255} value={name} onChange={e => setName(e.target.value)}
              className="min-h-11 md:min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-2 text-sm text-foreground" />
          </label>
          <p className="text-xs text-body">Credits come from mapped courses and cannot be edited here.</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-body">
            <Switch label={SEMESTER_COPY.statusLabel} checked={isActive}
              disabled={pending} onChange={e => setIsActive(e.target.checked)} />
            <span role="status">{isActive ? SEMESTER_COPY.statusActive : SEMESTER_COPY.statusInactive}</span>
          </div>
          <div className="flex flex-col-reverse gap-[var(--lms-space-2)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">
            <Button variant="secondary" type="button" disabled={pending} onClick={closeEditor}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={pending}>
              {pending ? "Saving…" : SEMESTER_COPY.saveButton}
            </Button>
          </div>
        </form>
        </Dialog>
      ) : null}
      <ConfirmDialog open={confirming} onOpenChange={setConfirming}
        title={SEMESTER_COPY.deleteTitle}
        description={SEMESTER_COPY.deleteBlocked}
        confirmLabel="Confirm delete" confirmVariant="danger" pending={pending}
        confirmDisabled={row.mappedCourses>0} onConfirm={remove}/>
      <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen}
        title="Discard semester changes?"
        description="Unsaved semester name and status changes will be lost."
        confirmLabel="Discard changes" confirmVariant="danger" pending={pending} onConfirm={discardEditor}/>
      {notice ? <p role="status" className="text-xs text-body">{notice}</p> : null}
    </div>
  );
}
