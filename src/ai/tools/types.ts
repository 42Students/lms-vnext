import type {
  ZodType,
} from "zod";
import type {
  RequestContext,
} from "@/modules/identity/context";

export type AiTool<
  TInput = unknown,
  TResult = unknown,
> = {
  name: string;
  description: string;
  inputSchema: ZodType<TInput>;
  execute(
    context: RequestContext,
    input: TInput,
  ): Promise<TResult>;
};
