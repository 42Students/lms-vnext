import { z } from "zod";

const namePart = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(
    /^[\p{L}\p{M}][\p{L}\p{M}\p{Zs}'’.\-]*$/u,
    "Name contains unsupported characters",
  );

export const personNameSchema = z
  .object({
    givenName: namePart,
    familyName: z
      .string()
      .trim()
      .max(120)
      .regex(
        /^$|^[\p{L}\p{M}][\p{L}\p{M}\p{Zs}'’.\-]*$/u,
        "Name contains unsupported characters",
      )
      .default(""),
  })
  .strict();

export type PersonName = z.infer<
  typeof personNameSchema
>;

export function displayNameFromPersonName(
  input: PersonName,
) {
  const value =
    `${input.givenName} ${input.familyName}`.trim();
  if (!value) {
    throw new Error("DISPLAY_NAME_REQUIRED");
  }
  return value;
}
