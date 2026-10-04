import { z } from "zod";
import {
  getPlacementTpoOperations,
} from "@/modules/placements/tpo-operations-service";
import type {
  AiTool,
} from "./types";

const inputSchema = z
  .object({
    collegeId: z.string().uuid(),
  })
  .strict();

export const placementOperationsTool: AiTool<
  z.infer<typeof inputSchema>,
  Awaited<
    ReturnType<
      typeof getPlacementTpoOperations
    >
  >
> = {
  name: "placements.get_operations",
  description:
    "Read the authorized TPO operations center for one college, including funnel metrics, work queue and upcoming drive work.",
  inputSchema,
  execute(context, input) {
    return getPlacementTpoOperations(
      context,
      input.collegeId,
    );
  },
};
