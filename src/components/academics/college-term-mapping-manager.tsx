"use client";

import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { DataTable } from "@/components/ui/data-table";
import { Disclosure } from "@/components/ui/disclosure";
import { Dialog } from "@/components/ui/dialog";
import { TERM_MAPPING_COPY, collegeTermCourseAddSchema, collegeTermCourseUpdateSchema, collegeTermMappingErrorMessage } from "@/modules/academics/college-term-mapping-model";

type MappingRead = {
  terms: readonly { id: string; name: string; termNumber: number; programId: string; programName: string; departmentId: string; isActive: boolean }[];
  courses: readonly { id: string; name: string; code: string; departmentId: string }[];
  mapped: readonly {
    id: string; termId: string; courseId: string; termName: string; termNumber: number; programName: string;
    courseName: string; courseCode: string; type: string; credits: number | null; displayOrder: number; staffingWarning: string | null; staffingTooltip?: string | null;
  }[];
};

export function CollegeTermMappingManager({ data }: { data: MappingRead }) {
  const router = useRouter();
  const pathname=usePathname();
  const programsHref=pathname.startsWith("/admin")?"/admin/programs":"/college/programs";
  const { showToast } = useToast();
  const [pending, start] = useTransition();
  const inFlight=useRef(false);
  const [programId, setProgramId] = useState("");
  const [termId, setTermId] = useState("");
  const [draftByTerm, setDraftByTerm] = useState<Record<string, string[]>>({});
  const [confirm, setConfirm] = useState<{ type: "ADD"; body: unknown } | { type: "REMOVE"; id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; credits: string; position: string } | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [courseType, setCourseType] = useState<"CORE" | "ELECTIVE">("CORE");
  const [switchDraft, setSwitchDraft] = useState<{ kind: "program" | "term"; value: string } | null>(null);
  const [discardEdit, setDiscardEdit] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ program?: string; term?: string; courses?: string; credits?: string }>({});

  function applyScopeChange(kind: "program" | "term", value: string) {
    setFieldErrors({}); setError(null); setNotice(null); setEditing(null);
    if (kind === "program") { setProgramId(value); setTermId(""); }
    else setTermId(value);
  }

  function requestScopeChange(kind: "program" | "term", value: string) {
    if (selectedIds.length) setSwitchDraft({ kind, value });
    else applyScopeChange(kind, value);
  }

  function cancelEditing() {
    if (!editing) return;
    const original = data.mapped.find(item => item.id === editing.id);
    const originalPosition = original
      ? orderedPeers(original).findIndex(item => item.id === original.id) + 1 : 0;
    if (original && (editing.credits !== String(original.credits ?? 3) ||
      editing.position !== String(originalPosition))) {
      setDiscardEdit(true);
      return;
    }
    setEditing(null);
  }

  async function send() {
    if (!confirm || inFlight.current) return;
    inFlight.current=true;
    start(async () => {
      try {
        const create = confirm.type === "ADD";
        const url = create ? "/api/academics/semester-course-mappings" :
          "/api/academics/semester-course-mappings/" + encodeURIComponent(confirm.id);
        await apiFetch(url, {
          method: create ? "POST" : "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(create ? confirm.body : { confirm: true }),
        });
        const removedCourse = confirm.type === "REMOVE"
          ? data.mapped.find(row => row.id === confirm.id)?.courseName ?? "course" : null;
        const addedCount = confirm.type === "ADD"
          ? ((confirm.body as { mappings?: unknown[] }).mappings?.length ?? 1) : 0;
        const message = removedCourse === null
          ? TERM_MAPPING_COPY.addedMessage(addedCount) : TERM_MAPPING_COPY.removedMessage(removedCourse);
        showToast({ tone: "success", title: message });
        setNotice(null);
        setConfirm(null);
        setError(null);
        if (confirm.type === "ADD") setDraftByTerm(current => ({ ...current, [termId]: [] }));
        router.refresh();
      } catch (cause) {
        const message = cause instanceof FriendlyFetchError && cause.code
          ? collegeTermMappingErrorMessage(cause.code)
          : confirm.type === "ADD"
            ? "Failed to add courses to this semester."
            : "Could not remove the course from this semester.";
        if (cause instanceof FriendlyFetchError && cause.code === "TERM_NOT_FOUND") {
          setFieldErrors({ term: "Select a semester" });
        } else if (cause instanceof FriendlyFetchError && cause.code === "COURSE_NOT_FOUND") {
          setFieldErrors({ courses: "Select at least one course." });
        }
        setError(message);
        showToast({ tone: "error", title: message });
      }finally{
        inFlight.current=false;
      }
    });
  }

  // Legacy permits viewing historical semesters, but inactive semesters remain read-only.
  const termChoices = data.terms.filter(term => term.programId === programId);
  const selectedIds = draftByTerm[termId] ?? [];
  const mappedIds = new Set(data.mapped.filter(item => item.termId === termId).map(item => item.courseId));
  const selectedTerm = data.terms.find(term => term.id === termId);
  // Back-end scope validates college ownership, not same-department membership.
  const availableCourses = data.courses.filter(course => selectedTerm && !mappedIds.has(course.id));
  const editableTerm = selectedTerm?.isActive === true;
  const currentMappings = data.mapped.filter(item => item.termId === termId);
  const editingRow = data.mapped.find(item => item.id === editing?.id);

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!programId || !termId) {
      setFieldErrors({ program: !programId ? "Select a program" : undefined,
        term: !termId ? "Select a semester" : undefined });
      return;
    }
    if (!editableTerm || error) {
      setError("Load the selected semester before adding courses.");
      return;
    }
    const inputs = selectedIds.map(courseId => collegeTermCourseAddSchema.safeParse({
      programTermId: termId, courseId, type: courseType, credits: 3,
    }));
    if (!inputs.length || inputs.some(item => !item.success)) {
      setFieldErrors({ courses: "Select at least one course." });
      setError("Select at least one course.");
      return;
    }
    setFieldErrors({}); setError(null); setNotice(null);
    setConfirm({ type: "ADD", body: { mappings: inputs.flatMap(item => item.success ? [item.data] : []) } });
  }

  function updateMapping(id: string, creditsValue: string, position: number) {
    if(inFlight.current)return;
    const parsed = collegeTermCourseUpdateSchema.safeParse({
      credits: creditsValue.trim() === "" ? 3 : Number(creditsValue), position,
    });
    if (!parsed.success) {
      setFieldErrors({ credits: "Enter credits" });
      setError(parsed.error.issues[0]?.message ?? "Course mapping was not updated");
      return;
    }
    setError(null); setFieldErrors({});
    inFlight.current=true;
    start(async () => {
      try {
        await apiFetch("/api/academics/semester-course-mappings/" + encodeURIComponent(id), {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const previous = data.mapped.find(row => row.id === id);
        const oldPosition = previous ? orderedPeers(previous).findIndex(row => row.id === id) + 1 : position;
        const message = oldPosition === position
          ? `Updated mapping for “${previous?.courseName ?? "course"}”.`
          : "Semester course order saved.";
        showToast({ tone: "success", title: message });
        setNotice(null);
        setEditing(null);
        router.refresh();
      } catch (cause) {
        const previous = data.mapped.find(row => row.id === id);
        const wasReorder = previous
          ? orderedPeers(previous).findIndex(row => row.id === id) + 1 !== position : false;
        const message = wasReorder
          ? "Could not save order; previous order restored."
          : cause instanceof FriendlyFetchError && cause.code
            ? collegeTermMappingErrorMessage(cause.code)
            : "Course mapping was not updated";
        setError(message);
        showToast({ tone: "error", title: message });
      }finally{
        inFlight.current=false;
      }
    });
  }
  function orderedPeers(row: MappingRead["mapped"][number]) {
    return data.mapped
      .filter(peer => peer.termName === row.termName && peer.programName === row.programName && peer.termNumber === row.termNumber)
      .slice().sort((a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id));
  }

  return <section className="min-w-0 space-y-4 border-t border-border pt-4">
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,10fr)_minmax(0,14fr)]">
    <section className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
    <h2 className="text-lg font-semibold text-foreground">Assign Courses to Semester</h2>
    {!data.terms.length?<Alert tone="info">No programs found. <Link href={programsHref}
      className="font-semibold text-primary-text underline">Go to Programs</Link></Alert>:null}
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-body">Manage the courses assigned to each numbered semester.</p>

    </div>
    <p className="text-xs text-muted-foreground">Drag a course to reorder, or use the Move up and Move down buttons for keyboard access.</p>
    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
      <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program
        <Select required disabled={pending} value={programId} onChange={event => {
          requestScopeChange("program", event.target.value);
        }} className="min-h-11 w-full md:min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-2 text-foreground">
          <option value="">Select program</option>
          {Array.from(new Map(data.terms.map(t => [t.programId, t.programName])).entries()).map(
            ([id, name]) => <option key={id} value={id}>{name}</option>)}
        </Select>
        {fieldErrors.program ? <span role="alert" className="text-xs text-[var(--lms-error)]">{fieldErrors.program}</span> : null}
      </label>
      <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Semester
        <Select required disabled={pending||!programId} value={termId} onChange={event => {
          requestScopeChange("term", event.target.value);
        }} className="min-h-11 md:min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-2 text-foreground">
          <option value="">Select semester</option>
          {termChoices.map(t => <option key={t.id} value={t.id}>{t.name||"Semester "+t.termNumber}{t.isActive ? "" : " — Archived"}</option>)}
        </Select>
        {fieldErrors.term ? <span role="alert" className="text-xs text-[var(--lms-error)]">{fieldErrors.term}</span> : null}
      </label>
</div>
    {termId && editableTerm ? <Disclosure title="Add courses" className="min-w-0 border-y border-border py-2" contentClassName="pt-3">
      <form onSubmit={prepare} className="grid min-w-0 gap-3">
      <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Courses to Add
        <Select multiple size={8} value={selectedIds}
          disabled={!editableTerm || pending} onChange={event => {
            setFieldErrors(current => ({ ...current, courses: undefined }));
            setError(null);
            setDraftByTerm(current => ({
              ...current, [termId]: Array.from(event.target.selectedOptions).map(option => option.value),
            }));
          }} className="min-h-40 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-2 text-foreground">
          {availableCourses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
        </Select>
        <span className="text-xs font-normal text-muted-foreground">
          Choose multiple courses; already-mapped courses are excluded. Selection is retained per semester.
        </span>
        {fieldErrors.courses ? <span role="alert" className="text-xs text-[var(--lms-error)]">{fieldErrors.courses}</span> : null}
      </label>
      <label className="grid min-w-0 gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">Course Type
        <Select value={courseType} onChange={event => setCourseType(event.target.value as "CORE" | "ELECTIVE")}
          className="min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-2 text-foreground md:min-h-[var(--lms-control-height)]">
          <option value="CORE">{TERM_MAPPING_COPY.core}</option>
          <option value="ELECTIVE">{TERM_MAPPING_COPY.elective}</option>
        </Select>
      </label>
      {availableCourses.length===0?<p className="text-sm text-muted-foreground">No unmapped courses available for this semester.</p>:null}
      <div className="flex items-end sm:justify-end">
        <Button className="min-h-11 w-full sm:w-auto md:min-h-9" type="submit" disabled={pending || !!error || !editableTerm || !termId || !selectedIds.length}>
          <span aria-hidden="true">＋</span> {TERM_MAPPING_COPY.addButton}
        </Button>
      </div>
      </form>
    </Disclosure> : null}
    </section>
    <section className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">{selectedTerm
          ? "Courses in "+(selectedTerm.name||"Semester "+selectedTerm.termNumber)
          : "Select a Semester to View Courses"}</h2>
        <Button type="button" variant="secondary" disabled={pending||!termId}
          aria-label="Refresh semester courses"
          onClick={()=>{setError(null);setFieldErrors({});setNotice("Refreshing semester courses…");router.refresh();}}>
          <span aria-hidden="true">↻</span> Refresh
        </Button>
      </div>
    {!termId ? <p className="text-sm text-body">Select a program and semester to view/manage courses</p> :
    !editableTerm && currentMappings.length === 0 ? <p className="text-sm text-body">Archived semester — read-only. No courses mapped.</p> :
    currentMappings.length === 0 ? <p className="text-sm text-body">No courses mapped to this semester. Select courses to add.</p> :
      <DataTable
        caption="Semester course mappings"
        rows={currentMappings}
         mobileMode="scroll"
        getRowKey={row=>row.id}
        empty={<p>No courses mapped to this semester.</p>}
        columns={[
          {key:"course",header:TERM_MAPPING_COPY.columns.courseName,mobilePriority:"primary",cell:row=>
            <div draggable={!pending && editableTerm}
              onDragStart={event=>{setDraggedId(row.id);event.dataTransfer.effectAllowed="move";}}
              onDragEnd={()=>setDraggedId(null)}
              onDragOver={event=>{if(draggedId && draggedId!==row.id)event.preventDefault();}}
              onDrop={event=>{
                event.preventDefault();
                const source=currentMappings.find(item=>item.id===draggedId);
                if(editableTerm && source && source.termId===row.termId && source.id!==row.id){
                  const index=orderedPeers(row).findIndex(item=>item.id===row.id)+1;
                  updateMapping(source.id,String(source.credits??3),index);
                }
                setDraggedId(null);
              }}>
              <span className="font-semibold">{row.courseName}</span>
              {row.staffingWarning&&<p role="status"
                title={row.staffingTooltip??undefined}
                className="mt-1 text-xs font-semibold text-warning">{row.staffingWarning}</p>}
            </div>},
          {key:"code",header:TERM_MAPPING_COPY.columns.courseCode,mobilePriority:"secondary",cell:row=>row.courseCode||"—"},
          {key:"credits",header:TERM_MAPPING_COPY.columns.credits,mobilePriority:"secondary",cell:row=>row.credits??3},
          {key:"type",header:TERM_MAPPING_COPY.columns.type,mobilePriority:"secondary",
            cell:row=>row.type==="CORE"?TERM_MAPPING_COPY.core:row.type==="ELECTIVE"?TERM_MAPPING_COPY.elective:row.type},
          {key:"order",header:"Order",mobilePriority:"secondary",cell:row=>
            row.displayOrder>0?row.displayOrder:"—"},
          {key:"actions",header:TERM_MAPPING_COPY.columns.actions,mobilePriority:"action",cell:row=>
            (<div className="flex min-w-0 flex-wrap gap-2">
                <Button className="min-h-11 md:min-h-9" variant="secondary" type="button" disabled={pending || !editableTerm}
                  
                  onClick={()=>{
                    setError(null); setFieldErrors({});
                    setEditing({
                      id:row.id,credits:row.credits===null?"3":String(row.credits),
                      position:String(orderedPeers(row).findIndex(item=>item.id===row.id)+1),
                    });
                  }}>Edit</Button>
                <Button className="min-h-11 min-w-11 md:min-h-9 md:min-w-9" variant="secondary" type="button" disabled={pending || !editableTerm || orderedPeers(row)[0]?.id===row.id}
                  
                  aria-label={"Move "+row.courseName+" up"}
                  onClick={()=>updateMapping(row.id,row.credits===null?"3":String(row.credits),
                    orderedPeers(row).findIndex(item=>item.id===row.id))}>↑</Button>
                <Button className="min-h-11 min-w-11 md:min-h-9 md:min-w-9" variant="secondary" type="button" disabled={pending || !editableTerm || orderedPeers(row).at(-1)?.id===row.id}
                  
                  aria-label={"Move "+row.courseName+" down"}
                  onClick={()=>updateMapping(row.id,row.credits===null?"":String(row.credits),
                    orderedPeers(row).findIndex(item=>item.id===row.id)+2)}>↓</Button>
                <Button className="min-h-11 md:min-h-9" size="sm" variant="danger" disabled={pending || !editableTerm}
                  onClick={()=>{setError(null);setNotice(null);setConfirm({type:"REMOVE",id:row.id});}}>
                  {TERM_MAPPING_COPY.removeButton}
                </Button>
              </div>)},
        ]}
      />}
    {termId && !editableTerm ? <p role="status" className="text-sm text-muted-foreground">This is an archived semester. Existing curriculum mappings are read-only.</p> : null}
    {notice ? <p role="status" className="text-sm text-body">{notice}</p> : null}
    {error && !confirm ? <p role="alert" className="text-sm text-[var(--lms-error)]">{error}</p> : null}
    </section>
    </div>
    <Dialog open={editing !== null} onOpenChange={open => { if (!open && !pending) cancelEditing(); }}
      title={"Edit Course Mapping: "+(editingRow?.courseName||"Course")} description={editingRow ? editingRow.courseCode : undefined}
      dismissible={false}>
      {editing && editingRow ? <form aria-label={"Edit mapping for " + editingRow.courseName}
        className="grid min-w-0 gap-4" onSubmit={event => {
          event.preventDefault();
          updateMapping(editingRow.id, editing.credits, Number(editing.position));
        }}>
        <label className="grid gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">Credits
          <Input type="number" min={1} max={10} step={1} required
            value={editing.credits}
            onChange={event => {
              setFieldErrors(current => ({ ...current, credits: undefined }));
              setEditing({ ...editing, credits: event.target.value });
            }}
            className="min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-2 md:min-h-[var(--lms-control-height)]" />
          {fieldErrors.credits ? <span role="alert" className="text-xs text-[var(--lms-error)]">{fieldErrors.credits}</span> : null}
        </label>
        <label className="grid gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">Order
          <Input type="number" min={1} max={orderedPeers(editingRow).length} step={1} required
            value={editing.position}
            onChange={event => setEditing({ ...editing, position: event.target.value })}
            className="min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-2 md:min-h-[var(--lms-control-height)]" />
        </label>
        {error ? <p role="alert" className="text-sm text-[var(--lms-error)]">Course mapping was not updated. {error}</p> : null}
        <div className="flex min-w-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" disabled={pending} onClick={cancelEditing}>Cancel</Button>
          <Button type="submit" disabled={pending} loading={pending}>Save Changes</Button>
        </div>
      </form> : null}
    </Dialog>
    <ConfirmDialog open={switchDraft !== null} onOpenChange={open => { if (!open) setSwitchDraft(null); }}
      title={switchDraft?.kind === "program"
        ? "Switch programs with unsaved course choices?" : "Switch semesters with unsaved course choices?"}
      description={`${selectedIds.length} unsaved course choice(s) will be retained for this semester.`}
      confirmLabel={switchDraft?.kind === "program" ? "Switch program" : "Switch semester"}
      onConfirm={() => {
        if (switchDraft) applyScopeChange(switchDraft.kind, switchDraft.value);
        setSwitchDraft(null);
      }} />
    <ConfirmDialog open={discardEdit} onOpenChange={setDiscardEdit}
      title="Discard mapping changes?" description="Your unsaved mapping changes will be lost."
      confirmLabel="Discard changes" confirmVariant="danger"
      onConfirm={() => { setEditing(null); setDiscardEdit(false); }} />
    <ConfirmDialog open={confirm !== null} onOpenChange={value => { if (!value && !pending) setConfirm(null); }}
      title={confirm?.type === "REMOVE"
        ? TERM_MAPPING_COPY.removeTitle(data.mapped.find(row => row.id === confirm.id)?.courseName ?? "course")
        : "Add course to semester?"}
      description={confirm?.type === "REMOVE"
        ? "This removes a curriculum mapping. It will be blocked if an active current-term cohort offering uses it."
        : "Confirm the new curriculum association. Already mapped courses will be skipped."}
      confirmVariant={confirm?.type === "REMOVE" ? "danger" : "primary"}
      confirmLabel={confirm?.type === "REMOVE" ? TERM_MAPPING_COPY.removeButton : TERM_MAPPING_COPY.addButton}
      pending={pending} onConfirm={send}>
      {error ? <p role="alert" className="min-w-0 break-words text-sm text-[var(--lms-error-text)]">{error}</p> : null}
    </ConfirmDialog>
  </section>;
}
