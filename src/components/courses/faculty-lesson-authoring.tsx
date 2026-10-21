"use client";
import { Radio } from "@/components/ui/radio";
import { Checkbox } from "@/components/ui/checkbox";
import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {apiFetch} from "@/lib/api-fetch";
import { Input } from "@/components/ui/input";
import { FacultyAssignmentMethodPicker } from "./faculty-assignment-method-picker";
import {FacultyAssignmentResourceDraftFields} from "./faculty-assignment-resource-draft-fields";
import {
 facultyAssignmentResourcesSchema,type FacultyAssignmentResourceInput,
} from "@/modules/courses/faculty-assignment-authoring-model";
import { LessonResourceMaterialsControl } from "./lesson-resource-materials-control";
import type { AssignmentMethod } from "@/modules/courses/assignment-submission-methods";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { authoringDueInstant } from "@/modules/courses/faculty-authoring-datetime-model";
import {FacultyIstQuarterHourPicker} from "@/components/courses/faculty-ist-quarter-hour-picker";
import {FACULTY_IST_NOTE,facultyIstQuarterHourIssue} from "@/modules/courses/faculty-ist-quarter-hour-model";
import { facultyYouTubeLinkIssue,facultyLiveClassIssue } from "@/modules/courses/faculty-content-input-model";


type Mode =
  | "RESOURCE"
  | "YOUTUBE"
  | "LIVE_CLASS"
  | "ASSIGNMENT"
  | "QUIZ";

type QuizOptionDraft = {
  id: number;
  text: string;
  correct: boolean;
};

type QuizQuestionDraft = {
  id: number;
  type:
    | "SINGLE_CHOICE"
    | "MULTIPLE_CHOICE";
  prompt: string;
  points: string;
  options: QuizOptionDraft[];
};

const initialQuestion = (): QuizQuestionDraft => ({
  id: 1,
  type: "SINGLE_CHOICE",
  prompt: "",
  points: "1",
  options: [
    { id: 1, text: "", correct: true },
    { id: 2, text: "", correct: false },
  ],
});

function FieldLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="mb-1.5 block text-[13px] leading-4 font-semibold text-body">
      {children}
    </span>
  );
}

export function FacultyLessonAuthoring({
  lessonId,
  deliveryId,
  audience = "SECTION",
  nextContentSequence,
  nextAssignmentSequence,
  nextQuizSequence,
  initialMode = null,
  availableModes,
  onSaved,
  enableAssignmentResources = true,
}: {
  lessonId: string;
  deliveryId: string | null;
  audience?: "SECTION" | "OFFERING";
  nextContentSequence: number;
  nextAssignmentSequence: number;
  nextQuizSequence: number;
  initialMode?: Mode | null;
  availableModes?: readonly Mode[];
  onSaved?: () => void;
  enableAssignmentResources?: boolean;
}) {
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] =
    useState<Mode | null>(initialMode);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [url, setUrl] = useState("");
  const [durationSeconds, setDurationSeconds] =
    useState("");
  const [contentPoints,setContentPoints]=useState("1");
  const [startsAt, setStartsAt] =
    useState("");
  const [endsAt, setEndsAt] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [maxPoints, setMaxPoints] =
    useState("");
  const [allowedAssignmentMethods, setAllowedAssignmentMethods] =
    useState<AssignmentMethod[]>(["WRITTEN_RESPONSE"]);
  const [maxAttempts, setMaxAttempts] =
    useState("1");
  const [assignmentResources,setAssignmentResources]=
    useState<FacultyAssignmentResourceInput[]>([{kind:"INSTRUCTIONS",title:"Instructions",body:""}]);
  const [resourceUploading,setResourceUploading]=useState(false);
  const [questions, setQuestions] =
    useState<QuizQuestionDraft[]>([
      initialQuestion(),
    ]);
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [success, setSuccess] =
    useState<string | null>(null);
  const [publishNow,setPublishNow]=useState(true);
  const [createdResourceTarget,setCreatedResourceTarget]=useState<{
    contentId:string;lessonId:string;deliveryId:string|null;
  }|null>(null);
  const [discardConfirm,setDiscardConfirm]=useState(false);
  const [externalLinkTitle,setExternalLinkTitle]=useState("");

  function reset() {
    setTitle("");
    setNotes("");
    setUrl("");
    setExternalLinkTitle("");
    setDurationSeconds("");
    setContentPoints("1");
    setStartsAt("");
    setEndsAt("");
    setDueAt("");
    setMaxPoints("");
    setAllowedAssignmentMethods(["WRITTEN_RESPONSE"]);
    setAssignmentResources([{kind:"INSTRUCTIONS",title:"Instructions",body:""}]);
    setMaxAttempts("1");
    setQuestions([initialQuestion()]);
  }

  const draftDirty=Boolean(title.trim()||notes.trim()||url.trim()||externalLinkTitle.trim()||startsAt||
    endsAt||dueAt||durationSeconds!==""||contentPoints!=="1"||maxPoints!==""||maxAttempts!=="1"||
    allowedAssignmentMethods.length!==1||allowedAssignmentMethods[0]!=="WRITTEN_RESPONSE"||
    assignmentResources.some(row=>!(row.kind==="INSTRUCTIONS"&&row.title==="Instructions"&&row.body===""))||
    questions.some(question=>question.prompt.trim()||question.options.some(option=>option.text.trim())));

  useEffect(()=>{
    if(!mode||!draftDirty)return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
    window.addEventListener("beforeunload",warn);
    return ()=>window.removeEventListener("beforeunload",warn);
  },[mode,draftDirty]);

  function discardDraft(){
    setMode(null);setError(null);setSuccess(null);reset();
    setCreatedResourceTarget(null);
    setDiscardConfirm(false);
  }
  function close(){
    if(draftDirty){setDiscardConfirm(true);return;}
    discardDraft();
  }

  async function post(
    endpoint: string,
    body: unknown,
  ) {
    return apiFetch<{content?:{id:string};assignment?:{id:string}}>(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });


  }

  function quizPayload() {
    const normalized = questions.map(
      (question, questionIndex) => {
        const prompt = question.prompt.trim();
        const points = Number(
          question.points,
        );
        const options = question.options.map(
          (option, optionIndex) => ({
            text: option.text.trim(),
            correct: option.correct,
            sequence: optionIndex,
          }),
        );

        if (!prompt) {
          throw new Error(
            `Question ${questionIndex + 1} needs a prompt.`,
          );
        }
        if (
          !Number.isInteger(points) ||
          points < 1 ||
          points > 100
        ) {
          throw new Error(
            `Question ${questionIndex + 1} points must be between 1 and 100.`,
          );
        }
        if (
          options.some(
            (option) => !option.text,
          )
        ) {
          throw new Error(
            `Question ${questionIndex + 1} has an empty option.`,
          );
        }

        const correctCount =
          options.filter(
            (option) => option.correct,
          ).length;

        if (
          question.type ===
            "SINGLE_CHOICE" &&
          correctCount !== 1
        ) {
          throw new Error(
            `Question ${questionIndex + 1} must have exactly one correct answer.`,
          );
        }

        if (
          question.type ===
            "MULTIPLE_CHOICE" &&
          (correctCount < 1 ||
            correctCount >= options.length)
        ) {
          throw new Error(
            `Question ${questionIndex + 1} must have at least one correct and one incorrect option.`,
          );
        }

        return {
          type: question.type,
          prompt,
          points,
          sequence: questionIndex,
          options,
        };
      },
    );

    return normalized;
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (!mode || resourceUploading) return;

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      let createdContentId:string|null=null;
      const cleanTitle = title.trim();
      if (!cleanTitle || cleanTitle.length > 255) {
        titleRef.current?.focus();
        throw new Error(
          mode === "RESOURCE"
            ? "Choose a course/lesson and enter a Resource title (1–255 characters)."
            : mode === "ASSIGNMENT"
              ? "Enter assignment title."
              : "Enter a title before saving.",
        );
      }

      if (["RESOURCE","YOUTUBE","LIVE_CLASS"].includes(mode??"") && !contentPoints.trim())
        throw new Error("Points are required.");
      const contentPointValue=Number(contentPoints);
      if (["RESOURCE","YOUTUBE","LIVE_CLASS"].includes(mode??"") &&
        (!Number.isInteger(contentPointValue)||contentPointValue<0||contentPointValue>1000))
        throw new Error("Points must be a whole number between 0 and 1000.");

      if (mode === "RESOURCE") {
        const resourceLink = url.trim();
        if(externalLinkTitle.trim() && !resourceLink)throw new Error("Enter a link for the titled resource.");
        if (!notes.trim() && !resourceLink) {
          throw new Error("Add notes or an HTTPS resource link.");
        }
        if (resourceLink) {
          let address: URL;
          try {
            address = new URL(resourceLink);
          } catch {
            throw new Error("Enter a valid HTTPS Resource link.");
          }
          if (address.protocol !== "https:" || address.username || address.password ||
              /\s/.test(resourceLink)) {
            throw new Error("Enter a valid HTTPS Resource link.");
          }
        }

        const receipt=await post(
          "/api/courses/lesson-contents",
          {
            lessonId,
            deliveryId,
            contentType: "RESOURCE",
            title: cleanTitle,
            points: contentPointValue,
            notes:
              notes.trim() || null,
            externalUrl: resourceLink || null,
            sequence:
              nextContentSequence,
          },
        );
        createdContentId=receipt.content?.id??null;
        if(!createdContentId)throw new Error("The new content receipt is missing. Refresh before retrying.");
        // Preserve a per-link title as a distinct child material record rather
        // than rewriting the parent external URL or other existing materials.
        if(resourceLink&&externalLinkTitle.trim()){
          await apiFetch("/api/courses/lesson-contents/"+encodeURIComponent(createdContentId)+
            "/materials"+(deliveryId?"?deliveryId="+encodeURIComponent(deliveryId):""),{
            method:"POST",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({action:"ADD_LINK",title:externalLinkTitle.trim(),
              externalUrl:resourceLink,notes:null}),
          });
        }
      }

      if (mode === "YOUTUBE") {
        const issue=facultyYouTubeLinkIssue(url.trim());
        if(issue)throw new Error(issue);
        const duration = Number(
          durationSeconds,
        );
        if (
          !Number.isInteger(duration) ||
          duration < 1 ||
          duration > 86400
        ) {
          throw new Error(
            "Duration must be between 1 and 86400 seconds.",
          );
        }

        const receipt=await post(
          "/api/courses/lesson-contents",
          {
            lessonId,
            deliveryId,
            contentType: "YOUTUBE",
            title: cleanTitle,
            points: contentPointValue,
            notes:
              notes.trim() || null,
            externalUrl: url.trim(),
            durationSeconds: duration,
            sequence:
              nextContentSequence,
          },
        );
        createdContentId=receipt.content?.id??null;
        if(!createdContentId)throw new Error("The new content receipt is missing. Refresh before retrying.");
      }

      if (mode === "LIVE_CLASS") {
        const startIso =
          authoringDueInstant(startsAt);
        const endIso =
          authoringDueInstant(endsAt);

        if (!startIso || !endIso) {
          throw new Error(
            "Choose valid start and end times.",
          );
        }
        const timingIssue=facultyLiveClassIssue(url.trim(),startIso,endIso);
        if(timingIssue)throw new Error(timingIssue);

        const receipt=await post(
          "/api/courses/lesson-contents",
          {
            lessonId,
            deliveryId,
            contentType: "LIVE_CLASS",
            title: cleanTitle,
            points: contentPointValue,
            notes:
              notes.trim() || null,
            externalUrl: url.trim(),
            startsAt: startIso,
            endsAt: endIso,
            sequence:
              nextContentSequence,
          },
        );
        createdContentId=receipt.content?.id??null;
        if(!createdContentId)throw new Error("The new content receipt is missing. Refresh before retrying.");
      }

      if (mode === "ASSIGNMENT") {
        // Empty points means an ungraded assignment (zero); entered values
        // follow the legacy authoring constraint of whole numbers 1–1000.
        const rawPoints = maxPoints.trim();
        const points = rawPoints === "" ? 0 : Number(rawPoints);
        if (rawPoints !== "" &&
            (!Number.isInteger(points) || points < 1 || points > 1000)) {
          throw new Error("Enter a whole number from 1 to 1000.");
        }
        if (allowedAssignmentMethods.length === 0) {
          throw new Error("Select at least one allowed submission method.");
        }

        const payload={
          lessonId,title:cleanTitle,description:notes.trim()||null,
          dueAt:authoringDueInstant(dueAt),maxPoints:points,
          allowedMethods:allowedAssignmentMethods,sequence:nextAssignmentSequence,
        };
        if(enableAssignmentResources&&deliveryId){
          const resourcesForSave=assignmentResources.filter(row=>
            !(row.kind==="INSTRUCTIONS"&&row.title==="Instructions"&&!row.body?.trim()));
          const checked=facultyAssignmentResourcesSchema.safeParse(resourcesForSave);
          if(!checked.success)throw new Error(
            checked.error.issues[0]?.message??"Check the assignment resources.");
          const receipt=await post(
            "/api/courses/faculty/assignments/"+
              encodeURIComponent(deliveryId)+"/command",{
              ...payload,action:"CREATE",confirmed:true,resources:checked.data,
            });
          if(!receipt.assignment?.id)throw new Error(
            "The assignment save receipt is missing. Refresh before retrying.");
        }else{
          await post("/api/courses/assignments",{...payload,deliveryId});
        }
      }

      if (mode === "QUIZ") {
        const attempts = Number(
          maxAttempts,
        );
        if (
          !Number.isInteger(attempts) ||
          attempts < 1 ||
          attempts > 20
        ) {
          throw new Error(
            "Quiz attempts must be between 1 and 20.",
          );
        }

        await post(
          "/api/courses/quizzes",
          {
            lessonId,
            deliveryId,
            title: cleanTitle,
            description:
              notes.trim() || null,
            dueAt:
              authoringDueInstant(dueAt),
            maxAttempts: attempts,
            sequence: nextQuizSequence,
            questions: quizPayload(),
          },
        );
      }

      if(mode==="RESOURCE"&&createdContentId){
        // Parent UUID is now authoritative; child links are scoped separately.
        setCreatedResourceTarget({contentId:createdContentId,lessonId,deliveryId});
      }
      if(createdContentId&&publishNow){
        try{
          await post("/api/courses/lesson-contents/"+
            encodeURIComponent(createdContentId)+"/transition",{action:"PUBLISH"});
        }catch{
          throw new Error("Content saved as a draft but could not publish. Open it and choose Publish.");
        }
      }
      setSuccess(
        mode==="RESOURCE"?"Resource saved":
        mode==="LIVE_CLASS"?"Live class created successfully":
        mode==="YOUTUBE"?"YouTube video created successfully":
        mode==="ASSIGNMENT"?"Assignment created successfully":
        mode==="QUIZ"?"Quiz draft created.":"Server Notification: Successfully Saved",
      );
      reset();
      onSaved?.();
      router.refresh();
    } catch (caught) {
      const message=caught instanceof Error?caught.message:"Could not create the Course item.";
      setError(/FORBIDDEN|ACCESS_DENIED|403|PERMISSION/i.test(message)
        ?"You do not have permission to create this item for the selected class. Confirm your active Faculty assignment."
        : /UNAUTHORIZED|401|SESSION/i.test(message)
        ?"Your session expired. Sign in again, then reopen this lesson."
        : /VALIDATION|INVALID_REQUEST/i.test(message)
        ?"Check the required fields, dates, and selected audience. "+message
        : message);
    } finally {
      setSubmitting(false);
    }
  }

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      {
        ...initialQuestion(),
        id:
          Math.max(
            ...current.map(
              (question) => question.id,
            ),
            0,
          ) + 1,
      },
    ]);
  }

  function updateQuestion(
    questionId: number,
    patch: Partial<QuizQuestionDraft>,
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? { ...question, ...patch }
          : question,
      ),
    );
  }

  function updateOption(
    questionId: number,
    optionId: number,
    patch: Partial<QuizOptionDraft>,
  ) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) {
          return question;
        }

        let options = question.options.map(
          (option) =>
            option.id === optionId
              ? { ...option, ...patch }
              : option,
        );

        if (
          patch.correct === true &&
          question.type ===
            "SINGLE_CHOICE"
        ) {
          options = options.map((option) => ({
            ...option,
            correct:
              option.id === optionId,
          }));
        }

        return { ...question, options };
      }),
    );
  }

  function addOption(questionId: number) {
    setQuestions((current) =>
      current.map((question) => {
        if (
          question.id !== questionId ||
          question.options.length >= 20
        ) {
          return question;
        }

        const id =
          Math.max(
            ...question.options.map(
              (option) => option.id,
            ),
            0,
          ) + 1;

        return {
          ...question,
          options: [
            ...question.options,
            {
              id,
              text: "",
              correct: false,
            },
          ],
        };
      }),
    );
  }

  function removeOption(
    questionId: number,
    optionId: number,
  ) {
    setQuestions((current) =>
      current.map((question) => {
        if (
          question.id !== questionId ||
          question.options.length <= 2
        ) {
          return question;
        }

        const options =
          question.options.filter(
            (option) =>
              option.id !== optionId,
          );

        if (
          question.type ===
            "SINGLE_CHOICE" &&
          !options.some(
            (option) => option.correct,
          )
        ) {
          options[0] = {
            ...options[0],
            correct: true,
          };
        }

        return {
          ...question,
          options,
        };
      }),
    );
  }

  return (
    <div className="mt-4 min-w-0 space-y-4 border-t border-[var(--lms-canvas-border)] pt-4 max-md:[&_button]:min-h-11">
      <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <h2 className="m-0 text-base font-semibold leading-6 text-[var(--lms-heading)]">
            {audience === "OFFERING"
              ? "Add shared learning item"
              : "Add to this Section"}
          </h2>
          <p className="mt-1 max-w-prose text-[13px] leading-5 text-muted-foreground">
            {audience === "OFFERING"
              ? "New items are DRAFT and shared across every Section Delivery in this Offering."
              : "New items are DRAFT and target only this exact Section delivery."}
          </p>
        </div>
        {mode ? (
          <Button
            size="md"
            variant="ghost"
            onClick={close}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        ) : null}
      </div>

      {!mode ? (
        <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {(!availableModes || availableModes.includes("RESOURCE")) ? (
          <Button
            size="md"
            variant="primary"
            className="w-full sm:w-auto"
            onClick={() =>
              setMode("RESOURCE")
            }
          >
            + Resource
          </Button>
          ) : null}
          {(!availableModes || availableModes.includes("YOUTUBE")) ? (
          <Button
            size="md"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() =>
              setMode("YOUTUBE")
            }
          >
            + YouTube
          </Button>
          ) : null}
          {(!availableModes || availableModes.includes("LIVE_CLASS")) ? (
          <Button
            size="md"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() =>
              setMode("LIVE_CLASS")
            }
          >
            + Live class
          </Button>
          ) : null}
          {(!availableModes || availableModes.includes("ASSIGNMENT")) ? (
          deliveryId?<Link
            href={"/teacher/courses/"+encodeURIComponent(deliveryId)+"/assignments/manage"}
            className="inline-flex min-h-11 min-w-0 items-center justify-center break-words text-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-[650] text-primary-text transition-colors hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-[var(--lms-control-height)]">
            + Assignment · Full builder
          </Link>:<Button size="md" variant="secondary" onClick={()=>setMode("ASSIGNMENT")}>
            + Assignment
          </Button>
          ) : null}
          {(!availableModes || availableModes.includes("QUIZ")) ? (
          deliveryId?<Link
            href={"/teacher/courses/"+encodeURIComponent(deliveryId)+"/quizzes/manage"}
            className="inline-flex min-h-11 min-w-0 items-center justify-center break-words text-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-[650] text-primary-text transition-colors hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-[var(--lms-control-height)]">
            + Quiz · Full builder
          </Link>:<Button size="md" variant="secondary" onClick={()=>setMode("QUIZ")}>
            + Quiz
          </Button>
          ) : null}
        </div>
      ) : (
        <form
          className="min-w-0 space-y-4 border-t border-[var(--lms-canvas-border)] pt-4"
          onSubmit={submit}
        >
          <fieldset disabled={submitting}>
            {error ? <Alert tone="error" className="mb-4">{error}</Alert> : null}
            {success ? <Alert tone="success" className="mb-4">{success}</Alert> : null}
            {mode==="ASSIGNMENT"||mode==="RESOURCE"?<label className="block min-w-0 text-[13px] font-semibold md:col-span-2">
              <FieldLabel>Visibility</FieldLabel>
              <Select value={audience==="SECTION"?"CLASS":"SHARED"} disabled
               aria-label="Visibility (set by the authorized course scope)">
               <option value="CLASS">Class</option>
               <option value="SHARED">Shared with all eligible sections</option>
              </Select>
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                Visibility is locked to the selected {audience==="SECTION"?"Section":"Course Offering"}.
                Choose a different scope in the college course workspace; a faculty
                author cannot promote a class resource into a shared one.
              </span>
             </label>:null}
            {mode==="ASSIGNMENT"?<h3 className="text-base font-semibold md:col-span-2">Assignment Details</h3>:null}
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                <FieldLabel>
                  {mode==="ASSIGNMENT"?"Assignment Title":mode==="RESOURCE"?"Resource Title":"Content Title"}
                </FieldLabel>
                <Input
                  ref={titleRef}
                  aria-label={mode==="ASSIGNMENT"?"Assignment Title":"Content Title"}
                  placeholder={mode==="ASSIGNMENT"?"Assignment title":"Enter a content title"}
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value,
                    )
                  }
                  maxLength={255}
                  required
                />
              </label>

              {(mode==="RESOURCE"||mode==="YOUTUBE"||mode==="LIVE_CLASS")?
                <label className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                  <FieldLabel>Points</FieldLabel>
                  <Input type="number" min={0} max={1000} value={contentPoints}
                    onChange={event=>setContentPoints(event.target.value)} required/>
                </label>:null}

              {mode === "YOUTUBE" ? (
                <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                  <FieldLabel>
                    Actual video duration (seconds)
                  </FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    max={86400}
                    value={durationSeconds}
                    onChange={(event) =>
                      setDurationSeconds(
                        event.target.value,
                      )
                    }
                    required
                  />
                </label>
              ) : null}

              {mode==="ASSIGNMENT"? <p className="text-xs text-muted-foreground md:col-span-2">
                A new assignment is attached to the selected {audience==="OFFERING"?"Course Offering":"Section"}.
                Only authorized Faculty can create and publish; learners cannot author lesson content.
              </p>:null}
              {mode === "QUIZ" ? (
                <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                  <FieldLabel>
                    Maximum attempts
                  </FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={maxAttempts}
                    onChange={(event) =>
                      setMaxAttempts(
                        event.target.value,
                      )
                    }
                    required
                  />
                </label>
              ) : null}
            </div>

            {mode === "RESOURCE" ||
            mode === "YOUTUBE" ||
            mode === "LIVE_CLASS" ? (
              <label className="mt-4 block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                <FieldLabel>
                  {mode === "YOUTUBE"
                    ? "YouTube URL"
                    : mode ===
                        "LIVE_CLASS"
                      ? "Meeting URL"
                      : "Resource URL (optional when notes are provided)"}
                </FieldLabel>
                <Input
                  type="url"
                  inputMode="url"
                  value={url}
                  onChange={(event) =>
                    setUrl(
                      event.target.value,
                    )
                  }
                  placeholder="https://…"
                  required={
                    mode !== "RESOURCE"
                  }
                />
              </label>
            ) : null}

            {mode==="RESOURCE"&&url.trim()?<label className="mt-3 block text-[13px] font-semibold">
              Link title (optional)
              <Input value={externalLinkTitle} maxLength={255} placeholder="Reading link"
                onChange={event=>setExternalLinkTitle(event.target.value)}/>
            </label>:null}
            {mode === "RESOURCE" ? (
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Resource materials support notes and individually titled HTTPS
                links. A lesson file must have a CLEAN, server-verified private
                upload receipt before it can be attached. This editor does not
                accept unscanned local file paths or public storage URLs.
              </p>
            ) : null}

            {(mode==="RESOURCE"||mode==="YOUTUBE"||mode==="LIVE_CLASS")?
              <label className="mt-4 flex min-h-11 items-center gap-3 text-sm leading-5 text-body">
                <Checkbox  checked={publishNow} onChange={event=>setPublishNow(event.target.checked)}/>
                Publish now — make this learning item visible to eligible students
              </label>:null}
            {mode === "LIVE_CLASS" ? (
              <div className="mt-4 space-y-2">
                <div className="grid min-w-0 gap-4 xl:grid-cols-2">
                  <FacultyIstQuarterHourPicker label="Starts" value={startsAt} onChange={setStartsAt}/>
                  <FacultyIstQuarterHourPicker label="Ends" value={endsAt} onChange={setEndsAt}/>
                </div>
                <p className="text-xs text-muted-foreground leading-5">
                  {FACULTY_IST_NOTE} Times use a 12-hour clock and 15-minute steps.
                </p>
                {(startsAt&&facultyIstQuarterHourIssue(startsAt)||
                  endsAt&&facultyIstQuarterHourIssue(endsAt))?
                  <Alert tone="warning">Choose 15-minute start and end times before publishing.</Alert>:null}
              </div>
            ) : null}

            {mode === "ASSIGNMENT" ? (
              <div className="mt-4 min-w-0">
                <h3 className="mb-2 font-semibold">How Learners Can Submit</h3>
                <FacultyAssignmentMethodPicker
                  methods={allowedAssignmentMethods}
                  onChange={setAllowedAssignmentMethods}
                  disabled={submitting}
                />
              </div>
            ) : null}

            {mode==="ASSIGNMENT"? <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-2">
  {mode === "ASSIGNMENT" ? (
    <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
      <FieldLabel>
        Maximum points
      </FieldLabel>
      <Input
        type="number"
        min={1}
        max={1000}
        value={maxPoints}
        onChange={(event) =>
          setMaxPoints(
            event.target.value,
          )
        }
      />
      <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
        Leave blank for zero points, or enter a whole number from 1 to 1000.
      </span>
    </label>
  ) : null}


              <label className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                <FieldLabel>Due Date</FieldLabel>
                <Input type="datetime-local" value={dueAt} onChange={event=>setDueAt(event.target.value)}/>
                <span className="mt-1 block text-xs text-muted-foreground">Times are in IST. Leave blank when the assignment has no deadline.</span>
              </label>
             </div>:null}
            {mode==="QUIZ"? <label className="mt-4 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              <FieldLabel>Due date (IST, required before publishing)</FieldLabel>
              <Input type="datetime-local" value={dueAt} onChange={event=>setDueAt(event.target.value)}/>
             </label>:null}

            {mode==="ASSIGNMENT"?<h3 className="mt-4 font-semibold">Assignment Resources</h3>:null}
            {mode==="ASSIGNMENT"&&enableAssignmentResources&&deliveryId?
              <FacultyAssignmentResourceDraftFields deliveryId={deliveryId}
                resources={assignmentResources} onChange={setAssignmentResources}
                disabled={submitting} onPendingChange={setResourceUploading}/>
              :null}
            <details key={mode} open={mode === "RESOURCE" || Boolean(notes)}
              className="mt-4 min-w-0 border-y border-[var(--lms-canvas-border)] py-2">
              <summary className="flex min-h-11 cursor-pointer items-center py-2 text-[13px] font-semibold text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
                {mode === "ASSIGNMENT" || mode === "QUIZ" ? "Description (optional)" : "Notes (optional)"}
              </summary>
            <label className="block min-w-0 pt-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              <FieldLabel>
                {mode === "ASSIGNMENT" ||
                mode === "QUIZ"
                  ? "Description (optional)"
                  : "Notes (optional)"}
              </FieldLabel>
              <Textarea
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value,
                  )
                }
                maxLength={
                  mode === "ASSIGNMENT" ||
                  mode === "QUIZ"
                    ? 10000
                    : 5000
                }
              />
            </label>
            </details>

            {mode === "QUIZ" ? (
              <div className="mt-5 min-w-0 space-y-4">
                {questions.map(
                  (
                    question,
                    questionIndex,
                  ) => (
                    <section
                      key={question.id}
                      className="min-w-0 space-y-3 border-t border-[var(--lms-canvas-border)] py-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="m-0 text-sm font-semibold text-foreground leading-[22px]">
                          Question{" "}
                          {questionIndex + 1}
                        </p>
                        {questions.length >
                        1 ? (
                          <Button
                            type="button"
                            size="md"
                            variant="ghost"
                            onClick={() =>
                              setQuestions(
                                (
                                  current,
                                ) =>
                                  current.filter(
                                    (
                                      candidate,
                                    ) =>
                                      candidate.id !==
                                      question.id,
                                  ),
                              )
                            }
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>

                      <label className="mt-3 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                        <FieldLabel>
                          Prompt
                        </FieldLabel>
                        <Textarea
                          value={
                            question.prompt
                          }
                          onChange={(
                            event,
                          ) =>
                            updateQuestion(
                              question.id,
                              {
                                prompt:
                                  event
                                    .target
                                    .value,
                              },
                            )
                          }
                          maxLength={5000}
                          required
                        />
                      </label>

                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                          <FieldLabel>
                            Answer type
                          </FieldLabel>
                          <Select
                            value={
                              question.type
                            }
                            onChange={(
                              event,
                            ) => {
                              const type =
                                event
                                  .target
                                  .value as QuizQuestionDraft["type"];
                              const options =
                                question.options.map(
                                  (
                                    option,
                                    index,
                                  ) => ({
                                    ...option,
                                    correct:
                                      type ===
                                      "SINGLE_CHOICE"
                                        ? index ===
                                          0
                                        : option.correct,
                                  }),
                                );
                              updateQuestion(
                                question.id,
                                {
                                  type,
                                  options,
                                },
                              );
                            }}
                          >
                            <option value="SINGLE_CHOICE">
                              Single choice
                            </option>
                            <option value="MULTIPLE_CHOICE">
                              Multiple choice
                            </option>
                          </Select>
                        </label>
                        <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                          <FieldLabel>
                            Points
                          </FieldLabel>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={
                              question.points
                            }
                            onChange={(
                              event,
                            ) =>
                              updateQuestion(
                                question.id,
                                {
                                  points:
                                    event
                                      .target
                                      .value,
                                },
                              )
                            }
                            required
                          />
                        </label>
                      </div>

                      <div className="mt-4 space-y-2">
                        {question.options.map(
                          (
                            option,
                            optionIndex,
                          ) => (
                            <div
                              key={
                                option.id
                              }
                              className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 border-b border-[var(--lms-canvas-border)] py-2 md:grid-cols-[auto_minmax(0,1fr)_auto]"
                            >
                              {question.type === "SINGLE_CHOICE" ? <Radio
                                aria-label={`Correct answer for option ${optionIndex + 1}`}
                                
                                name={`correct-${question.id}`}
                                checked={
                                  option.correct
                                }
                                onChange={() =>
                                  updateOption(
                                    question.id,
                                    option.id,
                                    {
                                      correct:
                                        question.type ===
                                        "SINGLE_CHOICE"
                                          ? true
                                          : !option.correct,
                                    },
                                  )
                                }
                                className="h-5 w-5 accent-[var(--lms-primary)]"
                              /> : <Checkbox
                                aria-label={`Correct answer for option ${optionIndex + 1}`}
                                
                                name={`correct-${question.id}`}
                                checked={
                                  option.correct
                                }
                                onChange={() =>
                                  updateOption(
                                    question.id,
                                    option.id,
                                    {
                                      correct:
                                        question.type ===
                                        "SINGLE_CHOICE"
                                          ? true
                                          : !option.correct,
                                    },
                                  )
                                }
                                className="h-5 w-5 accent-[var(--lms-primary)]"
                              />}
                              <Input
                                aria-label={`Option ${optionIndex + 1}`}
                                value={
                                  option.text
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateOption(
                                    question.id,
                                    option.id,
                                    {
                                      text:
                                        event
                                          .target
                                          .value,
                                    },
                                  )
                                }
                                maxLength={2000}
                                className="min-w-0"
                                placeholder={`Option ${optionIndex + 1}`}
                                required
                              />
                              {question.options
                                .length >
                              2 ? (
                                <Button
                                  type="button"
                                  size="md"
                                  variant="ghost"
                                  className="col-span-2 w-full justify-self-end md:col-auto md:w-auto"
                                  onClick={() =>
                                    removeOption(
                                      question.id,
                                      option.id,
                                    )
                                  }
                                >
                                  Remove
                                </Button>
                              ) : null}
                            </div>
                          ),
                        )}
                      </div>

                      {question.options
                        .length < 20 ? (
                        <Button
                          type="button"
                          className="mt-3"
                          size="md"
                          variant="secondary"
                          onClick={() =>
                            addOption(
                              question.id,
                            )
                          }
                        >
                          + Option
                        </Button>
                      ) : null}
                    </section>
                  ),
                )}

                {questions.length < 100 ? (
                  <Button
                    type="button"
                    size="md"
                    variant="secondary"
                    onClick={addQuestion}
                  >
                    + Question
                  </Button>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5 flex min-w-0 flex-col gap-3 border-t border-[var(--lms-canvas-border)] pt-4 sm:flex-row sm:items-center sm:justify-end">
              <span className="order-2 text-xs leading-5 text-muted-foreground sm:order-1 sm:mr-auto">
                Review the draft below, then
                publish it when ready.
              </span>
              <Button type="submit" loading={submitting} className="order-1 w-full sm:order-2 sm:w-auto">
                {submitting
                  ? "Creating…"
                  : "Create draft"}
              </Button>
            </div>
          </fieldset>
        </form>
      )}

      {!mode && (!availableModes || availableModes.some((choice) => choice === "RESOURCE" || choice === "YOUTUBE" || choice === "LIVE_CLASS")) ? (
        <p className="mt-3 text-xs text-muted-foreground leading-5">
          Video uploads use the private video manager. Assignment PDF and file
          resources use per-section signed grants and are blocked until scanned;
          learner resources accept titled HTTPS links pending a separate
          verified lesson-material file receipt service.
        </p>
      ) : null}
      {createdResourceTarget &&
       createdResourceTarget.lessonId===lessonId &&
       createdResourceTarget.deliveryId===deliveryId ? (
        <section className="mt-4 min-w-0 space-y-2 border-t border-border pt-4" aria-label="Resource material authoring">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">Materials for the saved Resource</p>
            <Button type="button" size="sm" variant="secondary"
              onClick={()=>setCreatedResourceTarget(null)}>Done adding materials</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Add titled HTTPS links or review verified FILE materials.
            Unverified files cannot be published as attachments.
          </p>
          <LessonResourceMaterialsControl key={createdResourceTarget.contentId}
            contentId={createdResourceTarget.contentId} deliveryId={deliveryId} editable/>
        </section>
      ) : null}
      <ConfirmDialog open={discardConfirm} onOpenChange={value=>{if(!submitting)setDiscardConfirm(value);}}
        title="Discard this content draft?" confirmLabel="Discard draft"
        description="Any unsaved changes in this content form will be lost."
        onConfirm={discardDraft}>
        <p className="text-sm text-body leading-[22px]">Keep editing to preserve the details you entered.</p>
      </ConfirmDialog>
    </div>
  );
}
