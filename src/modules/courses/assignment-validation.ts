import {assignmentMethodsSchema} from "./assignment-submission-methods";
import { z } from "zod";
import {
  ASSIGNMENT_SUBMISSION_TYPES,
} from "./constants";
import {
  courseLessonIdSchema,
  courseSectionDeliveryIdSchema,
} from "./validation";
import {
  assignmentFileSubmissionSchema,
} from "./assignment-file-validation";

export const courseAssignmentIdSchema =
  z.string().uuid({error:"Lesson content not found. Enter a valid assignment ID."});
export const assignmentSubmissionIdSchema =
  z.string().uuid();

const assignmentTitleSchema = z
  .string()
  .trim()
  .min(1)
  .max(255);

const assignmentDescriptionSchema = z
  .string()
  .trim()
  .max(10000);

const dateTimeSchema = z
  .string()
  .datetime({ offset: true });

export const createCourseAssignmentInputSchema =
  z.object({
    lessonId: courseLessonIdSchema,
    deliveryId:
      courseSectionDeliveryIdSchema
        .nullable()
        .optional(),
    title: assignmentTitleSchema,
    description:
      assignmentDescriptionSchema
        .nullable()
        .optional(),
    dueAt: dateTimeSchema
      .nullable()
      .optional(),
    allowedMethods:assignmentMethodsSchema.optional(),
    maxPoints: z
      .number()
      .int()
      .min(0)
      .max(10000),
    sequence: z
      .number()
      .int()
      .min(0)
      .max(10000),
  });

export const updateCourseAssignmentInputSchema =
  z
    .object({
      expectedUpdatedAt: z.iso.datetime({offset:true}).optional(),
      confirmed: z.literal(true).optional(),
      title:
        assignmentTitleSchema.optional(),
      description:
        assignmentDescriptionSchema
          .nullable()
          .optional(),
      dueAt: dateTimeSchema
        .nullable()
        .optional(),
      allowedMethods:assignmentMethodsSchema.optional(),
      maxPoints: z
        .number()
        .int()
        .min(0)
        .max(10000)
        .optional(),
      sequence: z
        .number()
        .int()
        .min(0)
        .max(10000)
        .optional(),
    })
    .refine(
      (value) =>
        Object.entries(value).some(
          ([key,item]) => key !== "expectedUpdatedAt" && key !== "confirmed" && item !== undefined,
        ),
      "At least one assignment field is required",
    );

export const assignmentTransitionSchema =
  z.object({
    expectedUpdatedAt: z.iso.datetime({offset:true}).optional(),
    confirmed: z.literal(true).optional(),
    action: z.enum([
      "PUBLISH",
      "ARCHIVE",
    ]),
  });

const textSubmissionSchema = z.object({
  deliveryId: courseSectionDeliveryIdSchema,
  submissionType: z.literal("TEXT"),
  textContent: z
    .string()
    .trim()
    .min(1)
    .max(50000),
});

const linkSubmissionSchema = z.object({
  deliveryId: courseSectionDeliveryIdSchema,
  submissionType: z.literal("LINK"),
  linkKind:z.enum(["REPOSITORY_LINK","EXTERNAL_LINK"]).optional(),
  submissionUrl: z
    .string()
    .trim()
    .max(2048)
    .url()
    .refine(
      (value) =>
        new URL(value).protocol === "https:" &&
        !new URL(value).username && !new URL(value).password,
      "Only credential-free https submission links are allowed",
    ),
});

/** The existing single-file payload remains valid. Newer clients can
 * submit ordered file receipts together with written work and typed links.
 * File claims and asset persistence are guarded by the submission service. */
const multipartFileSubmissionSchema = assignmentFileSubmissionSchema
  .extend({
    uploadReceiptId: z.string().uuid().optional(),
    uploadReceiptIds: z.array(z.string().uuid()).min(1).max(20).optional(),
    textContent: z.string().trim().min(1).max(50000).optional(),
    links: z.array(z.object({
      kind: z.enum(["REPOSITORY_LINK", "EXTERNAL_LINK"]),
      url: z.string().trim().max(2048).url().refine(
        value => new URL(value).protocol === "https:" &&
          !new URL(value).username && !new URL(value).password,
        "Only credential-free https submission links are allowed",
      ),
      caption: z.string().trim().max(255).default(""),
    }).strict()).max(20).optional(),
  })
  .superRefine((input, ctx) => {
    if (input.uploadReceiptId && input.uploadReceiptIds) {
      ctx.addIssue({
        code: "custom", path: ["uploadReceiptIds"],
        message: "Choose one upload receipt format",
      });
    }
    const ids = input.uploadReceiptIds ??
      (input.uploadReceiptId ? [input.uploadReceiptId] : []);
    if ((ids.length === 0 && !input.textContent && !input.links?.length) ||
        new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom", path: ["uploadReceiptIds"],
        message: ids.length===0?"Submit at least one valid part.":"Duplicate submission item ID.",
      });
    }
    if(ids.length===0&&input.textContent&&input.links?.length){
      ctx.addIssue({code:"custom",path:["uploadReceiptIds"],
        message:"A written response and links require at least one verified file receipt."});
    }
  });

const singleSubmissionInputSchema=z.discriminatedUnion("submissionType",[
  textSubmissionSchema,linkSubmissionSchema,multipartFileSubmissionSchema,
]);

// Legacy multi-asset requests arrive as an ordered part array. Every
// attachment ID is a vNext verified upload receipt, never a raw object key.
const submissionPartSchema=z.discriminatedUnion("kind",[
  z.strictObject({kind:z.literal("FILE"),uploadReceiptId:z.uuid(),
    id:z.uuid().optional()}),
  z.strictObject({kind:z.literal("TEXT"),textContent:z.string().trim().min(1).max(50000),
    id:z.uuid().optional()}),
  z.strictObject({kind:z.literal("LINK"),
    linkKind:z.enum(["REPOSITORY_LINK","EXTERNAL_LINK"]),
    url:z.string().trim().max(2048).url().refine(value=>
      new URL(value).protocol==="https:"&&!new URL(value).username&&!new URL(value).password,
      "Only credential-free https submission links are allowed"),
    caption:z.string().trim().max(255).default(""),id:z.uuid().optional()}),
]);
const partsInputSchema=z.strictObject({
  deliveryId:courseSectionDeliveryIdSchema,
  submissionParts:z.array(submissionPartSchema).min(1,"Add a submission part.").max(40),
}).superRefine((input,ctx)=>{
  const ids=new Set<string>(),receipts=new Set<string>();
  let files=0,texts=0,links=0;
  input.submissionParts.forEach((part,index)=>{
    if(part.id){
      if(ids.has(part.id))
        ctx.addIssue({code:"custom",path:["submissionParts",index,"id"],
          message:"Duplicate submission item ID."});
      ids.add(part.id);
    }
    if(part.kind==="FILE"){
      files++;
      if(receipts.has(part.uploadReceiptId))
        ctx.addIssue({code:"custom",path:["submissionParts",index,"uploadReceiptId"],
          message:"Duplicate submission item ID."});
      receipts.add(part.uploadReceiptId);
    }else if(part.kind==="TEXT")texts++;
    else links++;
  });
  if(files>20)ctx.addIssue({code:"custom",path:["submissionParts"],
    message:"A submission can contain at most 20 files."});
  if(links>20)ctx.addIssue({code:"custom",path:["submissionParts"],
    message:"A submission can contain at most 20 links."});
  if(texts>1)ctx.addIssue({code:"custom",path:["submissionParts"],
    message:"Combine written responses into one text part."});
  if(!files&&texts&&links)ctx.addIssue({code:"custom",path:["submissionParts"],
    message:"Combining text and links requires a verified file receipt."});
  if(!files&&links>1)ctx.addIssue({code:"custom",path:["submissionParts"],
    message:"Combining multiple links requires a verified file receipt."});
}).transform(input=>{
  const files=input.submissionParts.filter((part):part is Extract<typeof part,{kind:"FILE"}>=>part.kind==="FILE");
  const texts=input.submissionParts.filter((part):part is Extract<typeof part,{kind:"TEXT"}>=>part.kind==="TEXT");
  const links=input.submissionParts.filter((part):part is Extract<typeof part,{kind:"LINK"}>=>part.kind==="LINK");
  if(!files.length&&!links.length){
    return {deliveryId:input.deliveryId,submissionType:"TEXT" as const,
      textContent:texts[0]?.textContent??""};
  }
  if(!files.length&&!texts.length&&links.length===1){
    return {deliveryId:input.deliveryId,submissionType:"LINK" as const,
      linkKind:links[0]!.linkKind,submissionUrl:links[0]!.url};
  }
  return {deliveryId:input.deliveryId,submissionType:"FILE" as const,
    uploadReceiptIds:files.map(part=>part.uploadReceiptId),
    textContent:texts[0]?.textContent,
    links:links.map(part=>({kind:part.linkKind,url:part.url,caption:part.caption}))};
});
/** Accept both the existing single-type shape and the normalized mixed
 * parts format, then validate the resulting persisted submission contract. */
export const submitAssignmentInputSchema=z.union([
  singleSubmissionInputSchema,partsInputSchema,
]).pipe(singleSubmissionInputSchema);

export const assignmentSubmissionTypeSchema =
  z.enum(ASSIGNMENT_SUBMISSION_TYPES);

export const gradeAssignmentSubmissionInputSchema =
  z.object({
    pointsAwarded: z
      .number()
      .int()
      .min(0)
      .max(10000),
    feedback: z
      .string()
      .trim()
      .max(10000)
      .nullable()
      .optional(),
    expectedVersion: z
      .number()
      .int()
      .min(0),
    /** Hide the published grade without changing its score or feedback. */
    hidePublished: z.literal(true).optional(),
  }).strict();

export const publishAssignmentGradeInputSchema =
  z.object({
    expectedVersion: z
      .number()
      .int()
      .min(0),
  }).strict();

export type CreateCourseAssignmentInput =
  z.infer<
    typeof createCourseAssignmentInputSchema
  >;
export type UpdateCourseAssignmentInput =
  z.infer<
    typeof updateCourseAssignmentInputSchema
  >;
export type SubmitAssignmentInput =
  z.input<
    typeof submitAssignmentInputSchema
  >;
export type GradeAssignmentSubmissionInput =
  z.infer<
    typeof gradeAssignmentSubmissionInputSchema
  >;
