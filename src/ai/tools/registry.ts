import type {
  RequestContext,
} from "@/modules/identity/context";
import {
  learnerContentProgressTool,
} from "./courses";
import {
  placementOperationsTool,
} from "./placements";
import {
  projectReadinessTool,
} from "./projects";

export class AiToolError extends Error {
  constructor(
    public readonly code:
      | "AI_TOOL_NOT_FOUND"
      | "AI_TOOL_INVALID_INPUT",
  ) {
    super(code);
    this.name = "AiToolError";
  }
}

const tools = [
  placementOperationsTool,
  projectReadinessTool,
  learnerContentProgressTool,
] as const;

const toolByName = new Map(
  tools.map((tool) => [
    tool.name,
    tool,
  ]),
);

export function listAiTools() {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
  }));
}

export async function executeAiTool(
  context: RequestContext,
  toolName: string,
  rawInput: unknown,
) {
  const tool = toolByName.get(
    toolName as
      (typeof tools)[number]["name"],
  );
  if (!tool) {
    throw new AiToolError(
      "AI_TOOL_NOT_FOUND",
    );
  }

  const parsed =
    tool.inputSchema.safeParse(
      rawInput,
    );
  if (!parsed.success) {
    throw new AiToolError(
      "AI_TOOL_INVALID_INPUT",
    );
  }

  // Authorization is deliberately not duplicated here.
  // Every tool calls an existing domain service with the
  // authenticated RequestContext, so the canonical tenant
  // and role checks stay in one place.
  return tool.execute(
    context,
    parsed.data as never,
  );
}
