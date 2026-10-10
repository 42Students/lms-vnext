import { z } from "zod";
import {
  courseLessonIdSchema,
  courseSectionDeliveryIdSchema,
  lessonContentIdSchema,
} from "./validation";

export const deliveryContentOrderInputSchema =
  z
    .object({
      lessonId: courseLessonIdSchema,
      deliveryId:
        courseSectionDeliveryIdSchema,
      orderedContentIds: z
        .array(lessonContentIdSchema)
        .min(1)
        .max(1000),
    })
    .superRefine((value, ctx) => {
      if (
        new Set(value.orderedContentIds)
          .size !==
        value.orderedContentIds.length
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["orderedContentIds"],
          message:
            "Content order contains duplicate IDs",
        });
      }
    });

export type DeliveryContentOrderInput =
  z.infer<
    typeof deliveryContentOrderInputSchema
  >;
