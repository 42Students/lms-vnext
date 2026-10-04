import { z } from "zod";
import {
  getLearnerContentProgress,
} from "@/modules/courses/progress-service";
import type {
  AiTool,
} from "./types";

const inputSchema = z
  .object({
    contentId: z.string().uuid(),
    deliveryId: z.string().uuid(),
  })
  .strict();

export const learnerContentProgressTool: AiTool<
  z.infer<typeof inputSchema>,
  Awaited<
    ReturnType<
      typeof getLearnerContentProgress
    >
  >
> = {
  name: "courses.get_learner_progress",
  description:
    "Read the current learner's authorized progress for one exact course content delivery.",
  inputSchema,
  execute(context, input) {
    return getLearnerContentProgress(
      context,
      input.contentId,
      input.deliveryId,
    );
  },
};
