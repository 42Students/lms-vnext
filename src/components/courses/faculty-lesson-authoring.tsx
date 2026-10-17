"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {apiFetch} from "@/lib/api-fetch";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { authoringDueInstant } from "@/modules/courses/faculty-authoring-datetime-model";
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
    <span className="mb-1.5 block text-xs font-semibold text-body">
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
}) {
  const router = useRouter();
  const [mode, setMode] =
    useState<Mode | null>(initialMode);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [url, setUrl] = useState("");
  const [durationSeconds, setDurationSeconds] =
    useState("");
  const [startsAt, setStartsAt] =
    useState("");
  const [endsAt, setEndsAt] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [maxPoints, setMaxPoints] =
    useState("10");
  const [maxAttempts, setMaxAttempts] =
    useState("1");
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
  const [discardConfirm,setDiscardConfirm]=useState(false);

  function reset() {
    setTitle("");
    setNotes("");
    setUrl("");
    setDurationSeconds("300");
    setStartsAt("");
    setEndsAt("");
    setDueAt("");
    setMaxPoints("10");
    setMaxAttempts("1");
    setQuestions([initialQuestion()]);
  }

  const draftDirty=Boolean(title.trim()||notes.trim()||url.trim()||startsAt||
    endsAt||dueAt||durationSeconds!==""||maxPoints!=="10"||maxAttempts!=="1"||
    questions.some(question=>question.prompt.trim()||question.options.some(option=>option.text.trim())));

  useEffect(()=>{
    if(!mode||!draftDirty)return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
    window.addEventListener("beforeunload",warn);
    return ()=>window.removeEventListener("beforeunload",warn);
  },[mode,draftDirty]);

  function discardDraft(){
    setMode(null);setError(null);setSuccess(null);reset();
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
    return apiFetch<{content?:{id:string}}>(endpoint, {
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
    if (!mode) return;

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      let createdContentId:string|null=null;
      const cleanTitle = title.trim();
      if (!cleanTitle) {
        throw new Error(
          "Enter a title before saving.",
        );
      }

      if (mode === "RESOURCE") {
        if (!notes.trim() && !url.trim()) {
          throw new Error(
            "Add notes or an HTTPS resource link.",
          );
        }

        const receipt=await post(
          "/api/courses/lesson-contents",
          {
            lessonId,
            deliveryId,
            contentType: "RESOURCE",
            title: cleanTitle,
            notes:
              notes.trim() || null,
            externalUrl:
              url.trim() || null,
            sequence:
              nextContentSequence,
          },
        );
        createdContentId=receipt.content?.id??null;
        if(!createdContentId)throw new Error("The new content receipt is missing. Refresh before retrying.");
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
        const points = Number(maxPoints);
        if (
          !Number.isInteger(points) ||
          points < 0 ||
          points > 1000
        ) {
          throw new Error(
            "Enter a whole number from 0 to 1000",
          );
        }

        await post(
          "/api/courses/assignments",
          {
            lessonId,
            deliveryId,
            title: cleanTitle,
            description:
              notes.trim() || null,
            dueAt:
              authoringDueInstant(dueAt),
            maxPoints: points,
            sequence:
              nextAssignmentSequence,
          },
        );
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
        mode==="ASSIGNMENT"?"Assignment draft created.":
        mode==="QUIZ"?"Quiz draft created.":"Server Notification: Successfully Saved",
      );
      reset();
      onSaved?.();
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not create the Course item.",
      );
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
    <div className="mt-4 rounded-lg border border-dashed border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="m-0 text-sm font-semibold text-foreground">
            {audience === "OFFERING"
              ? "Add shared learning item"
              : "Add to this Section"}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {audience === "OFFERING"
              ? "New items are DRAFT and shared across every Section Delivery in this Offering."
              : "New items are DRAFT and target only this exact Section delivery."}
          </p>
        </div>
        {mode ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={close}
            disabled={submitting}
          >
            Close
          </Button>
        ) : null}
      </div>

      {!mode ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {(!availableModes || availableModes.includes("RESOURCE")) ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setMode("RESOURCE")
            }
          >
            + Resource
          </Button>
          ) : null}
          {(!availableModes || availableModes.includes("YOUTUBE")) ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setMode("YOUTUBE")
            }
          >
            + YouTube
          </Button>
          ) : null}
          {(!availableModes || availableModes.includes("LIVE_CLASS")) ? (
          <Button
            size="sm"
            variant="secondary"
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
            className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">
            + Assignment · Full builder
          </Link>:<Button size="sm" variant="secondary" onClick={()=>setMode("ASSIGNMENT")}>
            + Assignment
          </Button>
          ) : null}
          {(!availableModes || availableModes.includes("QUIZ")) ? (
          deliveryId?<Link
            href={"/teacher/courses/"+encodeURIComponent(deliveryId)+"/quizzes/manage"}
            className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">
            + Quiz · Full builder
          </Link>:<Button size="sm" variant="secondary" onClick={()=>setMode("QUIZ")}>
            + Quiz
          </Button>
          ) : null}
        </div>
      ) : (
        <form
          className="mt-4"
          onSubmit={submit}
        >
          <fieldset disabled={submitting}>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <FieldLabel>
                  Title
                </FieldLabel>
                <Input
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

              {mode === "YOUTUBE" ? (
                <label className="block">
                  <FieldLabel>
                    Duration (seconds)
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

              {mode === "ASSIGNMENT" ? (
                <label className="block">
                  <FieldLabel>
                    Maximum points
                  </FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    max={1000}
                    value={maxPoints}
                    onChange={(event) =>
                      setMaxPoints(
                        event.target.value,
                      )
                    }
                    required
                  />
                </label>
              ) : null}

              {mode === "QUIZ" ? (
                <label className="block">
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
              <label className="mt-4 block">
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

            {(mode==="RESOURCE"||mode==="YOUTUBE"||mode==="LIVE_CLASS")?
              <label className="mt-4 flex min-h-10 items-center gap-2 text-sm text-body">
                <input type="checkbox" checked={publishNow} onChange={event=>setPublishNow(event.target.checked)}/>
                Publish now — make this learning item visible to eligible students
              </label>:null}
            {mode === "LIVE_CLASS" ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <label className="block">
                  <FieldLabel>
                    Starts (IST)
                  </FieldLabel>
                  <Input
                    type="datetime-local"
                    step={900}
                    value={startsAt}
                    onChange={(event) =>
                      setStartsAt(
                        event.target.value,
                      )
                    }
                    required
                  />
                </label>
                <label className="block">
                  <FieldLabel>
                    Ends (IST)
                  </FieldLabel>
                  <Input
                    type="datetime-local"
                    step={900}
                    value={endsAt}
                    onChange={(event) =>
                      setEndsAt(
                        event.target.value,
                      )
                    }
                    required
                  />
                </label>
              </div>
            ) : null}

            {mode==="LIVE_CLASS"?<p className="mt-2 text-xs text-muted-foreground">
              Times are in India Standard Time (IST). Use 15-minute intervals.
            </p>:null}

            {mode === "ASSIGNMENT" ||
            mode === "QUIZ" ? (
              <label className="mt-4 block">
                <FieldLabel>
                  Due date (IST, required before publishing)
                </FieldLabel>
                <Input
                  type="datetime-local"
                  value={dueAt}
                  onChange={(event) =>
                    setDueAt(
                      event.target.value,
                    )
                  }
                />
              </label>
            ) : null}

            <label className="mt-4 block">
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

            {mode === "QUIZ" ? (
              <div className="mt-5 space-y-4">
                {questions.map(
                  (
                    question,
                    questionIndex,
                  ) => (
                    <section
                      key={question.id}
                      className="rounded-lg border border-border bg-[var(--lms-neutral-50)] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="m-0 text-sm font-semibold text-foreground">
                          Question{" "}
                          {questionIndex + 1}
                        </p>
                        {questions.length >
                        1 ? (
                          <Button
                            type="button"
                            size="sm"
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

                      <label className="mt-3 block">
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

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="block">
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
                        <label className="block">
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
                              className="grid gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                            >
                              <input
                                aria-label={`Correct answer for option ${optionIndex + 1}`}
                                type={
                                  question.type ===
                                  "SINGLE_CHOICE"
                                    ? "radio"
                                    : "checkbox"
                                }
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
                                className="h-4 w-4 accent-[var(--lms-primary)]"
                              />
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
                                placeholder={`Option ${optionIndex + 1}`}
                                required
                              />
                              {question.options
                                .length >
                              2 ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
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
                          size="sm"
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
                    size="sm"
                    variant="secondary"
                    onClick={addQuestion}
                  >
                    + Question
                  </Button>
                ) : null}
              </div>
            ) : null}

            {error ? (
              <p
                role="alert"
                className="mt-4 text-sm font-semibold text-error"
              >
                {error}
              </p>
            ) : null}
            {success ? (
              <p
                role="status"
                className="mt-4 text-sm font-semibold text-success"
              >
                {success}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button type="submit">
                {submitting
                  ? "Creating…"
                  : "Create draft"}
              </Button>
              <span className="text-xs text-muted-foreground">
                Review the draft below, then
                publish it when ready.
              </span>
            </div>
          </fieldset>
        </form>
      )}

      {!mode && (!availableModes || availableModes.some((choice) => choice === "RESOURCE" || choice === "YOUTUBE" || choice === "LIVE_CLASS")) ? (
        <p className="mt-3 text-xs text-muted-foreground">
          File/video upload authoring is hidden
          until signed Cloud Storage upload receipts
          are available.
        </p>
      ) : null}
      <ConfirmDialog open={discardConfirm} onOpenChange={setDiscardConfirm}
        title="Discard this content draft?" confirmLabel="Discard draft"
        description="Any unsaved changes in this content form will be lost."
        onConfirm={discardDraft}>
        <p className="text-sm text-body">Keep editing to preserve the details you entered.</p>
      </ConfirmDialog>
    </div>
  );
}
