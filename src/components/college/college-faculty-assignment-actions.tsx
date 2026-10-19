"use client";
import { Select } from "@/components/ui/select";

import {useCollegeConfirmation} from "@/components/college/use-college-confirmation";

import { FACULTY_ASSIGNMENT_COPY, FACULTY_ASSIGNMENT_ROLE_LABELS } from "@/modules/courses/college-courses-copy";
import {apiFetch} from "@/lib/api-fetch";
import { academicSetupErrorMessage } from "@/modules/academics/academic-setup-error-copy";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Option = { id: string; label: string };
type CourseTeachingRole = "PRIMARY" | "CO_TEACHER" | "TA";

type BulkResult={
  created?:string[];
  failed?:Array<{deliveryId:string;reason:string}>;
};

type DeliveryOption = Option & {
  programId: string; programName: string; cohortId: string; cohortName: string;
  sectionId: string; sectionName: string; semesterNumber: number | null;
  academicYear: string; courseName: string; courseCode: string;
};
export function CollegeFacultyAssignmentCreate({
  deliveries, faculty, deliveriesTruncated, facultyTruncated,
}: {
  deliveries: DeliveryOption[]; faculty: Option[];
  deliveriesTruncated: boolean; facultyTruncated: boolean;
}) {
  const router = useRouter();
  const {ask,confirmation}=useCollegeConfirmation();
  const [programId, setProgramId] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [semesterNumber, setSemesterNumber] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [membershipId, setMembershipId] = useState("");
  const [role, setRole] = useState<CourseTeachingRole>("PRIMARY");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const programs = Array.from(new Map(deliveries.map(item =>
    [item.programId, item.programName])).entries());
  const batches = Array.from(new Map(deliveries.filter(item => item.programId === programId)
    .map(item => [item.cohortId, item.cohortName])).entries());
  const classes = Array.from(new Map(deliveries.filter(item => item.cohortId === cohortId)
    .map(item => [item.sectionId, item.sectionName])).entries());
  const scoped = deliveries.filter(item => item.programId === programId &&
    item.cohortId === cohortId && item.sectionId === sectionId);
  const semesters = [...new Set(scoped.map(item => item.semesterNumber).filter(
    (item): item is number => item !== null))].sort((a, b) => a - b);
  const years = [...new Set(scoped.map(item => item.academicYear))].sort();
  const choices = scoped.filter(item =>
    (semesterNumber === "" || String(item.semesterNumber) === semesterNumber) &&
    (academicYear === "" || item.academicYear === academicYear));
  function resetParents(next: "program" | "batch" | "class", id: string) {
    if (next === "program") {
      setProgramId(id); setCohortId(""); setSectionId("");
    } else if (next === "batch") { setCohortId(id); setSectionId(""); }
    else setSectionId(id);
    setSemesterNumber(""); setAcademicYear(""); setSelected([]); setError(null);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setMessage(null);
    if (!membershipId || selected.length === 0) {
      setError("Select a faculty member and at least one course to assign."); return;
    }
    const teacher = faculty.find(item => item.id === membershipId)?.label ?? "Faculty";
    if (!(await ask(`Assign ${teacher} to ${selected.length} selected course(s)? Existing assignments and duplicate primary lecturers will be refused.`))) return;
    setSaving(true);
    try {
      const data=await apiFetch<BulkResult>("/api/college/teaching-assignments/bulk",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({deliveryIds:selected,membershipId,role}),
      });
      const successes = data?.created?.length ?? 0;
      const failures = data?.failed ?? [];
      setMessage(`Created ${successes} teaching assignments for this class.` +
        (failures.length ? " " + failures.map(item => {
          const option = deliveries.find(row => row.id === item.deliveryId);
          return (option?.courseName ?? "Selected course") + ": could not be assigned; review and retry.";
        }).join("; ") : ""));
      setSelected(failures.map(item => item.deliveryId));
      router.refresh();
    } catch (cause) {
      setError(academicSetupErrorMessage(cause, FACULTY_ASSIGNMENT_COPY.createFailed));
    } finally { setSaving(false); }
  }
  const fieldClass = "min-h-11 min-w-0 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-base sm:text-sm text-foreground";
  return <>{confirmation}<section aria-label="Assign Faculty to multiple courses"
    className="border-t border-border pt-4">
    <h2 className="text-lg font-semibold text-foreground">{FACULTY_ASSIGNMENT_COPY.createTitle}</h2>
    <form onSubmit={event => void submit(event)} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="grid gap-1 text-sm font-semibold">Program
        <Select required className={fieldClass} value={programId}
          onChange={event => resetParents("program", event.target.value)}>
          <option value="">Choose program</option>
          {programs.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold">Batch
        <Select required className={fieldClass} value={cohortId}
          onChange={event => resetParents("batch", event.target.value)}>
          <option value="">Choose batch</option>
          {batches.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold">Class/Section
        <Select required className={fieldClass} value={sectionId}
          onChange={event => resetParents("class", event.target.value)}>
          <option value="">Choose class</option>
          {classes.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold">Semester
        <Select className={fieldClass} value={semesterNumber}
          onChange={event => { setSemesterNumber(event.target.value); setSelected([]); }}>
          <option value="">All semesters</option>
          {semesters.map(term => <option key={term} value={term}>Semester {term}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold">Academic Year
        <Select className={fieldClass} value={academicYear}
          onChange={event => { setAcademicYear(event.target.value); setSelected([]); }}>
          <option value="">All years</option>
          {years.map(year => <option key={year} value={year}>{year}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold">Faculty
        <Select required className={fieldClass} value={membershipId}
          onChange={event => setMembershipId(event.target.value)}>
          <option value="">Choose faculty</option>
          {faculty.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold">{FACULTY_ASSIGNMENT_COPY.roleLabel}
        <Select className={fieldClass} value={role}
          onChange={event => setRole(event.target.value as CourseTeachingRole)}>
          <option value="PRIMARY">{FACULTY_ASSIGNMENT_ROLE_LABELS.PRIMARY}</option>
          <option value="CO_TEACHER">{FACULTY_ASSIGNMENT_ROLE_LABELS.CO_TEACHER}</option>
          <option value="TA">{FACULTY_ASSIGNMENT_ROLE_LABELS.TA}</option>
        </Select>
      </label>
      <fieldset className="space-y-2 sm:col-span-2 lg:col-span-4">
        <legend className="text-sm font-semibold">Courses to Assign ({selected.length} selected)</legend>
        <div className="max-h-64 space-y-2 overflow-auto rounded-[var(--lms-control-radius)] border border-border p-3">
          {choices.length === 0 && <p className="text-sm text-muted-foreground">
            Select a program, batch and class to view eligible courses.
          </p>}
          {choices.map(item => <label key={item.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selected.includes(item.id)}
              onChange={event => setSelected(previous => event.target.checked
                ? [...previous, item.id] : previous.filter(id => id !== item.id))} />
            {item.courseName} ({item.courseCode}) · {item.academicYear}
          </label>)}
        </div>
      </fieldset>
      <div className="sm:col-span-2 lg:col-span-4">
        <button type="submit" disabled={saving || !selected.length || !membershipId}
          className="min-h-11 rounded-[var(--lms-control-radius)] bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
          {saving ? "Assigning…" : `Assign to ${selected.length} course(s)`}
        </button>
      </div>
    </form>
    {(deliveriesTruncated || facultyTruncated) && <p role="note" className="mt-3 text-sm text-warning">
      Only the first 200 active delivery or faculty records are listed. Narrow the selection or use its own course workspace.
    </p>}
    {error && <p role="alert" className="mt-3 text-sm text-error">{error}</p>}
    {message && <p role="status" className="mt-3 text-sm text-success">{message}</p>}
  </section></>;
}

export function CollegeFacultyAssignmentEnd({
  assignmentId, facultyName, courseName, role,
}: {
  assignmentId: string;
  facultyName: string;
  courseName: string;
  role: CourseTeachingRole;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [confirming,setConfirming]=useState(false);
  const [success,setSuccess]=useState("");
  const [error, setError] = useState<string | null>(null);
  async function end() {

    setError(null);
    setSaving(true);
    try {
      await apiFetch<void>(
        "/api/courses/teaching-assignments/" + encodeURIComponent(assignmentId),
        {method:"DELETE"},
      );
      setSuccess("Deleted assignment. Teaching history is retained.");setConfirming(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Assignment could not be ended.");
    } finally {
      setSaving(false);
    }
  }
  return <div className="space-y-1">
    <button type="button" disabled={saving} onClick={()=>{setConfirming(true);setError(null);}}
      className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-3 text-xs font-semibold text-link disabled:opacity-60">
      {saving ? "Ending…" : "End assignment"}
    </button>
    {confirming?<div role="group" aria-label="Confirm end assignment" className="mt-2 space-y-2 rounded-[var(--lms-control-radius)] border border-border p-3 text-xs">
      <p>End {role} assignment for {facultyName} in {courseName}? This cannot be undone. Teaching history is retained.</p>
      <button type="button" disabled={saving} onClick={()=>void end()} className="rounded-[var(--lms-control-radius)] bg-primary px-3 py-2 font-semibold text-on-primary">Confirm end</button>
      <button type="button" disabled={saving} onClick={()=>setConfirming(false)} className="ml-2 rounded-[var(--lms-control-radius)] border border-border px-3 py-2">Cancel</button>
    </div>:null}
    {success?<p role="status" className="text-xs">{success}</p>:null}
    {error ? <p role="alert" className="text-xs text-error">{error}</p> : null}
  </div>;
}
