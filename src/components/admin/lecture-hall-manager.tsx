"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Banner } from "@/components/ui/banner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { LECTURE_HALL_COPY, ROOM_TYPE_LABELS } from "@/modules/academics/lecture-hall-copy";

function HallPlusIcon(){return <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;}
function HallEditIcon(){return <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16 4a2.8 2.8 0 0 1 4 4L9 19l-5 1 1-5L16 4Z"/></svg>;}
function HallArchiveIcon(){return <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="4" rx="1"/><path d="M6 8v12h12V8M10 12h4"/></svg>;}
export type HallRow = {
  id: string;
  name: string;
  capacity: number;
  roomType: string;
  description: string | null;
  status: string;
  departmentId: string | null;
  departmentName: string | null;
  upcomingClasses: number;
};

type Draft = {
  name: string;
  capacity: string;
  roomType: string;
  departmentId: string;
  description: string;
};

const EMPTY: Draft = {
  name: "",
  capacity: "50",
  roomType: "",
  departmentId: "",
  description: "",
};

function toDraft(hall: HallRow): Draft {
  return {
    name: hall.name,
    capacity: String(hall.capacity),
    roomType: hall.roomType,
    departmentId: hall.departmentId ?? "",
    description: hall.description ?? "",
  };
}

function errorText(payload: {
  error?: string;
  upcomingClasses?: number;
  issues?: { message?: string }[];
} | null, fallback = "Something went wrong. Please try again.") {
  switch (payload?.error) {
    case "HALL_NAME_TAKEN":
      return "Another active hall in this college already has that name.";
    case "HALL_IN_USE":
      return `It has ${payload.upcomingClasses ?? "some"} upcoming class(es). Reassign or cancel those scheduled classes before archiving.`;
    case "HALL_CAPACITY_CONFLICT":
      return "The new capacity is below the configured capacity of an upcoming scheduled class.";
    case "DEPARTMENT_NOT_FOUND":
      return "Department must belong to the same college as the lecture hall (and be active).";
    case "INVALID_REQUEST":
      return payload.issues?.[0]?.message ?? "Check the fields and try again.";
    default:
      return fallback;
  }
}

export function LectureHallManager({
  collegeId,
  halls,
  departments,
  emptyState,
  availabilityBase = "/college/lecture-halls",
}: {
  collegeId: string;
  halls: readonly HallRow[];
  departments: readonly { id: string; name: string }[];
  emptyState?: { title: string; description: string };
  availabilityBase?: "/college/lecture-halls" | "/admin/lecture-halls";
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const inFlightRef=useRef(false);
  const [editing, setEditing] = useState<HallRow | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [createDraft, setCreateDraft] = useState<Draft>(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const originalEditRef = useRef<string | null>(null);
  const [archiving, setArchiving] = useState<HallRow | null>(null);
  const [search,setSearch]=useState("");
  const normalizedSearch=search.trim().toLocaleLowerCase("en");
  const visibleHalls=normalizedSearch?halls.filter(hall=>
    [hall.name,hall.roomType,ROOM_TYPE_LABELS[hall.roomType],hall.departmentName??"",hall.description??""]
      .some(value=>value.toLocaleLowerCase("en").includes(normalizedSearch))):halls;
  function exportCsv(){
    const escape=(value:string|number|null|undefined)=>{
      const text=String(value??"");
      const guarded=/^[=+\-@\t\r]/.test(text)?"'"+text:text;
      return '"'+guarded.replace(/"/g,'""')+'"';
    };
    const csv=[["Name","Room Type","Capacity","Department","Description"].map(escape).join(","),
      ...visibleHalls.map(hall=>[hall.name,ROOM_TYPE_LABELS[hall.roomType]??hall.roomType,hall.capacity,hall.departmentName??"",hall.description??""].map(escape).join(","))].join("\r\n");
    const url=URL.createObjectURL(new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"}));
    const link=document.createElement("a");
    link.href=url;link.download="lecture-halls.csv";document.body.appendChild(link);link.click();link.remove();
    URL.revokeObjectURL(url);
  }

  function snapshot(value: Draft) {
    return JSON.stringify({
      ...value,
      name: value.name.trim(),
      description: value.description.trim(),
      departmentId: value.departmentId || "",
    });
  }

  function finishEdit() {
    setEditing(null);
    setDiscardOpen(false);
    originalEditRef.current = null;
  }

  function requestClose() {
    if (pending || inFlightRef.current) return;
    if (editing && originalEditRef.current !== snapshot(draft)) {
      setDiscardOpen(true);
      return;
    }
    finishEdit();
  }

  function open(target: HallRow) {
    const values = toDraft(target);
    originalEditRef.current = snapshot(values);
    setDraft(values);
    setFormError(null);
    setDiscardOpen(false);
    setEditing(target);
  }

  function save(isNew = false) {
    if (pending || inFlightRef.current || (!isNew && editing === null)) return;
    const values = isNew ? createDraft : draft;
    const setError = isNew ? setCreateError : setFormError;
    const capacity = Number(values.capacity);
    if (!collegeId) return setError("College is required.");
    if (!values.name.trim()) return setError("Please enter room name");
    if (values.name.trim().length > 255) return setError("Room name must be 255 characters or less");
    if (!values.roomType) return setError("Select a room type");
    if (!Number.isInteger(capacity)) return setError("Capacity must be a whole number.");
    if (capacity < 1) return setError("Capacity must be at least 1.");
    if (capacity > 1000) return setError("Capacity must be 1000 or less.");
    setError(null);

    inFlightRef.current=true;
    startTransition(async () => {
      try {
      const body = {
        name: values.name.trim(),
        capacity,
        roomType: values.roomType,
        description: values.description.trim() || null,
        departmentId: values.departmentId || null,
      };
      const response = await fetch(
        isNew ? "/api/lecture-halls" : `/api/lecture-halls/${(editing as HallRow).id}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(isNew ? { collegeId, ...body } : body),
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error === "HALL_NAME_TAKEN"
          ? `A lecture hall named "${values.name.trim()}" already exists in this college`
          : errorText(payload,isNew
            ? "Could not create the room. Try again."
            : "Could not save the room. Try again."));
        return;
      }

      if (isNew) setCreateDraft(EMPTY);
      else finishEdit();
      showToast({
        tone: "success",
        title: isNew ? LECTURE_HALL_COPY.createdMessage : LECTURE_HALL_COPY.updatedMessage,
      });
      router.refresh();
      } catch {
        setError(isNew ? "Could not create the room. Try again." : "Could not save the room. Try again.");
      } finally {inFlightRef.current=false;}
    });
  }

  function setStatus(hall: HallRow, status: "ARCHIVED" | "ACTIVE") {
    if(pending||inFlightRef.current)return;
    inFlightRef.current=true;
    startTransition(async () => {
      try {
      const response = await fetch(`/api/lecture-halls/${hall.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        showToast({
          tone: "error",
          title: status === "ARCHIVED" ? "Archive blocked" : "Restore failed",
          description: errorText(await response.json().catch(() => null),
            status === "ARCHIVED"
              ? "Could not archive the room. Try again."
              : "Could not restore the room. Try again."),
        });
        setArchiving(null);
        return;
      }

      setArchiving(null);
      showToast({
        tone: "success",
        title: status === "ARCHIVED" ? "Lecture hall archived" : "Lecture hall restored",
        description: status === "ARCHIVED" ? "Scheduled class history is preserved. This room can be restored." : undefined,
      });
      router.refresh();
      } catch {
        setArchiving(null);
        showToast({tone:"error",title:"Could not update hall status",description:"Check your connection and retry."});
      } finally {inFlightRef.current=false;}
    });
  }

  const field = "mb-[var(--lms-space-2)] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]";

  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-4)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section aria-labelledby="create-lecture-hall-heading" className="min-w-0 self-start rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-[var(--lms-canvas-padding)]">
          <h2 id="create-lecture-hall-heading" className="mb-[var(--lms-space-4)] text-base font-semibold text-foreground">{LECTURE_HALL_COPY.createTitle}</h2>
          <form className="space-y-[var(--lms-space-4)]" onSubmit={(event) => { event.preventDefault(); save(true); }}>
            {createError ? <Banner tone="error">{createError}</Banner> : null}
            <div>
              <label className={field} htmlFor="create-hall-dept">{LECTURE_HALL_COPY.departmentLabel}</label>
              <Select id="create-hall-dept" className="min-h-11 w-full md:min-h-9" value={createDraft.departmentId}
                onChange={(event) => setCreateDraft({ ...createDraft, departmentId: event.target.value })}>
                <option value="">{LECTURE_HALL_COPY.departmentPlaceholder}</option>
                {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
              </Select>
            </div>
            <div>
              <label className={field} htmlFor="create-hall-name">{LECTURE_HALL_COPY.nameLabel}</label>
              <Input id="create-hall-name" className="min-h-11 w-full md:min-h-9" maxLength={255} required
                aria-invalid={Boolean(createError?.startsWith("Please enter room name") || createError?.startsWith("Room name must"))}
                aria-describedby={createError?.startsWith("Please enter room name") || createError?.startsWith("Room name must") ? "create-hall-name-error" : undefined}
                placeholder={LECTURE_HALL_COPY.namePlaceholder} value={createDraft.name}
                onChange={(event) => setCreateDraft({ ...createDraft, name: event.target.value })}/>
              {createError?.startsWith("Please enter room name") || createError?.startsWith("Room name must") ?
                <p id="create-hall-name-error" role="alert" className="mt-1 text-xs text-error">{createError}</p> : null}
            </div>
            <div className="grid min-w-0 grid-cols-2 gap-3">
              <div>
                <label className={field} htmlFor="create-hall-type">{LECTURE_HALL_COPY.typeLabel}</label>
                <Select id="create-hall-type" required className="min-h-11 w-full md:min-h-9" value={createDraft.roomType}
                  onChange={(event) => setCreateDraft({ ...createDraft, roomType: event.target.value })}>
                  <option value="">{LECTURE_HALL_COPY.typePlaceholder}</option>
                  {Object.entries(ROOM_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              </div>
              <div>
                <label className={field} htmlFor="create-hall-capacity">{LECTURE_HALL_COPY.capacityLabel}</label>
                <Input id="create-hall-capacity" className="min-h-11 w-full md:min-h-9" type="number" min={1} max={1000} required
                  value={createDraft.capacity} onChange={(event) => setCreateDraft({ ...createDraft, capacity: event.target.value })}/>
              </div>
            </div>
            <div>
              <label className={field} htmlFor="create-hall-description">{LECTURE_HALL_COPY.descriptionLabel}</label>
              <Textarea id="create-hall-description" rows={2} className="w-full" maxLength={255}
                placeholder={LECTURE_HALL_COPY.descriptionPlaceholder} value={createDraft.description}
                onChange={(event) => setCreateDraft({ ...createDraft, description: event.target.value })}/>
            </div>
            <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto" loading={pending} disabled={pending}>
              <HallPlusIcon /> {LECTURE_HALL_COPY.createButton}
            </Button>
          </form>
        </section>
        <section aria-label="Existing Lecture Halls / Rooms" className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
          <h2 className="mb-[var(--lms-space-3)] text-base font-semibold text-foreground">Existing Lecture Halls / Rooms</h2>
      {visibleHalls.length === 0 ? (
        <EmptyState
          title={search?"No lecture halls match these filters.":emptyState?.title ?? "No lecture halls found."}
          description={emptyState?.description ?? "Add the rooms your college teaches in, so classes can be scheduled into them."}
        />
      ) : (
        <DataTable mobileMode="scroll" empty={<EmptyState title="No lecture halls" description="No records to show."/>}
          columns={[
            { key: "name", header: LECTURE_HALL_COPY.columns.name, mobilePriority: "primary", cell: (hall: HallRow) => <span className="block min-w-0 break-words font-semibold text-foreground">{hall.name}</span> },
            { key: "type", header: LECTURE_HALL_COPY.columns.type, cell: (hall) => ROOM_TYPE_LABELS[hall.roomType] ?? hall.roomType },
            { key: "capacity", header: "Capacity", className:"w-20", cell: (hall) => hall.capacity },
            { key: "dept", header: LECTURE_HALL_COPY.columns.department, cell: (hall) => hall.departmentName ?? "-" },
            { key:"description",header:"Description",cell:(hall)=>
               <span title={hall.description??undefined} className="block max-w-44 truncate">{hall.description??"—"}</span> },
            {
              key: "actions",
              header: "",
              mobilePriority: "action",
              className: "text-right",
              cell: (hall) => (
                <div className="flex min-w-0 flex-wrap items-center justify-start gap-[var(--lms-space-2)] print:hidden md:justify-end">
                  <Link href={`${availabilityBase}/${hall.id}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-[650] text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
                    Availability
                  </Link>
                  <Button type="button" variant="ghost" size="sm" disabled={pending}
                    aria-label={"Edit "+hall.name} title={"Edit "+hall.name}
                    onClick={()=>open(hall)} className="min-h-11 md:min-h-9"><HallEditIcon /></Button>
                  {hall.status==="ACTIVE"?<Button type="button" variant="ghost" size="sm"
                    aria-label={"Archive "+hall.name} title={"Archive "+hall.name}
                    disabled={pending} onClick={()=>setArchiving(hall)}
                    className="min-h-11 text-error md:min-h-9"><HallArchiveIcon /></Button>:<Button type="button" variant="ghost" size="sm" disabled={pending} aria-label={"Restore lecture hall "+hall.name} title={"Restore "+hall.name} onClick={()=>setStatus(hall,"ACTIVE")} className="min-h-11 md:min-h-9">Restore</Button>}
                </div>
              ),
            },
          ]}
          rows={visibleHalls}
          getRowKey={(hall) => hall.id}
        />
      )}
        </section>
      </div>

      <Dialog
        open={editing !== null}
        onOpenChange={(value) => { if (!value) requestClose(); }}
        dismissible={!pending}
        title="Edit Lecture Hall"
        description="Names must be unique among active halls in this college. Archived rooms retain historical scheduling references and may be restored when no active name conflicts exist."
        footer={
          <div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">
            <Button className="min-h-11 md:min-h-9" variant="secondary" disabled={pending} onClick={requestClose}>
              Cancel
            </Button>
            <Button className="min-h-11 md:min-h-9" loading={pending} disabled={pending} onClick={() => save()}>
              {pending ? "Saving…" : "Update"}
            </Button>
          </div>
        }
      >
        <div className="space-y-[var(--lms-space-4)]">
          {formError ? (
            <Banner tone="error">
              {formError}
            </Banner>
          ) : null}
          <div>
            <label className={field} htmlFor="hall-name">{LECTURE_HALL_COPY.nameLabel}</label>
            <Input className="min-h-11 md:min-h-9" id="hall-name" value={draft.name} maxLength={255} required
              aria-invalid={Boolean(formError?.startsWith("Please enter room name") || formError?.startsWith("Room name must"))}
              aria-describedby={formError?.startsWith("Please enter room name") || formError?.startsWith("Room name must") ? "edit-hall-name-error" : undefined}
              placeholder={LECTURE_HALL_COPY.namePlaceholder}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            {formError?.startsWith("Please enter room name") || formError?.startsWith("Room name must") ?
              <p id="edit-hall-name-error" role="alert" className="mt-1 text-xs text-error">{formError}</p> : null}
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-3">
            <div>
              <label className={field} htmlFor="hall-capacity">{LECTURE_HALL_COPY.capacityLabel}</label>
              <Input className="min-h-11 md:min-h-9" id="hall-capacity" type="number" min={1} max={1000} required value={draft.capacity}
                onChange={(e) => setDraft({ ...draft, capacity: e.target.value })} />
            </div>
            <div>
              <label className={field} htmlFor="hall-type">{LECTURE_HALL_COPY.typeLabel}</label>
              <Select className="min-h-11 md:min-h-9" id="hall-type" required value={draft.roomType}
                onChange={(e) => setDraft({ ...draft, roomType: e.target.value })}>
                <option value="">{LECTURE_HALL_COPY.typePlaceholder}</option>
                {Object.entries(ROOM_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className={field} htmlFor="hall-dept">{LECTURE_HALL_COPY.departmentLabel}</label>
            <Select className="min-h-11 md:min-h-9" id="hall-dept" value={draft.departmentId}
              onChange={(e) => setDraft({ ...draft, departmentId: e.target.value })}>
              <option value="">{LECTURE_HALL_COPY.departmentPlaceholder}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className={field} htmlFor="hall-desc">{LECTURE_HALL_COPY.descriptionLabel}</label>
            <Textarea rows={2} className="w-full" id="hall-desc" value={draft.description} maxLength={255} placeholder={LECTURE_HALL_COPY.descriptionPlaceholder}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={discardOpen}
        onOpenChange={(value) => { if (!value) setDiscardOpen(false); }}
        title={`Discard edits to “${editing?.name ?? "this lecture hall"}”?`}
        description="Your unsaved changes will be lost."
        confirmLabel="Discard edits"
        onConfirm={finishEdit}
      />

      <ConfirmDialog
        open={archiving !== null}
        onOpenChange={(value) => !value && !pending && setArchiving(null)}
        title="Archive this room?"
        description={`A room with scheduled class sessions cannot be archived until they move to another room. ${archiving?.name ?? "This room"} will be archived, not deleted permanently. Past class history is preserved.`}
        confirmLabel="Archive hall" confirmVariant="danger"
        pending={pending}
        onConfirm={() => archiving && setStatus(archiving, "ARCHIVED")}
      />
    </div>
  );
}
