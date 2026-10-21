"use client";
import { Select } from "@/components/ui/select";

import {
  type FormEvent,
  useState,
  useEffect,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import {FilterChip} from "@/components/ui/filter-chip";
import { Input } from "@/components/ui/input";
import {LearnerRichResponseEditor} from "./learner-rich-response-editor";
import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import { AssignmentFileSubmissionControl } from "./assignment-file-submission-control";
import { courseApiError } from "./learner-course-api";
import { createSubmissionFlightGuard } from "@/modules/courses/learner-submission-flight-model";
import { isLearnerAssignmentHttpsLink } from "@/modules/courses/learner-assignment-link-model";
import { learnerAssignmentFinalConfirmation } from "@/modules/courses/learner-assignment-confirmation-model";
import {ALL_ASSIGNMENT_METHODS,normalizeAssignmentMethods,type AssignmentMethod} from "@/modules/courses/assignment-submission-methods";

type SubmissionType = "TEXT" | "LINK" | "FILE";

export function AssignmentSubmissionControl({
  assignmentId,
  deliveryId,
  fileUploadsEnabled = false,
  multipartEnabled=false,
  methodsEnabled=false,
}: {
  assignmentId: string;
  deliveryId: string;
  fileUploadsEnabled?: boolean;
  multipartEnabled?:boolean;
  methodsEnabled?:boolean;
}) {
  const router = useRouter();
  const {showToast}=useToast();
  const [submissionType, setSubmissionType] =
    useState<SubmissionType>(multipartEnabled ? "FILE" : "TEXT");
  const [textContent, setTextContent] =
    useState("");
  const [submissionUrl, setSubmissionUrl] =
    useState("");
  const [allowedMethods,setAllowedMethods]=useState<AssignmentMethod[]>(ALL_ASSIGNMENT_METHODS);
  const [methodsLoaded,setMethodsLoaded]=useState(!methodsEnabled);
  const [methodsError,setMethodsError]=useState<string|null>(null);
  const [linkKind,setLinkKind]=useState<"REPOSITORY_LINK"|"EXTERNAL_LINK">("EXTERNAL_LINK");
  const mayWrite=allowedMethods.includes("WRITTEN_RESPONSE");
  const mayLink=allowedMethods.includes("REPOSITORY_LINK")||allowedMethods.includes("EXTERNAL_LINK");
  const mayUpload=allowedMethods.includes("PDF_UPLOAD")||allowedMethods.includes("FILE_UPLOAD");
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [success, setSuccess] =
    useState(false);
  const flight = useRef(createSubmissionFlightGuard());
  const [finalConfirmOpen,setFinalConfirmOpen]=useState(false);
  const finalResolver=useRef<((confirmed:boolean)=>void)|null>(null);
  function settleFinal(confirmed:boolean){
    setFinalConfirmOpen(false);
    const resolver=finalResolver.current;
    finalResolver.current=null;
    resolver?.(confirmed);
  }
  function confirmFinal(){return new Promise<boolean>(resolve=>{
    finalResolver.current?.(false);
    finalResolver.current=resolve;
    setFinalConfirmOpen(true);
  });}
  const [discardHref,setDiscardHref]=useState<string|null>(null);
  const methodsKey=(methodsEnabled?"1|":"0|")+assignmentId+"|"+deliveryId;
  const [prevMethodsKey,setPrevMethodsKey]=useState(methodsKey);
  if(prevMethodsKey!==methodsKey){
    setPrevMethodsKey(methodsKey);
    if(methodsEnabled){setMethodsLoaded(false);setMethodsError(null);}
  }
  useEffect(()=>{
    if(!methodsEnabled)return;
    const controller=new AbortController();
    void fetch("/api/courses/assignments/"+encodeURIComponent(assignmentId)+
      "/methods?deliveryId="+encodeURIComponent(deliveryId),{
      cache:"no-store",signal:controller.signal,
    }).then(async response=>{
      if(!response.ok)throw new Error("Unable to load allowed submission methods.");
      return response.json();
    }).then(body=>{
      if(controller.signal.aborted)return;
      const methods=normalizeAssignmentMethods(body?.methods);
      setAllowedMethods(methods);
      setLinkKind(methods.includes("EXTERNAL_LINK")?"EXTERNAL_LINK":"REPOSITORY_LINK");
      setSubmissionType(multipartEnabled ? "FILE" : methods.includes("WRITTEN_RESPONSE")?"TEXT":
        methods.includes("EXTERNAL_LINK")||methods.includes("REPOSITORY_LINK")?"LINK":"FILE");
      setMethodsLoaded(true);
    }).catch(()=>{
      if(!controller.signal.aborted)setMethodsError("Submission methods could not be loaded. Refresh before submitting.");
    });
    return ()=>controller.abort();
  },[assignmentId,deliveryId,methodsEnabled,multipartEnabled]);
  const unsent=(!success)&&(textContent.trim().length>0||submissionUrl.trim().length>0);
  useEffect(()=>{
    if(!unsent&&!submitting)return;
    const guard=(event:BeforeUnloadEvent)=>{
      event.preventDefault();
      event.returnValue="";
    };
    window.addEventListener("beforeunload",guard);
    return ()=>window.removeEventListener("beforeunload",guard);
  },[unsent,submitting]);

  useEffect(()=>{
    if(!unsent&&!submitting)return;
    const onLink=(event:MouseEvent)=>{
      if(event.defaultPrevented)return;
      const node=event.target;
      const link=node instanceof Element?node.closest("a[href]"):null;
      if(!link)return;
      const target=new URL((link as HTMLAnchorElement).href,window.location.href);
      if(target.origin!==window.location.origin)return;
      event.preventDefault();
      if(submitting){setError("Wait for the upload to finish before closing this submission.");return;}
      setDiscardHref(target.pathname+target.search+target.hash);
    };
    document.addEventListener("click",onLink,true);
    return ()=>document.removeEventListener("click",onLink,true);
  },[unsent,submitting]);

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if(!methodsLoaded||methodsError)return;
    if(submissionType==="TEXT"&&!mayWrite || submissionType==="LINK"&&!mayLink ||
       submissionType==="FILE"&&!mayUpload){setError("This submission method is not allowed.");return;}
    if (submissionType === "FILE" || !flight.current.begin()) return;
    setError(null);
    setSuccess(false);

    if (
      submissionType === "TEXT" &&
      !textContent.trim()
    ) {
      setError(
        "Add at least one submission before submitting.",
      );
      flight.current.end();
      return;
    }

    if (submissionType === "LINK") {
      if (!isLearnerAssignmentHttpsLink(submissionUrl)) {
        setError(
          "Enter an HTTPS submission link without embedded credentials.",
        );
        flight.current.end();
        return;
      }
    }

    if (!(await confirmFinal())) {
      flight.current.end();
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/courses/assignments/${assignmentId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            submissionType === "TEXT"
              ? {
                  deliveryId,
                  submissionType,
                  textContent:
                    textContent.trim(),
                }
              : {
                  deliveryId,
                  submissionType,
                  submissionUrl:
                    submissionUrl.trim(),
                  ...(methodsEnabled?{linkKind}:{}),
                },
          ),
        },
      );

      if (!response.ok) {
        const message=await courseApiError(response);
        setError(message.toLowerCase().includes("deadline is not configured")
          ? "This assignment does not have a valid deadline. Submission is unavailable."
          : message.toLowerCase().includes("deadline has passed")
            ? "This assignment's deadline has passed. Submissions are closed."
            : message);
        return;
      }

      // The recorded assignment submission is the canonical completion signal
      // read by the learner-course workspace, without a duplicate content write.
      setSuccess(true);
      showToast({tone:"success",title:"Assignment submitted successfully."});
      router.refresh();
    } catch {
      setError(
        "Could not submit the assignment. Check your connection and try again.",
      );
    } finally {
      flight.current.end();
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Alert tone="success" role="status" className="mt-4">Assignment submitted successfully.</Alert>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="min-w-0 space-y-[var(--lms-space-4)]"
    >
      <fieldset disabled={submitting && submissionType !== "FILE"} className="min-w-0">
        <legend className="text-sm font-semibold text-foreground">
          Submit Your Work
        </legend>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Add your work using the method below. Submission is final once recorded.
        </p>

        <div
          className="mt-[var(--lms-space-3)] grid min-w-0 grid-cols-2 gap-[var(--lms-space-2)] md:flex md:flex-wrap"
          role="group"
          aria-label="Submission type"
        >
          <FilterChip
            className="min-h-11 w-full md:w-auto md:min-h-9"
            type="button"
            disabled={submitting||!methodsLoaded||!mayWrite}
            aria-pressed={
              submissionType === "TEXT"
            }
            onClick={() =>
              setSubmissionType("TEXT")
            }
          >
            Written response
          </FilterChip>
          <FilterChip
            className="min-h-11 w-full md:w-auto md:min-h-9"
            type="button"
            disabled={submitting||!methodsLoaded||!mayLink}
            aria-pressed={
              submissionType === "LINK"
            }
            onClick={() =>
              setSubmissionType("LINK")
            }
          >
            Website / External Link
          </FilterChip>
          <FilterChip type="button" className="col-span-2 min-h-11 w-full md:col-span-1 md:w-auto md:min-h-9" disabled={!methodsLoaded || submitting ||
              (multipartEnabled ? !(mayWrite&&mayLink) && !(fileUploadsEnabled&&mayUpload) : !fileUploadsEnabled || !mayUpload)}
            aria-pressed={submissionType === "FILE"} onClick={() => setSubmissionType("FILE")}>
            {multipartEnabled?"Combine work":"File Upload"}
          </FilterChip>
        </div>

        {methodsError?<Alert tone="error" className="mt-2">{methodsError}</Alert>:null}
        {methodsEnabled&&!methodsLoaded&&!methodsError?<p role="status" className="mt-2 text-xs leading-5">Loading allowed submission methods…</p>:null}
        {!fileUploadsEnabled&&mayUpload ? <Alert tone={mayWrite||mayLink?"warning":"error"} role={!mayWrite&&!mayLink?"alert":"status"} className="mt-2">
          {mayWrite||mayLink?"File uploads are currently unavailable. You can submit a written response or an HTTPS link.":
            "This assignment requires a PDF or file, but private uploads are unavailable. Ask your Faculty or college administrator to enable private file storage."}
        </Alert> : null}
        {submissionType==="LINK"&&methodsEnabled&&mayLink?
          <label className="mt-3 grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Link type
            <Select value={linkKind} disabled={submitting}
              className="min-h-11 md:min-h-9"
              onChange={event=>setLinkKind(event.target.value as typeof linkKind)}>
              {allowedMethods.includes("REPOSITORY_LINK")?<option value="REPOSITORY_LINK">Repository Link</option>:null}
              {allowedMethods.includes("EXTERNAL_LINK")?<option value="EXTERNAL_LINK">Website / External Link</option>:null}
            </Select>
          </label>:null}
        {submissionType === "FILE" ? <AssignmentFileSubmissionControl
          assignmentId={assignmentId} deliveryId={deliveryId} onBusyChange={setSubmitting} multipartEnabled={multipartEnabled} uploadsAllowed={fileUploadsEnabled&&mayUpload} pdfOnly={methodsEnabled&&!allowedMethods.includes("FILE_UPLOAD")&&allowedMethods.includes("PDF_UPLOAD")}
          onSubmitted={() => { setSuccess(true); showToast({tone:"success",title:"Assignment submitted successfully."}); router.refresh(); }} /> : submissionType === "TEXT" ? (
          <section className="mt-[var(--lms-space-4)] min-w-0">
            <h3 className="mb-[var(--lms-space-2)] text-xs font-semibold text-body">Written response</h3>
            <LearnerRichResponseEditor value={textContent} onChange={setTextContent} disabled={submitting}/>
          </section>
        ) : (
          <label className="mt-[var(--lms-space-4)] block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            <span className="mb-[var(--lms-space-2)] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Website / External Links<span aria-hidden="true" className="ml-1 text-[var(--lms-error)]">*</span>
            </span>
            <Input
              type="url"
              inputMode="url"
              maxLength={2048}
              value={submissionUrl}
              onChange={(event) =>
                setSubmissionUrl(
                  event.target.value,
                )
              }
              placeholder="Paste the link"
              required
            />
          </label>
        )}

        {error ? <Alert tone="error" className="mt-3">Assignment was not submitted. {error}</Alert> : null}

        {submissionType !== "FILE" ? <div className="mt-[var(--lms-space-4)] flex min-w-0 flex-col items-stretch gap-[var(--lms-space-3)] border-t border-border pt-[var(--lms-space-4)] md:flex-row md:flex-wrap md:items-center">
          <Button type="submit" className="min-h-11 w-full md:w-auto md:min-h-9" loading={submitting} disabled={!methodsLoaded||Boolean(methodsError)||submitting}>
            {submitting
              ? "Submitting…"
              : error?"Retry":"Submit"}
          </Button>
          <span className="max-w-prose text-xs text-muted-foreground">
            You cannot replace the submission
            after it is recorded.
          </span>
        </div> : null}
      </fieldset>
      {submissionType !== "FILE" ? <ConfirmDialog open={finalConfirmOpen} onOpenChange={next=>{if(!next)settleFinal(false);}}
        title="Submit assignment?" description={learnerAssignmentFinalConfirmation(submissionType)}
        confirmVariant="primary" confirmLabel="Submit" onConfirm={()=>settleFinal(true)}/> : null}
      <Dialog open={discardHref!==null} onOpenChange={open=>{if(!open)setDiscardHref(null);}}
        title="Discard this submission?" description="Your unsent answer will be lost."
        footer={<div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">
          <Button type="button" variant="secondary" className="min-h-11 w-full md:w-auto md:min-h-9" onClick={()=>setDiscardHref(null)}>Keep editing</Button>
          <Button type="button" variant="danger" className="min-h-11 w-full md:w-auto md:min-h-9" onClick={()=>{
            if(submitting)return;
            const href=discardHref;
            setDiscardHref(null);setTextContent("");setSubmissionUrl("");
            if(href)router.push(href);
          }}>Discard</Button>
        </div>}>
        <p className="text-sm text-body leading-[22px]">You have unsent work. Keep editing to preserve your answer.</p>
      </Dialog>
    </form>
  );
}
