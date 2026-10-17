"use client";

import {
  type FormEvent,
  useState,
  useEffect,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {LearnerRichResponseEditor} from "./learner-rich-response-editor";
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
  const [submissionType, setSubmissionType] =
    useState<SubmissionType>("TEXT");
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
      setSubmissionType(methods.includes("WRITTEN_RESPONSE")?"TEXT":
        methods.includes("EXTERNAL_LINK")||methods.includes("REPOSITORY_LINK")?"LINK":"FILE");
      setMethodsLoaded(true);
    }).catch(()=>{
      if(!controller.signal.aborted)setMethodsError("Submission methods could not be loaded. Refresh before submitting.");
    });
    return ()=>controller.abort();
  },[assignmentId,deliveryId,methodsEnabled]);
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

    if (!window.confirm(learnerAssignmentFinalConfirmation(submissionType))) {
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
        setError(
          await courseApiError(response),
        );
        return;
      }

      setSuccess(true);
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
      <div
        role="status"
        className="mt-4 rounded-lg bg-[var(--lms-success-subtle)] px-3 py-2 text-sm font-semibold text-success"
      >
        Assignment submitted successfully.
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 rounded-lg border border-border bg-[var(--lms-neutral-50)] p-4"
    >
      <fieldset disabled={submitting && submissionType !== "FILE"}>
        <legend className="text-sm font-semibold text-foreground">
          Submit Your Work
        </legend>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Add your work using the method below. Submission is final once recorded.
        </p>

        <div
          className="mt-3 flex flex-wrap gap-2"
          role="group"
          aria-label="Submission type"
        >
          <Button
            type="button"
            size="sm"
            disabled={submitting||!methodsLoaded||!mayWrite}
            variant={
              submissionType === "TEXT"
                ? "primary"
                : "secondary"
            }
            aria-pressed={
              submissionType === "TEXT"
            }
            onClick={() =>
              setSubmissionType("TEXT")
            }
          >
            Written response
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={submitting||!methodsLoaded||!mayLink}
            variant={
              submissionType === "LINK"
                ? "primary"
                : "secondary"
            }
            aria-pressed={
              submissionType === "LINK"
            }
            onClick={() =>
              setSubmissionType("LINK")
            }
          >
            External Link
          </Button>
          <Button type="button" size="sm" disabled={!methodsLoaded || submitting ||
              (multipartEnabled ? !(mayWrite&&mayLink) && !(fileUploadsEnabled&&mayUpload) : !fileUploadsEnabled || !mayUpload)}
            variant={submissionType === "FILE" ? "primary" : "secondary"}
            aria-pressed={submissionType === "FILE"} onClick={() => setSubmissionType("FILE")}>
            {multipartEnabled?"Combine work":"File Upload"}
          </Button>
        </div>

        {methodsError?<p role="alert" className="mt-2 text-sm text-error">{methodsError}</p>:null}
        {methodsEnabled&&!methodsLoaded&&!methodsError?<p role="status" className="mt-2 text-xs">Loading allowed submission methods…</p>:null}
        {!fileUploadsEnabled ? <p className="mt-2 text-xs text-muted-foreground">File uploads are currently unavailable. You can submit a written response or an HTTPS link.</p> : null}
        {submissionType==="LINK"&&methodsEnabled&&mayLink?
          <label className="mt-3 grid gap-1 text-sm">Link type
            <select value={linkKind} disabled={submitting}
              className="min-h-10 rounded border border-border bg-surface p-2"
              onChange={event=>setLinkKind(event.target.value as typeof linkKind)}>
              {allowedMethods.includes("REPOSITORY_LINK")?<option value="REPOSITORY_LINK">Repository Link</option>:null}
              {allowedMethods.includes("EXTERNAL_LINK")?<option value="EXTERNAL_LINK">Website / External Link</option>:null}
            </select>
          </label>:null}
        {submissionType === "FILE" ? <AssignmentFileSubmissionControl
          assignmentId={assignmentId} deliveryId={deliveryId} onBusyChange={setSubmitting} multipartEnabled={multipartEnabled} uploadsAllowed={fileUploadsEnabled&&mayUpload} pdfOnly={methodsEnabled&&!allowedMethods.includes("FILE_UPLOAD")&&allowedMethods.includes("PDF_UPLOAD")}
          onSubmitted={() => { setSuccess(true); router.refresh(); }} /> : submissionType === "TEXT" ? (
          <section className="mt-4">
            <h3 className="mb-1.5 text-xs font-semibold text-body">Written response</h3>
            <LearnerRichResponseEditor value={textContent} onChange={setTextContent} disabled={submitting}/>
          </section>
        ) : (
          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Website / External Links
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

        {error ? (
          <p
            role="alert"
            className="mt-3 text-sm font-semibold text-error"
          >
            Assignment was not submitted. {error}
          </p>
        ) : null}

        {submissionType !== "FILE" ? <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!methodsLoaded||Boolean(methodsError)}>
            {submitting
              ? "Submitting…"
              : error?"Retry":"Submit"}
          </Button>
          <span className="text-xs text-muted-foreground">
            You cannot replace the submission
            after it is recorded.
          </span>
        </div> : null}
      </fieldset>
    </form>
  );
}
