"use client";
import {CourseChoiceControl} from "./course-choice-control";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { courseApiError } from "./learner-course-api";

type OptionDraft = {
  key: number;
  text: string;
  correct: boolean;
};

type QuestionDraft = {
  key: number;
  type:
    | "SINGLE_CHOICE"
    | "MULTIPLE_CHOICE";
  prompt: string;
  points: string;
  options: OptionDraft[];
};

let nextKey = 1;
function key() {
  nextKey += 1;
  return nextKey;
}

function emptyQuestion(): QuestionDraft {
  return {
    key: key(),
    type: "SINGLE_CHOICE",
    prompt: "",
    points: "1",
    options: [
      {
        key: key(),
        text: "",
        correct: true,
      },
      {
        key: key(),
        text: "",
        correct: false,
      },
    ],
  };
}

export function FacultyQuizQuestionEditor({
  quizId,
  deliveryId,
}: {
  quizId: string;
  deliveryId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] =
    useState<QuestionDraft[]>([]);
  const [expectedUpdatedAt,setExpectedUpdatedAt] = useState<string|null>(null);
  const [loading, setLoading] =
    useState(false);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  async function load() {
    setOpen(true);
    setExpectedUpdatedAt(null);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/courses/quizzes/${encodeURIComponent(
          quizId,
        )}?deliveryId=${encodeURIComponent(
          deliveryId,
        )}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        setError(
          await courseApiError(response),
        );
        return;
      }
      const body = await response.json();
      const stored = body?.quiz?.quiz;
      if (stored?.status !== "DRAFT" || typeof stored.updatedAt !== "string") {
        setError("This quiz changed or is no longer a draft. Refresh the Section.");
        return;
      }
      setExpectedUpdatedAt(stored.updatedAt);
      const rows = body?.quiz?.questions ?? [];
      setQuestions(
        rows.map(
          (question: {
            type:
              | "SINGLE_CHOICE"
              | "MULTIPLE_CHOICE";
            prompt: string;
            points: number;
            options: Array<{
              text: string;
              correct?: boolean;
            }>;
          }) => ({
            key: key(),
            type: question.type,
            prompt: question.prompt,
            points: String(
              question.points,
            ),
            options:
              question.options.map(
                (option) => ({
                  key: key(),
                  text: option.text,
                  correct:
                    option.correct ===
                    true,
                }),
              ),
          }),
        ),
      );
    } catch {
      setError(
        "Could not load Quiz questions.",
      );
    } finally {
      setLoading(false);
    }
  }

  function patchQuestion(
    questionKey: number,
    patch: Partial<QuestionDraft>,
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.key === questionKey
          ? { ...question, ...patch }
          : question,
      ),
    );
  }

  function patchOption(
    questionKey: number,
    optionKey: number,
    patch: Partial<OptionDraft>,
  ) {
    setQuestions((current) =>
      current.map((question) => {
        if (
          question.key !== questionKey
        ) {
          return question;
        }
        let options =
          question.options.map(
            (option) =>
              option.key === optionKey
                ? {
                    ...option,
                    ...patch,
                  }
                : option,
          );
        if (
          question.type ===
            "SINGLE_CHOICE" &&
          patch.correct === true
        ) {
          options = options.map(
            (option) => ({
              ...option,
              correct:
                option.key === optionKey,
            }),
          );
        }
        return {
          ...question,
          options,
        };
      }),
    );
  }

  function changeType(
    question: QuestionDraft,
    type:
      | "SINGLE_CHOICE"
      | "MULTIPLE_CHOICE",
  ) {
    let options = question.options;
    if (type === "SINGLE_CHOICE") {
      const chosen =
        options.find(
          (option) => option.correct,
        )?.key ?? options[0]?.key;
      options = options.map(
        (option) => ({
          ...option,
          correct:
            option.key === chosen,
        }),
      );
    }
    patchQuestion(question.key, {
      type,
      options,
    });
  }

  function addOption(
    question: QuestionDraft,
  ) {
    if (question.options.length >= 20) {
      return;
    }
    patchQuestion(question.key, {
      options: [
        ...question.options,
        {
          key: key(),
          text: "",
          correct: false,
        },
      ],
    });
  }

  function removeOption(
    question: QuestionDraft,
    optionKey: number,
  ) {
    if (question.options.length <= 2) {
      return;
    }
    let options =
      question.options.filter(
        (option) =>
          option.key !== optionKey,
      );
    if (
      question.type ===
        "SINGLE_CHOICE" &&
      !options.some(
        (option) => option.correct,
      )
    ) {
      options = options.map(
        (option, index) => ({
          ...option,
          correct: index === 0,
        }),
      );
    }
    patchQuestion(question.key, {
      options,
    });
  }

  function validate() {
    if (questions.length === 0) {
      return "A Quiz needs at least one question.";
    }
    for (
      let index = 0;
      index < questions.length;
      index += 1
    ) {
      const question = questions[index]!;
      if (!question.prompt.trim()) {
        return `Question ${index + 1} needs a prompt.`;
      }
      const points = Number(
        question.points,
      );
      if (
        !Number.isInteger(points) ||
        points < 1 ||
        points > 1000
      ) {
        return `Question ${index + 1} points must be between 1 and 1000.`;
      }
      if (
        question.options.some(
          (option) =>
            !option.text.trim(),
        )
      ) {
        return `Question ${index + 1} has an empty option.`;
      }
      const correct =
        question.options.filter(
          (option) => option.correct,
        ).length;
      if (
        question.type ===
          "SINGLE_CHOICE" &&
        correct !== 1
      ) {
        return `Question ${index + 1} must have exactly one correct option.`;
      }
      if (
        question.type ===
          "MULTIPLE_CHOICE" &&
        (correct < 1 ||
          correct >=
            question.options.length)
      ) {
        return `Question ${index + 1} must have at least one correct and one incorrect option.`;
      }
    }
    return null;
  }

  async function save() {
    if (saving || loading) return;
    if (!expectedUpdatedAt) {setError("Load the current draft before saving.");return;}
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    if (!window.confirm("Confirm replacement of this draft quiz question bank?")) return;
    setError(null);
    setSaving(true);
    try {
      const response = await fetch(
        `/api/courses/quizzes/${encodeURIComponent(
          quizId,
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            expectedUpdatedAt, confirmed:true,
            questions:
              questions.map(
                (
                  question,
                  questionIndex,
                ) => ({
                  type: question.type,
                  prompt:
                    question.prompt.trim(),
                  points: Number(
                    question.points,
                  ),
                  sequence:
                    questionIndex,
                  options:
                    question.options.map(
                      (
                        option,
                        optionIndex,
                      ) => ({
                        text:
                          option.text.trim(),
                        correct:
                          option.correct,
                        sequence:
                          optionIndex,
                      }),
                    ),
                }),
              ),
          }),
        },
      );
      if (!response.ok) {
        setError(
          await courseApiError(response),
        );
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError(
        "Could not save Quiz questions. Check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => void load()}
      >
        Edit questions
      </Button>

      <Drawer
        open={open}
        onOpenChange={setOpen}
        title="Edit Quiz questions"
        description="Question changes are accepted only while this Quiz remains Draft and has no learner attempts."
        footer={
          <Button
            disabled={
              saving || loading
            }
            onClick={() => void save()}
          >
            {saving
              ? "Saving…"
              : "Save questions"}
          </Button>
        }
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">
            Loading questions…
          </p>
        ) : (
          <div className="space-y-4">
            {questions.map(
              (
                question,
                questionIndex,
              ) => (
                <section
                  key={question.key}
                  className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="m-0 text-sm font-semibold text-foreground">
                      Question{" "}
                      {questionIndex + 1}
                    </h3>
                    {questions.length >
                    1 ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setQuestions(
                            (current) =>
                              current.filter(
                                (item) =>
                                  item.key !==
                                  question.key,
                              ),
                          )
                        }
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>

                  <label className="mt-3 block text-xs font-semibold text-body">
                    Prompt
                    <Textarea
                      className="mt-1.5"
                      value={question.prompt}
                      onChange={(event) =>
                        patchQuestion(
                          question.key,
                          {
                            prompt:
                              event.target
                                .value,
                          },
                        )
                      }
                      maxLength={5000}
                    />
                  </label>

                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_8rem]">
                    <label className="text-xs font-semibold text-body">
                      Question type
                      <Select
                        className="mt-1.5"
                        value={
                          question.type
                        }
                        onChange={(event) =>
                          changeType(
                            question,
                            event.target
                              .value as QuestionDraft["type"],
                          )
                        }
                      >
                        <option value="SINGLE_CHOICE">
                          Single choice
                        </option>
                        <option value="MULTIPLE_CHOICE">
                          Multiple choice
                        </option>
                      </Select>
                    </label>
                    <label className="text-xs font-semibold text-body">
                      Points
                      <Input
                        className="mt-1.5"
                        type="number"
                        min={1}
                        max={1000}
                        value={
                          question.points
                        }
                        onChange={(event) =>
                          patchQuestion(
                            question.key,
                            {
                              points:
                                event.target
                                  .value,
                            },
                          )
                        }
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
                          key={option.key}
                          className="grid grid-cols-[auto_1fr_auto] items-center gap-2"
                        >
                          <CourseChoiceControl single={question.type === "SINGLE_CHOICE"}
                            name={`correct-${question.key}`}
                            checked={
                              option.correct
                            }
                            aria-label={`Correct answer for option ${optionIndex + 1}`}
                            onChange={() =>
                              patchOption(
                                question.key,
                                option.key,
                                {
                                  correct:
                                    question.type ===
                                    "SINGLE_CHOICE"
                                      ? true
                                      : !option.correct,
                                },
                              )
                            }
                          />
                          <Input
                            value={
                              option.text
                            }
                            onChange={(event) =>
                              patchOption(
                                question.key,
                                option.key,
                                {
                                  text:
                                    event
                                      .target
                                      .value,
                                },
                              )
                            }
                            placeholder={`Option ${optionIndex + 1}`}
                            maxLength={2000}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={
                              question
                                .options
                                .length <= 2
                            }
                            onClick={() =>
                              removeOption(
                                question,
                                option.key,
                              )
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      ),
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={
                        question.options
                          .length >= 20
                      }
                      onClick={() =>
                        addOption(question)
                      }
                    >
                      + Option
                    </Button>
                  </div>
                </section>
              ),
            )}

            <Button
              variant="secondary"
              disabled={
                questions.length >= 100
              }
              onClick={() =>
                setQuestions(
                  (current) => [
                    ...current,
                    emptyQuestion(),
                  ],
                )
              }
            >
              + Question
            </Button>

            {error ? (
              <p
                role="alert"
                className="text-sm font-semibold text-error"
              >
                {error}
              </p>
            ) : null}
          </div>
        )}
      </Drawer>
    </>
  );
}
