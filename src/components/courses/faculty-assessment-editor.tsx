"use client";
import { Banner } from "@/components/ui/banner";
import Link from "next/link";
import {facultyCourseTabHref} from "@/modules/courses/faculty-course-navigation";
import {ASSIGNMENT_METHOD_LABELS,normalizeAssignmentMethods,type AssignmentMethod} from "@/modules/courses/assignment-submission-methods";


import {
  type FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authoringLocalDateTime, authoringDueInstant } from "@/modules/courses/faculty-authoring-datetime-model";
import { courseApiError } from "./learner-course-api";
import { facultyAssessmentLimitEditable, facultyAssessmentLimitPatch, facultyAssessmentCanArchive, facultyAssessmentEditReceiptMatches, facultyAssessmentArchiveReceiptMatches } from "@/modules/courses/faculty-assessment-editor-model";

type Kind = "ASSIGNMENT" | "QUIZ";

type EditableAssessment = {
  id: string;
  kind: Kind;
  title: string;
  description: string | null;
  dueAt: Date | string | null;
  status: string;
  updatedAt: Date | string;
  maxPoints?: number;
  maxAttempts?: number;
  hasSubmissions?: boolean;
  allowedMethods?:readonly AssignmentMethod[];
  deliveryId?:string|null;
};

export function FacultyAssessmentEditor({
  assessment,compact=false,
}: {
  assessment: EditableAssessment;
  compact?:boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const titleOnly = assessment.kind==="ASSIGNMENT" && assessment.hasSubmissions===true;
  const [title, setTitle] = useState(
    assessment.title,
  );
  const [description, setDescription] =
    useState(assessment.description ?? "");
  const [dueAt, setDueAt] = useState(
    authoringLocalDateTime(assessment.dueAt),
  );
  const [points, setPoints] = useState(
    assessment.kind === "ASSIGNMENT"
      ? String(assessment.maxPoints ?? 10)
      : String(assessment.maxAttempts ?? 1),
  );
  const [methods,setMethods]=useState<AssignmentMethod[]>(assessment.allowedMethods?
    normalizeAssignmentMethods(assessment.allowedMethods):[]);
  const [success,setSuccess]=useState<string|null>(null);
  useEffect(()=>{if(!success)return;const timer=window.setTimeout(()=>setSuccess(null),2000);
    return ()=>window.clearTimeout(timer);},[success]);
  const [saving, setSaving] =
    useState(false);
  const [deleting, setDeleting] =
    useState(false);
  const [confirmAction, setConfirmAction] = useState<"SAVE" | "ARCHIVE" | "DISCARD" | null>(null);
  const [error, setError] =
    useState<string | null>(null);
  const [deleteFailed,setDeleteFailed]=useState(false);

  const dirty = title !== assessment.title || description !== (assessment.description ?? "") ||
    dueAt !== authoringLocalDateTime(assessment.dueAt) ||
    points !== String(assessment.kind === "ASSIGNMENT" ? (assessment.maxPoints ?? 10) : (assessment.maxAttempts ?? 1)) ||
    Boolean(assessment.allowedMethods && methods.join("|")!==assessment.allowedMethods.join("|"));
  useEffect(() => {
    if (!open || !dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [open, dirty]);
  const itemPath =
    assessment.kind === "ASSIGNMENT"
      ? `/api/courses/assignments/${assessment.id}`
      : `/api/courses/quizzes/${assessment.id}`;
  const transitionPath =
    assessment.kind === "ASSIGNMENT"
      ? `/api/courses/assignments/${assessment.id}/transition`
      : `/api/courses/quizzes/${assessment.id}/transition`;

  async function save(
    event?: FormEvent<HTMLFormElement>,
    confirmed = false,
  ) {
    event?.preventDefault();
    if (saving || deleting) return;

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Enter a title.");
      return;
    }

    const number = Number(points);
    if (
      !Number.isInteger(number) ||
      number < (assessment.kind === "ASSIGNMENT" ? 0 : 1) ||
      (assessment.kind === "ASSIGNMENT"
        ? number > 1000
        : number > 20)
    ) {
      setError(
        assessment.kind === "ASSIGNMENT"
          ? "Enter a whole number from 0 to 1000"
          : "Maximum attempts must be between 1 and 20.",
      );
      return;
    }

    if(assessment.kind==="ASSIGNMENT"&&assessment.allowedMethods&&methods.length===0){
      setError("Choose at least one submission method.");return;
    }
    if (!confirmed) { setConfirmAction("SAVE"); return; }
    setConfirmAction(null);
    setError(null);
    setSaving(true);
    try {
      const response = await fetch(itemPath, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expectedUpdatedAt: new Date(assessment.updatedAt).toISOString(),
          confirmed: true,
          title: cleanTitle,
          ...(titleOnly?{}:{
            description:description.trim() || null,
            dueAt: authoringDueInstant(dueAt),
            ...facultyAssessmentLimitPatch(assessment.kind,assessment.status,number),
            ...(assessment.kind==="ASSIGNMENT"&&assessment.allowedMethods?{allowedMethods:methods}:{}),
          }),
        }),
      });
      if (!response.ok) {
        const result=await response.clone().json().catch(()=>null);
        setError(result?.error==="ASSIGNMENT_HAS_SUBMISSIONS"
          ? "Learner submissions exist. Deadline, points, audience, resources and submission methods are locked. You can still correct the title."
          : (await courseApiError(response) ?? "Could not save this assessment."));
        return;
      }
      const receipt:unknown=await response.json().catch(()=>null);
      if(!facultyAssessmentEditReceiptMatches(assessment.kind,assessment.id,assessment.status,cleanTitle,receipt)){
        setError("The save result could not be verified. Reload this Section before retrying.");
        return;
      }
      setSuccess(assessment.kind==="ASSIGNMENT"?"Assignment updated successfully":"Quiz updated successfully");
      setOpen(false);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save this assessment.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteAssessment(confirmed = false) {
    if (saving || deleting || !facultyAssessmentCanArchive(assessment.kind,assessment.status)) return;
    if(assessment.kind==="ASSIGNMENT"&&assessment.hasSubmissions){
      setError("This assignment has submissions and cannot be deleted.");return;
    }
    if (!confirmed) { setConfirmAction("ARCHIVE"); return; }
    setConfirmAction(null);
    setDeleteFailed(false);

    setError(null);
    setDeleting(true);
    try {
      const response = await fetch(
        transitionPath,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action: "ARCHIVE",
            expectedUpdatedAt: new Date(assessment.updatedAt).toISOString(),
            confirmed: true,
          }),
        },
      );
      if (!response.ok) {
        setDeleteFailed(true);
        setError(
          (await courseApiError(response)) ?? "Could not delete this assessment.",
        );
        return;
      }
      const receipt:unknown=await response.json().catch(()=>null);
      if(!facultyAssessmentArchiveReceiptMatches(assessment.kind,assessment.id,assessment.title,receipt)){
        setDeleteFailed(true);
        setError("The archive result could not be verified. Reload this Section before trying again.");
        return;
      }
      setOpen(false);
      setDeleteFailed(false);
      router.refresh();
    } catch {
      setDeleteFailed(true);
      setError(
        "Could not delete this assessment. Check your connection and try again.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Button
        size="md"
        
        variant="secondary"
        className={compact?"!min-h-9 !px-3 !py-1.5 !text-xs":undefined}
        aria-label={"Edit "+assessment.kind.toLowerCase()+" "+assessment.title}
        aria-busy={saving||deleting}
        onClick={() => {
          // Reset from latest server props every time: cancelled edits and
          // stale local state must not overwrite subsequently refreshed rows.
          setTitle(assessment.title);
          setDescription(assessment.description ?? "");
          setDueAt(authoringLocalDateTime(assessment.dueAt));
          setPoints(assessment.kind === "ASSIGNMENT"
            ? String(assessment.maxPoints ?? 10)
            : String(assessment.maxAttempts ?? 1));
          setMethods(assessment.allowedMethods?normalizeAssignmentMethods(assessment.allowedMethods):[]);
          setSuccess(null);
          setError(null);
          setDeleteFailed(false);
          setConfirmAction(null);
          setOpen(true);
        }}
      >
        Edit
      </Button>

      {deleteFailed&&error?<div role="alert" className="mt-2 space-y-2">
        <Alert tone="error"><strong>Assignment was not deleted.</strong> {error}</Alert>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm"
            disabled={saving||deleting} onClick={()=>void deleteAssessment()}>
            Retry delete
          </Button>
          <Button type="button" variant="ghost" size="sm"
            disabled={saving||deleting} onClick={()=>{setDeleteFailed(false);setError(null);}}>
            Dismiss
          </Button>
        </div>
      </div>:null}
      {success?<Alert tone="success">{success}</Alert>:null}
      <Drawer
        className="md:!w-[min(640px,100vw)]"
        open={open}
        onOpenChange={(next) => {
          if (!next && (saving || deleting)) return;
          if (!next && dirty) { setConfirmAction("DISCARD"); return; }
          setOpen(next);
        }}
        title={`Edit ${assessment.kind === "QUIZ" ? "Quiz" : "Assignment"}`}
        description={
          assessment.kind === "QUIZ" &&
          assessment.status !== "DRAFT"
            ? "Published Quiz metadata may be edited, but question structure remains immutable once the Quiz leaves Draft."
            : "Changes keep the same assessment identity and learner history."
        }
        footer={
          <>
            {facultyAssessmentCanArchive(assessment.kind,assessment.status) && !assessment.hasSubmissions ? <Button
              variant="danger"
              disabled={saving || deleting}
              loading={deleting}
              aria-label={"Delete "+assessment.kind.toLowerCase()+" "+assessment.title}
              aria-busy={deleting}
              onClick={() => void deleteAssessment()}
            >
              {deleting
                ? "Deleting…"
                : "Archive"}
            </Button> : null}
            <Button
              type="submit"
              form={`faculty-assessment-edit-${assessment.id}`}
              disabled={saving || deleting}
              loading={saving}
            >
              {saving
                ? "Saving…"
                : "Save changes"}
            </Button>
          </>
        }
      >
        <form
          id={`faculty-assessment-edit-${assessment.id}`}
          onSubmit={save}
          className="space-y-4"
        >
          {titleOnly?<Banner tone="info">
            Learner submissions exist. Deadline, points, audience, resources and submission methods are locked. You can still correct the title.
          </Banner>:null}
          <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Title
            <Input
              className="mt-[6px]"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              required
              maxLength={255}
            />
          </label>

          <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Description
            <Textarea
              className="mt-[6px]"
              disabled={titleOnly}
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              maxLength={10000}
            />
          </label>

          <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Due date (IST)
            <Input
              className="mt-[6px]"
              type="datetime-local"
              disabled={titleOnly || (assessment.kind==="QUIZ" && assessment.status==="CLOSED")}
              value={dueAt}
              onChange={(event) =>
                setDueAt(event.target.value)
              }
            />
          </label>

          <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            {assessment.kind === "ASSIGNMENT"
              ? "Maximum points"
              : "Maximum attempts"}
            <Input
              className="mt-[6px]"
              type="number"
              min={assessment.kind === "ASSIGNMENT" ? 0 : 1}
              max={
                assessment.kind ===
                "ASSIGNMENT"
                  ? 1000
                  : 20
              }
              value={points}
              disabled={titleOnly || !facultyAssessmentLimitEditable(assessment.kind,assessment.status)}
              onChange={(event) =>
                setPoints(event.target.value)
              }
              required
            />
            {!facultyAssessmentLimitEditable(assessment.kind,assessment.status) ?
              <span className="mt-1 block text-xs font-normal text-muted-foreground">The published Quiz attempt limit is locked. Quiz deadlines cannot change after learner attempts or closure.</span> : null}
          </label>


          {assessment.kind==="ASSIGNMENT"&&assessment.allowedMethods&&!titleOnly?
           <fieldset className="space-y-2 rounded-lg border border-border p-3">
            <legend className="text-sm font-semibold">Allowed submission methods</legend>
            {(Object.keys(ASSIGNMENT_METHOD_LABELS) as AssignmentMethod[]).map(method=>
             <label key={method} className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" checked={methods.includes(method)} disabled={saving}
               onChange={event=>setMethods(current=>event.target.checked?
                [...current,method]:current.filter(value=>value!==method))}
               className="size-4 accent-[var(--lms-primary)]"/>
              {ASSIGNMENT_METHOD_LABELS[method]}
             </label>)}
           </fieldset>:null}
          {assessment.kind==="ASSIGNMENT"&&assessment.deliveryId?
           <p className="text-sm leading-6">Files and lesson resources are managed separately in the
            {" "}<Link href={facultyCourseTabHref(assessment.deliveryId,"blueprint")}
             className="font-semibold text-primary-text underline">Course blueprint</Link>.
            Saved submissions remain protected during resource edits.</p>:null}
          {error ? <Alert tone="error">{error}</Alert> : null}
        </form>
      </Drawer>
      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={next => { if (!next && !saving && !deleting) setConfirmAction(null); }}
        title={confirmAction === "SAVE"
          ? (titleOnly
              ? "Confirm title correction? Learner submissions and assessment requirements will stay unchanged."
              : assessment.kind === "QUIZ" && assessment.status !== "DRAFT"
                ? "Confirm metadata-only Quiz edits? Existing questions and learner attempts remain unchanged."
                : "Confirm these draft assessment edits?")
          : confirmAction === "ARCHIVE"
            ? "Archive this " + assessment.kind.toLowerCase() + " from active Course surfaces? Existing historical attempts/submissions will be preserved."
            : assessment.kind === "QUIZ" ? "Discard quiz changes?" : "Discard this assignment draft?"}
        confirmLabel={confirmAction === "SAVE" ? "Save changes" : confirmAction === "ARCHIVE" ? "Archive" : "Discard edits"}
        confirmVariant={confirmAction === "SAVE" ? "primary" : "danger"}
        pending={saving || deleting}
        onConfirm={() => {
          const action = confirmAction;
          setConfirmAction(null);
          if (action === "SAVE") void save(undefined, true);
          else if (action === "ARCHIVE") void deleteAssessment(true);
          else if (action === "DISCARD") setOpen(false);
        }}
      />
    </>
  );
}
