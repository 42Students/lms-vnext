"use client";

import Link from "next/link";
import {
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { Menu, MenuItem } from "@/components/ui/menu";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import { apiFetch, FriendlyFetchError } from "@/lib/api-fetch";
import { academicSetupErrorMessage } from "@/modules/academics/academic-setup-error-copy";

/** Inline legacy action glyphs: no icon libraries are installed. */
function CourseActionIcon({kind}:{kind:"edit"|"duplicate"|"archive"}){
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind==="edit"?<><path d="m16 4 4 4-11 11-5 1 1-5 11-11Z"/>
      <path d="m14 6 4 4"/></>:kind==="duplicate"?<>
      <rect x="8" y="8" width="12" height="12" rx="2"/>
      <path d="M4 16V6a2 2 0 0 1 2-2h10"/></>:<>
      <rect x="5" y="6" width="14" height="14" rx="2"/>
      <path d="M3 6h18M9 6V4h6v2M10 10v6m4-6v6"/>
    </>}
  </svg>;
}
async function mutate(
  path: string,
  method: "PATCH" | "DELETE",
  body?: unknown,
) {
  return apiFetch<unknown>(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

function useCourseMutation() {
  const router = useRouter();
  const { showToast } = useToast();
  const {pending,run:guardedRun}=useGuardedAction();

  function run(
    task: () => Promise<unknown>,
    successTitle: string,
    onSuccess?: () => void,
    onFailure?: (error: unknown) => void,
    failureTitle = "Course update failed",
  ) {
    void guardedRun(async () => {
      try {
        await task();
        onSuccess?.();
        showToast({
          tone: "success",
          title: successTitle,
        });
        router.refresh();
      } catch (error) {
        onFailure?.(error);
        showToast({
          tone: "error",
          title: failureTitle,
          description:
            error instanceof FriendlyFetchError && error.code === "COURSE_STALE_VERSION"
              ? "This course was modified by someone else. Refresh and reapply your changes."
              : academicSetupErrorMessage(error, "Course was not saved. Review your changes and retry."),
        });
      }
    });
  }

  return { pending, run };
}

export function CourseActions({
  course,duplicateHref,activeOfferingCount=0,linkedLessonCount=0,allowMetadata=false,
}: {
  duplicateHref?:string;
  activeOfferingCount?:number;
  linkedLessonCount?:number;
  allowMetadata?:boolean;
  course: {
    id: string;
    updatedAt: string;
    name: string;
    code: string;
    shortTitle?:string|null;
    officialCode?:string|null;
    cardColor?:string|null;
    takeaways?:string|null;
    description: string | null;
  };
}) {
  const [editOpen, setEditOpen] =
    useState(false);
  const [archiveOpen, setArchiveOpen] =
    useState(false);
  const [discardOpen,setDiscardOpen]=useState(false);
  const [editFailure,setEditFailure]=useState("");
  const [archiveFailure,setArchiveFailure]=useState("");
  const [nameFieldError,setNameFieldError]=useState("");
  const [name, setName] =
    useState(course.name);
  const [code, setCode] =
    useState(course.code);
  const [description, setDescription] =
    useState(course.description ?? "");
  const [shortTitle,setShortTitle]=useState(course.shortTitle??course.name.slice(0,120));
  const [officialCode,setOfficialCode]=useState(course.officialCode??"");
  const [cardColor,setCardColor]=useState(course.cardColor??"");
  const [takeaways,setTakeaways]=useState(course.takeaways??"");
  const { pending, run } =
    useCourseMutation();
  const dirty = name!==course.name || code!==course.code ||
    description!==(course.description??"")||(allowMetadata&&(
      shortTitle!==(course.shortTitle??course.name.slice(0,120))||
      officialCode!==(course.officialCode??"")||cardColor!==(course.cardColor??"")||takeaways!==(course.takeaways??"")));
  function closeEdit(next:boolean) {
    if(!next && pending)return;
    if(!next && dirty){setDiscardOpen(true);return;}
    setEditOpen(next);
  }

  function openEdit() {
    setEditFailure("");
    setNameFieldError("");
    setName(course.name);
    setCode(course.code);
    setShortTitle(course.shortTitle??course.name.slice(0,120));
    setOfficialCode(course.officialCode??"");
    setCardColor(course.cardColor??"");
    setTakeaways(course.takeaways??"");
    setDescription(
      course.description ?? "",
    );
    setEditOpen(true);
  }

  function reportEditError(error: unknown) {
    const apiError=error instanceof FriendlyFetchError ? error : null;
    setNameFieldError(apiError?.code==="COURSE_NAME_CONFLICT"
      ?"A course with this name already exists in this department."
      :apiError?.fieldErrors.name??"");
    setEditFailure(apiError?.code==="COURSE_STALE_VERSION"
      ?"This course was modified by someone else. Refresh and reapply your changes."
      :academicSetupErrorMessage(error,"Review your changes and retry."));
  }

  function archive() {
    setArchiveFailure("");
    run(
      () => mutate("/api/courses/" + course.id,"DELETE"),
      "Archived course “" + course.name + "”.",
      () => setArchiveOpen(false),
      (error) => setArchiveFailure(
        academicSetupErrorMessage(error,"Course could not be archived. Refresh and retry."),
      ),
      "Course was not deleted",
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-[var(--lms-space-2)]">
        
        <Button size="sm" className="min-h-11 gap-1.5 md:min-h-9" variant="secondary"
          aria-label={"Edit course "+course.name} title={"Edit "+course.name}
          onClick={openEdit}>
          <CourseActionIcon kind="edit"/> Edit
        </Button>
        {duplicateHref?<Link href={duplicateHref} aria-label={"Duplicate course "+course.name}
          title={"Duplicate "+course.name}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
          <CourseActionIcon kind="duplicate"/> Duplicate
        </Link>:null}
        <Button size="sm" className="min-h-11 gap-1.5 md:min-h-9"
          variant="danger" disabled={pending} aria-label={"Archive course "+course.name}
          title={"Archive "+course.name+" (historical records retained)"}
          onClick={()=>{setArchiveFailure("");setArchiveOpen(true);}}>
          <CourseActionIcon kind="archive"/> Archive
        </Button>
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={closeEdit}
        dismissible={!pending}
        title={"Edit “"+course.name+"”"}
        className="max-w-[660px] max-h-[min(85vh,900px)] overflow-y-auto"
        description="Department ownership is immutable after Course creation. Existing files and linked lessons remain attached."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => closeEdit(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={
                pending ||
                !name.trim() ||
                (allowMetadata?(!shortTitle.trim()||
                  Boolean(cardColor&&!/^#[0-9A-Fa-f]{6}$/.test(cardColor))):!code.trim())
              }
              onClick={() =>
                run(
                  () =>
                    mutate(
                      "/api/courses/" +
                        course.id,
                      "PATCH",
                      {
                        expectedUpdatedAt: course.updatedAt,
                        name,
                        code,
                        ...(allowMetadata?{shortTitle:shortTitle.trim(),
                          officialCode:officialCode.trim()||null,cardColor:cardColor.trim()||null,takeaways:takeaways.trim()||null}:{}),
                        description:
                          description.trim() ||
                          null,
                      },
                    ),
                  "Updated course “"+name.trim()+"”.",
                  () => {setEditFailure("");setEditOpen(false);},
                  reportEditError,
                  "Course was not edited",
                )
              }
            >
              {pending
                ? "Saving…"
                : "Save Changes"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Course Name
            </span>
            <Input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              maxLength={255}
              placeholder="Course title"
              aria-invalid={Boolean(nameFieldError)}
              onBlur={() => {
                if(!name.trim())setNameFieldError("Enter a course name");
                else if(name.length>255)setNameFieldError("Maximum 255 characters");
              }}
            />
            {nameFieldError?<span role="alert" className="mt-1 block text-xs text-error">{nameFieldError}</span>:null}
          </label>
          {allowMetadata?<div className="grid gap-3">
            <label className="grid gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Short display name
              <Input value={shortTitle} onChange={event=>setShortTitle(event.target.value)} maxLength={120}/>
            </label>
            <label className="grid gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Official course code (optional)
              <Input value={officialCode} onChange={event=>setOfficialCode(event.target.value)} maxLength={40}
                placeholder="Official course code (optional)"/>
            </label>
            <label className="grid gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Course takeaways (optional)
              <Textarea value={takeaways} onChange={event=>setTakeaways(event.target.value)} maxLength={2000}/>
            </label>
            <label className="grid gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Card colour
              <div className="flex flex-wrap items-center gap-2">
                <Input type="color" aria-label="Choose card colour"
                  className="h-11 !w-20 cursor-pointer md:h-9"
                  value={/^#[0-9A-Fa-f]{6}$/.test(cardColor)?cardColor:"#0a7c88"}
                  onChange={event=>setCardColor(event.target.value)}/>
                <Input aria-label="Card colour HEX value" value={cardColor}
                  onChange={event=>setCardColor(event.target.value)}
                  maxLength={7} pattern="#[0-9A-Fa-f]{6}" placeholder="#0a7c88"
                  className="min-w-[116px] max-w-[156px]"/>
              </div>
              {cardColor&&!/^#[0-9A-Fa-f]{6}$/.test(cardColor)?
                <span role="alert" className="text-xs text-error">Use a colour like #0a7c88</span>:null}
            </label>
          </div>:null}
          {!allowMetadata?<label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Code
            </span>
            <Input
              value={code}
              onChange={(event) =>
                setCode(event.target.value)
              }
              maxLength={64}
            />
          </label>:null}
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Course info
            </span>
            <Textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              maxLength={5000}
              placeholder="Enter Course Info"
              rows={3}
            />
          </label>
        </div>
        {editFailure?<Alert tone="error" className="mt-3">Course was not edited. {editFailure}</Alert>:null}
      </Dialog>

      <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen}
        title="Discard unsaved course changes?"
        description={"Discard unsaved changes to “"+course.name+"”? You will lose the edits in this form."}
        confirmLabel="Discard changes" confirmVariant="danger"
        onConfirm={()=>{setDiscardOpen(false);setEditOpen(false);}} />
      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={"Delete “" + course.name + "”? (Archive only)"}
        description={activeOfferingCount>0
          ?"A Course with active Offerings cannot be archived. "+activeOfferingCount+" active Course Offering(s) must be archived first. Historical records remain preserved."
          :linkedLessonCount>0
           ?"This Course still has "+linkedLessonCount+" linked lesson(s). Remove or move these lesson dependencies before archiving. Uploaded files remain preserved."
           :"The old Delete action is implemented as Archive to preserve course history, enrolled students, materials and audit records. Use the authorized archive/restore workflow for recovery."}
        confirmLabel="Archive Course"
        pending={pending}
        confirmDisabled={activeOfferingCount>0||linkedLessonCount>0}
        onConfirm={archive}
      />
      {archiveFailure?<div className="mt-2 space-y-2" role="alert">
        <Alert tone="error">Course was not deleted. {archiveFailure}</Alert>
        <Button type="button" variant="secondary" size="sm" disabled={pending||activeOfferingCount>0||linkedLessonCount>0}
          onClick={archive}>Retry archive</Button>
      </div>:null}
    </>
  );
}

export function OfferingActions({
  offering,
  hideArchive = false,
}: {
  hideArchive?: boolean;
  offering: {
    id: string;
    type: "CORE" | "ELECTIVE";
    credits: number | null;
    displayOrder: number;
    courseName: string;
  };
}) {
  const [editOpen, setEditOpen] =
    useState(false);
  const [archiveOpen, setArchiveOpen] =
    useState(false);
  const [type, setType] = useState<
    "CORE" | "ELECTIVE"
  >(offering.type);
  const [credits, setCredits] =
    useState(
      offering.credits === null
        ? ""
        : String(offering.credits),
    );
  const [displayOrder, setDisplayOrder] =
    useState(
      String(offering.displayOrder),
    );
  const { pending, run } =
    useCourseMutation();

  function openEdit() {
    setType(offering.type);
    setCredits(
      offering.credits === null
        ? ""
        : String(offering.credits),
    );
    setDisplayOrder(
      String(offering.displayOrder),
    );
    setEditOpen(true);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-[var(--lms-space-2)]">
        <Button
          size="sm"
          className="min-h-11 md:min-h-9"
          variant="secondary"
          onClick={openEdit}
        >
          Edit
        </Button>
        {!hideArchive ? <Dropdown trigger="More" label="Offering actions" mobileSheet align="end" triggerClassName="md:!min-h-9"><Menu><MenuItem disabled={pending} onClick={()=>setArchiveOpen(true)}>Archive</MenuItem></Menu></Dropdown> : null}
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={next=>{if(!pending)setEditOpen(next);}}
        dismissible={!pending}
        title="Edit Course Offering"
        description="Course, Cohort and Academic Period ownership are immutable."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() =>
                setEditOpen(false)
              }
            >
              Cancel
            </Button>
            <Button
              disabled={pending||!displayOrder.trim()||!Number.isInteger(Number(displayOrder))||Number(displayOrder)<0||Number(displayOrder)>10000||Boolean(credits.trim()&&(!Number.isInteger(Number(credits))||Number(credits)<1||Number(credits)>30))}
              onClick={() =>
                run(
                  () =>
                    mutate(
                      "/api/courses/offerings/" +
                        offering.id,
                      "PATCH",
                      {
                        type,
                        credits: credits
                          ? Number(credits)
                          : null,
                        displayOrder:
                          Number(
                            displayOrder,
                          ),
                      },
                    ),
                  "Course Offering updated",
                  () => setEditOpen(false),
                )
              }
            >
              {pending
                ? "Saving…"
                : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Type
            </span>
            <Select
              value={type}
              onChange={(event) =>
                setType(
                  event.target.value as
                    | "CORE"
                    | "ELECTIVE",
                )
              }
            >
              <option value="CORE">
                Core
              </option>
              <option value="ELECTIVE">
                Elective
              </option>
            </Select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Credits
            </span>
            <Input
              type="number"
              min={1}
              max={30}
              value={credits}
              onChange={(event) =>
                setCredits(
                  event.target.value,
                )
              }
              placeholder="Optional"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Display order
            </span>
            <Input
              type="number"
              min={0}
              max={10000}
              value={displayOrder}
              onChange={(event) =>
                setDisplayOrder(
                  event.target.value,
                )
              }
            />
          </label>
        </div>
      </Dialog>

      {!hideArchive ? <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={
          "Archive " +
          offering.courseName +
          " Offering?"
        }
        description="An Offering with active Section Deliveries cannot be archived."
        confirmLabel="Archive Offering"
        pending={pending}
        onConfirm={() =>
          run(
            () =>
              mutate(
                "/api/courses/offerings/" +
                  offering.id,
                "DELETE",
              ),
            "Course Offering archived",
            () => setArchiveOpen(false),
          )
        }
      /> : null}
    </>
  );
}

export function DeliveryActions({
  delivery,
}: {
  delivery: {
    id: string;
    courseName: string;
    sectionName: string;
  };
}) {
  const [open, setOpen] =
    useState(false);
  const { pending, run } =
    useCourseMutation();

  return (
    <>
      <Button
        size="sm"
          className="min-h-11 md:min-h-9"
        variant="danger"
        onClick={() => setOpen(true)}
      >
        End
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={
          "End " +
          delivery.courseName +
          " · " +
          delivery.sectionName +
          "?"
        }
        description="Active Teaching Assignments must be ended first. Historical Course work remains preserved."
        confirmLabel="End Delivery"
        pending={pending}
        onConfirm={() =>
          run(
            () =>
              mutate(
                "/api/courses/deliveries/" +
                  delivery.id,
                "DELETE",
              ),
            "Section Delivery ended",
            () => setOpen(false),
          )
        }
      />
    </>
  );
}

export function TeachingAssignmentActions({
  assignment,legacyCopy=false,
}: {
  legacyCopy?:boolean;
  assignment: {
    id: string;
    facultyDisplayName: string;
    courseName: string;
    sectionName: string;
  };
}) {
  const [open, setOpen] =
    useState(false);
  const { pending, run } =
    useCourseMutation();

  return (
    <>
      <Button
        size="sm"
          className="min-h-11 md:min-h-9"
        variant="danger"
        onClick={() => setOpen(true)}
      >
        End
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={legacyCopy?"Delete teaching assignment?":
          "End " + assignment.facultyDisplayName + " teaching assignment?"}
        description={legacyCopy
          ?"This removes the faculty from teaching the listed course. History is retained (no hard deletion)."
          :assignment.courseName + " · " + assignment.sectionName}
        confirmLabel={legacyCopy?"Remove teaching assignment":"End Assignment"}
        pending={pending}
        onConfirm={() =>
          run(
            () =>
              mutate(
                "/api/courses/teaching-assignments/" +
                  assignment.id,
                "DELETE",
              ),
            legacyCopy?"Teaching assignment removed; history retained.":"Teaching assignment ended",
            () => setOpen(false),
          )
        }
      />
    </>
  );
}