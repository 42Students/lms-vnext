import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email().max(150));
export const companyContactPersonSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("CREATE"),
    confirmed: z.literal(true),
    name: z.string().trim().min(1).max(150),
    email,
    designation: z.string().trim().max(100).optional(),
  }).strict(),
  z.object({
    action: z.literal("EDIT"),
    confirmed: z.literal(true),
    leadId: z.string().uuid(),
    expectedUpdatedAt: z.iso.datetime({ offset: true }),
    name: z.string().trim().min(1).max(150),
    email,
    designation: z.string().trim().max(100).optional(),
  }).strict(),
]);

export function companyContactChangeNote(action: "CREATE" | "EDIT") {
  return action === "CREATE"
    ? "Company contact person added by authorized placement staff"
    : "Company contact person edited by authorized placement staff";
}
