import { z } from "zod";
import {
  QUIZ_QUESTION_TYPES,
} from "./constants";
import {
  courseLessonIdSchema,
  courseSectionDeliveryIdSchema,
} from "./validation";

export const courseQuizIdSchema =
  z.string().uuid();
export const quizAttemptIdSchema =
  z.string().uuid();

const titleSchema = z
  .string()
  .trim()
  .min(1)
  .max(255);

const descriptionSchema = z
  .string()
  .trim()
  .max(5000,"Quiz description may not exceed 5000 characters");

const dateTimeSchema = z
  .string()
  .datetime({ offset: true });

const quizOptionInputSchema = z.object({
  text: z.string().trim().min(1,"Option is required").max(2000,"Option may not exceed 2000 characters"),
  correct: z.boolean(),
  sequence: z.number().int().min(0).max(100),
});

const quizQuestionInputSchema = z
  .object({
    type: z.enum(QUIZ_QUESTION_TYPES),
    prompt: z
      .string()
      .trim()
      .min(1)
      .max(5000),
    points: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(1),
    sequence: z
      .number()
      .int()
      .min(0)
      .max(1000),
    options: z
      .array(quizOptionInputSchema)
      .min(1)
      .max(20),
  })
  .superRefine((question, ctx) => {
    const sequences = new Set<number>();
    const texts = new Set<string>();
    let correctCount = 0;

    question.options.forEach((option, index) => {
      if (sequences.has(option.sequence)) {
        ctx.addIssue({
          code: "custom",
          path: ["options", index, "sequence"],
          message:
            "Option sequence must be unique within a question",
        });
      }
      sequences.add(option.sequence);

      const normalized = option.text.toLowerCase();
      if (texts.has(normalized)) {
        ctx.addIssue({
          code: "custom",
          path: ["options", index, "text"],
          message:
            "Option text must be unique within a question",
        });
      }
      texts.add(normalized);

      if (option.correct) correctCount += 1;
    });

    if (
      question.type === "SINGLE_CHOICE" &&
      correctCount !== 1
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message:
          "Single choice questions need exactly one correct option",
      });
    }

    if (
      question.type === "MULTIPLE_CHOICE" &&
      correctCount < 1
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message:
          "Multiple choice questions need at least one correct option",
      });
    }
  });

const questionsSchema = z
  .array(quizQuestionInputSchema)
  .min(1)
  .max(100)
  .superRefine((questions, ctx) => {
    const sequences = new Set<number>();
    let total = 0;

    questions.forEach((question, index) => {
      if (sequences.has(question.sequence)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "sequence"],
          message:
            "Question sequence must be unique within a quiz",
        });
      }
      sequences.add(question.sequence);
      total += question.points;
    });

    if (total > 10000) {
      ctx.addIssue({
        code: "custom",
        message:
          "Quiz total points may not exceed 10000",
      });
    }
  });

export const createCourseQuizInputSchema =
  z.object({
    lessonId: courseLessonIdSchema,
    deliveryId:
      courseSectionDeliveryIdSchema
        .nullable()
        .optional(),
    title: titleSchema,
    description:
      descriptionSchema.nullable().optional(),
    dueAt: dateTimeSchema
      .nullable()
      .optional(),
    maxAttempts: z
      .number()
      .int()
      .min(1)
      .max(20)
      .optional()
      .default(1),
    shuffleQuestions: z.boolean().optional().default(false),
    shuffleOptions: z.boolean().optional().default(false),
    sequence: z
      .number()
      .int()
      .min(0)
      .max(10000),
    questions: questionsSchema,
    // DTO bridge: legacy publish=true => publishNow=true. Numeric course,
    // class, lesson and question/option IDs must be resolved within the
    // authorized college/section before entering this UUID-only schema.
    // Atomic create-and-publish avoids a second browser request that might
    // leave an unintended draft after creation succeeded.
    publishNow: z.boolean().optional().default(false),
  });

export const updateCourseQuizInputSchema =
  z
    .object({
      expectedUpdatedAt: z.iso.datetime({offset:true}).optional(),
      confirmed: z.literal(true).optional(),
      title: titleSchema.optional(),
      description:
        descriptionSchema
          .nullable()
          .optional(),
      dueAt: dateTimeSchema
        .nullable()
        .optional(),
      maxAttempts: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional(),
      sequence: z
        .number()
        .int()
        .min(0)
        .max(10000)
        .optional(),
      shuffleQuestions:z.boolean().optional(),
      shuffleOptions:z.boolean().optional(),
      questions: questionsSchema.optional(),
    })
    .refine(
      (value) =>
        Object.entries(value).some(
          ([key,item]) => key !== "expectedUpdatedAt" && key !== "confirmed" && item !== undefined,
        ),
      "At least one quiz field is required",
    );

export const quizTransitionSchema = z.object({
  expectedUpdatedAt: z.iso.datetime({offset:true}).optional(),
  confirmed: z.literal(true).optional(),
  action: z.enum([
    "PUBLISH",
    "UNPUBLISH",
    "CLOSE",
    "ARCHIVE",
  ]),
});

export const setQuizResultsInputSchema =
  z.object({
    published: z.boolean(),
  });

const quizAnswerInputSchema = z.object({
  questionId: z.string().uuid(),
  selectedOptionIds: z
    .array(z.string().uuid())
    .min(1,"Submit exactly one answer for every quiz question")
    .max(20),
});

export const submitQuizInputSchema = z
  .object({
    deliveryId:
      courseSectionDeliveryIdSchema,
    answers: z
      .array(quizAnswerInputSchema)
      .min(1,"Quiz submission must include answers")
      .max(200),
    // Legacy client sends the authored question set visible when the
    // attempt opened. Optional for old vNext clients: in that case the
    // complete answer IDs themselves are the revision fingerprint.
    shownQuestionIds:z.array(z.string().uuid()).max(200).optional(),
  })
  .superRefine((value, ctx) => {
    const questions = new Set<string>();
    if(value.shownQuestionIds){
      const unique=new Set(value.shownQuestionIds);
      if(unique.size!==value.shownQuestionIds.length)
       ctx.addIssue({code:"custom",path:["shownQuestionIds"],
        message:"This quiz has changed. Reload before submitting."});
    }

    value.answers.forEach((answer, index) => {
      if (questions.has(answer.questionId)) {
        ctx.addIssue({
          code: "custom",
          path: ["answers", index, "questionId"],
          message:
            "Duplicate answer submitted for questionId "+answer.questionId,
        });
      }
      questions.add(answer.questionId);

      const options = new Set(
        answer.selectedOptionIds,
      );
      if (
        options.size !==
        answer.selectedOptionIds.length
      ) {
        ctx.addIssue({
          code: "custom",
          path: [
            "answers",
            index,
            "selectedOptionIds",
          ],
          message:
            "Duplicate selected option submitted for questionId "+answer.questionId,
        });
      }
    });
  });

/** A legacy question's authoring array order, not its persisted numeric
 * option ID, was the displayed order. Import adapters normalize this data
 * before inserting UUID option rows. The first correct option wins on
 * malformed single-choice imports, matching the legacy retrieval fallback.
 * Runtime authoring still rejects multiple correct single-choice choices.
 */
export function normalizeLegacyQuizOptions(
 type:"SINGLE_CHOICE"|"MULTIPLE_CHOICE",
 options:readonly {text:string;correct:boolean;id?:number|null}[],
){
 if(options.length<1||options.length>20)throw new RangeError("Options must contain 1 to 20 choices");
 let singleCorrectSeen=false;
 return options.map((item,index)=>{
  const correct=type==="SINGLE_CHOICE"
   ?Boolean(item.correct)&&!singleCorrectSeen:Boolean(item.correct);
  if(correct&&type==="SINGLE_CHOICE")singleCorrectSeen=true;
  return quizOptionInputSchema.parse({text:item.text,correct,sequence:index});
 });
}

/** Legacy quiz DTO crosswalk:
 * - courseId/classId/lessonId (numeric) are resolved tenant-locally to
 *   offering/delivery/lesson UUID before validation;
 * - publish -> publishNow, maxAttempts defaults to one, shuffle flags false;
 * - shownQuestionIds are mapped via a scoped question-ID dictionary;
 * - a maximum of 200 answers, with no duplicate answers or selected options.
 * Unmapped IDs cannot be interpreted as global UUIDs or ignored silently. */
export function normalizeLegacyQuizCreate<T extends {
 lessonId:string;deliveryId?:string|null;title:string;
 description?:string|null;dueAt?:string|null;sequence:number;
 questions:unknown[];publish?:boolean;maxAttempts?:number;
 shuffleQuestions?:boolean;shuffleOptions?:boolean;
}>(value:T){
 return createCourseQuizInputSchema.parse({
  lessonId:value.lessonId,deliveryId:value.deliveryId??null,
  title:value.title,description:value.description??null,
  dueAt:value.dueAt??null,sequence:value.sequence,
  maxAttempts:value.maxAttempts??1,
  shuffleQuestions:value.shuffleQuestions??false,
  shuffleOptions:value.shuffleOptions??false,
  publishNow:value.publish??false,questions:value.questions,
 });
}

export type CreateCourseQuizInput = z.infer<
  typeof createCourseQuizInputSchema
>;
export type UpdateCourseQuizInput = z.infer<
  typeof updateCourseQuizInputSchema
>;
export type SubmitQuizInput = z.infer<
  typeof submitQuizInputSchema
>;
