import { z } from "zod";
import {
  getProjectReadiness,
} from "@/modules/projects/readiness-service";
import type {
  AiTool,
} from "./types";

const inputSchema = z
  .object({
    projectId: z.string().uuid(),
  })
  .strict();

export const projectReadinessTool: AiTool<
  z.infer<typeof inputSchema>,
  Awaited<
    ReturnType<
      typeof getProjectReadiness
    >
  >
> = {
  name: "projects.get_readiness",
  description:
    "Read execution and final-delivery readiness for an authorized project.",
  inputSchema,
  execute(context, input) {
    return getProjectReadiness(
      context,
      input.projectId,
    );
  },
};
