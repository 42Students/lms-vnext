"use client";

import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { TERM_MAPPING_COPY, collegeTermCourseAddSchema, collegeTermCourseUpdateSchema, collegeTermMappingErrorMessage } from "@/modules/academics/college-term-mapping-model";

type MappingRead = {
  terms: readonly { id: string; name: string; termNumber: number; programId: string; programName: string; departmentId: string; isActive: boolean }[];
  courses: readonly { id: string; name: string; code: string; departmentId: string }[];
  mapped: readonly {
    id: string; termId: string; courseId: string; termName: string; termNumber: number; programName: string;
    courseName: string; courseCode: string; type: string; isMandatory?: boolean | null; credits: number | null; displayOrder: number; staffingWarning: string | null; staffingTooltip?: string | null;
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
  const [editing, setEditing] = useState<{ id: string; credits: string; position: string; type: "CORE" | "ELECTIVE"; isMandatory: boolean } | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [courseType, setCourseType] = useState<"CORE" | "ELECTIVE">("CORE");
  const [switchDraft, setSwitchDraft] = useState<{ kind: "program" | "term"; value: string } | null>(null);
  const [discardEdit, setDiscardEdit] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ program?: string; term?: string; courses?: string; credits?: string }>({});
  const [programQuery, setProgramQuery] = useState("");
  const [semesterQuery, setSemesterQuery] = useState("");
  const [courseQuery, setCourseQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [optimisticByTerm, setOptimisticByTerm] = useState<Record<string, string[]>>({});
  useEffect(() => {
    setRefreshing(false);
    setOptimisticByTerm({});
    setNotice(current => current === "Refreshing semester courses…" ? null : current);
  }, [data]);

  function applyScopeChange(kind: "program" | "term", value: string) {
    setFieldErrors({}); setError(null); setNotice(null); setEditing(null); setCourseQuery("");
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
      editing.position !== String(originalPosition) ||
      editing.type !== original.type || editing.isMandatory !== (original.isMandatory ?? original.type === "CORE"))) {
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
          ? addedCount === 1 ? "Course added to semester" : `${addedCount} courses added to semester`
          : TERM_MAPPING_COPY.removedMessage(removedCourse);
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
  const currentMappings = data.mapped.filter(item => item.termId === termId).slice().sort((a,b) => {
    const order = optimisticByTerm[termId];
    if (order) return order.indexOf(a.id) - order.indexOf(b.id);
    return a.displayOrder - b.displayOrder || a.id.localeCompare(b.id);
  });
  const programChoices = Array.from(new Map(data.terms.map(t => [t.programId, t.programName])).entries())
    .filter(([id, name]) => id === programId || name.toLowerCase().includes(programQuery.toLowerCase()));
  const filteredTerms = termChoices.filter(t =>
    t.id === termId || (t.name || "Semester " + t.termNumber).toLowerCase().includes(semesterQuery.toLowerCase()));
  const filteredCourses = availableCourses.filter(course =>
    (course.name + " " + course.code).toLowerCase().includes(courseQuery.toLowerCase()));
  function toggleCourse(courseId: string, checked: boolean) {
    setFieldErrors(current => ({ ...current, courses: undefined }));
    setError(null);
    setDraftByTerm(current => ({
      ...current,
      [termId]: checked ? Array.from(new Set([...(current[termId] ?? []), courseId])) :
        (current[termId] ?? []).filter(id => id !== courseId),
    }));
  }
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

  function updateMapping(id: string, creditsValue: string, position: number,
    editFields?: { type: "CORE" | "ELECTIVE"; isMandatory: boolean }) {
    if (inFlight.current) return;
    const previous = data.mapped.find(row => row.id === id);
    if (!previous || !editableTerm || previous.termId !== termId) return;
    const peers = orderedPeers(previous);
    const oldPosition = peers.findIndex(row => row.id === id) + 1;
    const changedCredits = Number(creditsValue) !== (previous.credits ?? 3);
    const parsed = collegeTermCourseUpdateSchema.safeParse({
      position,
      ...(changedCredits ? { credits: Number(creditsValue) } : {}),
      ...(editFields && editFields.type !== previous.type ? { type: editFields.type } : {}),
      ...(editFields && editFields.isMandatory !== (previous.isMandatory ?? previous.type === "CORE")
        ? { isMandatory: editFields.isMandatory } : {}),
    });
    if (!parsed.success) {
      setFieldErrors({ credits: "Enter credits" });
      setError(parsed.error.issues[0]?.message ?? "Course mapping was not updated");
      return;
    }
    setError(null); setFieldErrors({});
    if (oldPosition !== position) {
      const ids = peers.map(peer => peer.id).filter(peerId => peerId !== id);
      ids.splice(position - 1, 0, id);
      setOptimisticByTerm(current => ({ ...current, [termId]: ids }));
      setNotice("Saving course order…");
    }
    inFlight.current=true;
    start(async () => {
      try {
        await apiFetch("/api/academics/semester-course-mappings/" + encodeURIComponent(id), {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const message = oldPosition === position
          ? `Updated mapping for “${previous?.courseName ?? "course"}”.`
          : "Semester course order saved.";
        showToast({ tone: "success", title: message });
        setNotice(null);
        setEditing(null);
        router.refresh();
      } catch (cause) {
        if (oldPosition !== position) {
          setOptimisticByTerm(current => {
            const next = { ...current };
            delete next[previous.termId];
            return next;
          });
        }
        const message = oldPosition !== position
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
    const order = optimisticByTerm[row.termId];
    return data.mapped.filter(peer => peer.termId === row.termId).slice().sort((a, b) =>
      order ? order.indexOf(a.id) - order.indexOf(b.id)
        : a.displayOrder - b.displayOrder || a.id.localeCompare(b.id));
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
    <p className="text-xs text-muted-foreground">Drag the reorder handle or use Up/Down to change course order. Changes are saved for this semester only.</p>
    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
      <div className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
        <label htmlFor="mapping-program">Program</label>
        <Input type="search" aria-label="Search programs" placeholder="Search programs"
          value={programQuery} onChange={event => setProgramQuery(event.target.value)} disabled={pending} />
        <Select id="mapping-program" required disabled={pending} value={programId} onChange={event => {
          requestScopeChange("program", event.target.value);
        }} className="min-h-11 w-full md:min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-2 text-foreground">
          <option value="">Select program</option>
          {programChoices.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </Select>
        {fieldErrors.program ? <span role="alert" className="text-xs text-[var(--lms-error)]">{fieldErrors.program}</span> : null}
      </div>
      <div className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
        <label htmlFor="mapping-semester">Semester</label>
        <Input type="search" aria-label="Search semesters" placeholder="Search semesters"
          value={semesterQuery} onChange={event => setSemesterQuery(event.target.value)} disabled={pending || !programId} />
        <Select id="mapping-semester" required disabled={pending || !programId} value={termId} onChange={event => {
          requestScopeChange("term", event.target.value);
        }} className="min-h-11 md:min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-2 text-foreground">
          <option value="">Select semester</option>
          {filteredTerms.map(t => <option key={t.id} value={t.id}>{t.name || "Semester " + t.termNumber}{t.isActive ? "" : " — Archived"}</option>)}
        </Select>
        {fieldErrors.term ? <span role="alert" className="text-xs text-[var(--lms-error)]">{fieldErrors.term}</span> : null}
      </div>
    </div>
    {termId && editableTerm ? <div className="min-w-0 border-t border-border pt-4">
      <form onSubmit={prepare} className="grid min-w-0 gap-3">
      <div className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
        <label htmlFor="mapping-course-search">Courses to Add</label>
        <Input id="mapping-course-search" type="search" autoComplete="off"
          placeholder="Select courses to add" aria-label="Search courses by name or code"
          value={courseQuery} onChange={event => setCourseQuery(event.target.value)}
          disabled={pending} />
        {selectedIds.length > 0 ? <div className="flex flex-wrap gap-1" aria-live="polite">
          {selectedIds.slice(0, 3).map(id => {
            const course = data.courses.find(item => item.id === id);
            return <Button key={id} type="button" size="sm" variant="secondary"
              disabled={pending} aria-label={"Remove " + (course?.name ?? id) + " from selection"}
              onClick={() => toggleCourse(id, false)} className="!min-h-7 rounded-full px-2 py-0 text-xs">
              {course?.name ?? id} <span aria-hidden="true">×</span>
            </Button>;
          })}
          {selectedIds.length > 3 ? <span className="self-center text-xs text-muted-foreground">
            +{selectedIds.length - 3} more selected</span> : null}
        </div> : null}
        <div role="group" aria-label="Courses to Add" aria-invalid={!!fieldErrors.courses}
          className="max-h-44 min-h-20 space-y-1 overflow-y-auto rounded-[var(--lms-control-radius)] border border-border bg-surface p-2">
          {filteredCourses.length ? filteredCourses.map(course =>
            <label key={course.id} className="flex min-h-9 cursor-pointer items-center gap-2 rounded px-2 py-1 font-normal text-foreground hover:bg-muted">
              <input type="checkbox" className="h-4 w-4 accent-[var(--lms-primary)]"
                disabled={pending} checked={selectedIds.includes(course.id)}
                onChange={event => toggleCourse(course.id, event.target.checked)} />
              <span>{course.name} ({course.code || "—"})</span>
            </label>) : <p className="p-2 text-sm font-normal text-muted-foreground">No matching courses.</p>}
        </div>
        <span className="text-xs font-normal text-muted-foreground">
          Selecting a different program or semester keeps your unsaved choices as a draft for this semester.
        </span>
        {fieldErrors.courses ? <span role="alert" className="text-xs text-[var(--lms-error)]">{fieldErrors.courses}</span> : null}
      </div>
      <label className="grid min-w-0 gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">Course Type
        <Select value={courseType} onChange={event => setCourseType(event.target.value as "CORE" | "ELECTIVE")}
          className="min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-2 text-foreground md:min-h-[var(--lms-control-height)]">
          <option value="CORE">{TERM_MAPPING_COPY.core}</option>
          <option value="ELECTIVE">{TERM_MAPPING_COPY.elective}</option>
        </Select>
      </label>
      {availableCourses.length===0?<p className="text-sm text-muted-foreground">No unmapped courses available for this semester.</p>:null}
      <div className="flex items-end sm:justify-end">
        <Button className="min-h-11 w-full sm:w-auto md:min-h-9" type="submit" disabled={pending || !editableTerm || !termId}>
          <span aria-hidden="true">＋</span> {TERM_MAPPING_COPY.addButton}
        </Button>
      </div>
      </form>
    </div> : null}
    </section>
    <section className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">{selectedTerm
          ? "Courses in "+(selectedTerm.name||"Semester "+selectedTerm.termNumber)
          : "Select a Semester to View Courses"}</h2>
        <Button type="button" variant="secondary" disabled={pending || refreshing || !termId} loading={refreshing}
          aria-label="Refresh semester courses"
          onClick={() => { setError(null); setFieldErrors({}); setRefreshing(true); setNotice("Refreshing semester courses…"); router.refresh(); }}>
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
        empty={<p>No courses mapped to this semester. Select courses to add.</p>}
        columns={[
          {key:"reorder",header:"",className:"w-12",mobilePriority:"secondary",cell:row =>
            <Button type="button" variant="ghost" size="icon-sm"
              aria-label={"Drag to reorder " + (row.courseName || row.courseId) + ". Press Arrow Up or Arrow Down to move."}
              aria-keyshortcuts="ArrowUp ArrowDown"
              draggable={!pending && editableTerm} disabled={pending || !editableTerm}
              onDragStart={event => { setDraggedId(row.id); event.dataTransfer.effectAllowed="move"; }}
              onDragEnd={() => setDraggedId(null)}
              onDragOver={event => { if (draggedId && draggedId !== row.id) event.preventDefault(); }}
              onDrop={event => {
                event.preventDefault();
                const source = currentMappings.find(item => item.id === draggedId);
                if (source && source.termId === row.termId && source.id !== row.id) {
                  updateMapping(source.id, String(source.credits ?? 3), orderedPeers(row).findIndex(item => item.id === row.id) + 1);
                }
                setDraggedId(null);
              }}
              onKeyDown={event => {
                const step = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
                if (step) {
                  event.preventDefault();
                  const index = orderedPeers(row).findIndex(item => item.id === row.id);
                  const next = index + step;
                  if (next >= 0 && next < currentMappings.length)
                    updateMapping(row.id, String(row.credits ?? 3), next + 1);
                }
              }} className={draggedId === row.id ? "cursor-grabbing bg-muted" : "cursor-grab"}>
              <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                <circle cx="5" cy="3" r="1.2" /><circle cx="11" cy="3" r="1.2" />
                <circle cx="5" cy="8" r="1.2" /><circle cx="11" cy="8" r="1.2" />
                <circle cx="5" cy="13" r="1.2" /><circle cx="11" cy="13" r="1.2" />
              </svg>
            </Button>},
          {key:"course",header:TERM_MAPPING_COPY.columns.courseName,mobilePriority:"primary",cell:row=>
            <div onDragOver={event => { if (draggedId && draggedId !== row.id) event.preventDefault(); }}
              onDrop={event => {
                event.preventDefault();
                const source = currentMappings.find(item => item.id === draggedId);
                if (source && source.termId === row.termId && source.id !== row.id)
                  updateMapping(source.id, String(source.credits ?? 3), orderedPeers(row).findIndex(item => item.id === row.id) + 1);
                setDraggedId(null);
              }}>
              <span className="font-semibold">{row.courseName?.trim() || data.courses.find(c => c.id === row.courseId)?.name || "Course " + row.courseId}</span>
              {row.staffingWarning && <div className="mt-1" title={row.staffingTooltip ?? "Open Faculty Assignment to resolve missing staff"}>
                <span role="status" className="inline-flex items-center gap-1 rounded-full border border-warning px-2 py-0.5 text-xs font-semibold text-warning">
                  <svg aria-hidden="true" viewBox="0 0 20 20" width="13" height="13" fill="currentColor">
                    <path d="M10 2 1 18h18L10 2Zm0 5 1 6H9l1-6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                  </svg>
                  {row.staffingWarning}
                </span>
              </div>}
            </div>},
          {key:"code",header:TERM_MAPPING_COPY.columns.courseCode,mobilePriority:"secondary",cell:row=>row.courseCode||"—"},
          {key:"credits",header:TERM_MAPPING_COPY.columns.credits,mobilePriority:"secondary",cell:row=>row.credits??3},
          {key:"order",header:"Order",mobilePriority:"secondary",cell:row=>
            row.displayOrder>0?row.displayOrder:"—"},
          {key:"actions",header:TERM_MAPPING_COPY.columns.actions,mobilePriority:"action",cell:row=>
            (<div className="flex min-w-0 flex-wrap gap-2">
                <Button className="min-h-11 md:min-h-9" variant="secondary" type="button" disabled={pending || !editableTerm}
                  aria-label={"Edit mapping for " + (row.courseName || row.courseId)}
                  onClick={()=>{
                    setError(null); setFieldErrors({});
                    setEditing({
                      id:row.id,credits:row.credits===null?"3":String(row.credits),
                      position:String(orderedPeers(row).findIndex(item=>item.id===row.id)+1),
                      type:row.type==="ELECTIVE"?"ELECTIVE":"CORE",
                      isMandatory:row.isMandatory ?? row.type==="CORE",
                    });
                  }}><span aria-hidden="true">✎</span> Edit</Button>
                <Button className="min-h-11 min-w-11 md:min-h-9 md:min-w-9" variant="secondary" type="button" disabled={pending || !editableTerm || orderedPeers(row)[0]?.id===row.id}
                  
                  aria-label={"Move "+row.courseName+" up"}
                  onClick={()=>updateMapping(row.id,row.credits===null?"3":String(row.credits),
                    orderedPeers(row).findIndex(item=>item.id===row.id))}>↑</Button>
                <Button className="min-h-11 min-w-11 md:min-h-9 md:min-w-9" variant="secondary" type="button" disabled={pending || !editableTerm || orderedPeers(row).at(-1)?.id===row.id}
                  
                  aria-label={"Move "+row.courseName+" down"}
                  onClick={()=>updateMapping(row.id,row.credits===null?"":String(row.credits),
                    orderedPeers(row).findIndex(item=>item.id===row.id)+2)}>↓</Button>
                <Button className="min-h-11 md:min-h-9" size="sm" variant="danger" disabled={pending || !editableTerm}
                  aria-label={"Remove " + (row.courseName || row.courseId) + " from semester"}
                  onClick={()=>{setError(null);setNotice(null);setConfirm({type:"REMOVE",id:row.id});}}>
                  <span aria-hidden="true">×</span> {TERM_MAPPING_COPY.removeButton}
                </Button>
              </div>)},
        ]}
      />}
    {termId && !editableTerm ? <p role="status" className="text-sm text-muted-foreground">This is an archived semester. Existing curriculum mappings are read-only.</p> : null}
    {notice ? <p role="status" aria-live="polite" className="text-sm text-body">{notice}</p> : null}
    {refreshing && !currentMappings.length ? <div role="status" aria-label="Loading semester mappings"
      className="overflow-x-auto rounded border border-border p-3">
      {Array.from({ length: 6 }, (_, row) => <div key={row} className="flex min-w-[500px] gap-3 border-b border-border py-3 last:border-0">
        {Array.from({ length: 6 }, (_, col) => <span key={col} aria-hidden="true"
          className="h-4 flex-1 animate-pulse rounded bg-muted" />)}
      </div>)}
    </div> : null}
    {error && !confirm ? <p role="alert" className="text-sm text-[var(--lms-error)]">{error}</p> : null}
    </section>
    </div>
    <Dialog open={editing !== null} onOpenChange={open => { if (!open && !pending) cancelEditing(); }}
      title={"Edit Course Mapping: "+(editingRow?.courseName||"Course")} description={editingRow ? editingRow.courseCode : undefined}
      dismissible={false}>
      {editing && editingRow ? <form aria-label={"Edit mapping for " + editingRow.courseName}
        className="grid min-w-0 gap-4" onSubmit={event => {
          event.preventDefault();
          updateMapping(editingRow.id, editing.credits, Number(editing.position),
            { type: editing.type, isMandatory: editing.isMandatory });
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
        <label className="grid gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">Course Type
          <Select value={editing.type} disabled={pending}
            onChange={event => {
              const type = event.target.value as "CORE" | "ELECTIVE";
              setEditing({ ...editing, type, isMandatory: type === "CORE" ? editing.isMandatory : false });
            }}>
            <option value="CORE">{TERM_MAPPING_COPY.core}</option>
            <option value="ELECTIVE">{TERM_MAPPING_COPY.elective}</option>
          </Select>
        </label>
        <label className="flex items-center gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">
          <input type="checkbox" checked={editing.isMandatory} disabled={pending || editing.type !== "CORE"}
            onChange={event => setEditing({ ...editing, isMandatory: event.target.checked })}
            className="h-4 w-4 accent-[var(--lms-primary)]" />
          Mandatory course
        </label>
        <label className="grid gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">Display Order
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
