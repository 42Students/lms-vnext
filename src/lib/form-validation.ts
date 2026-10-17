/**
 * GR-33: share the exact Zod schema with the server boundary.
 * Usage: const result = validateForm(sharedSchema, values);
 * On failure use result.fieldErrors, getFieldErrorProps(field, errors)
 * and focusFirstInvalidField(result.fieldErrors) after submit.
 */
import type { ZodType } from "zod";

export type FormValidation<T> =
  | { success: true; data: T; fieldErrors: Record<string, string> }
  | { success: false; fieldErrors: Record<string, string> };

export function validateForm<T>(schema: ZodType<T>, values: unknown): FormValidation<T> {
  const checked = schema.safeParse(values);
  if (checked.success) return { success: true, data: checked.data, fieldErrors: {} };
  const fieldErrors: Record<string, string> = {};
  for (const issue of checked.error.issues) {
    const path = issue.path.join(".");
    if (path && !fieldErrors[path]) fieldErrors[path] = "Please check this field.";
  }
  return { success: false, fieldErrors };
}
export function getFieldErrorProps(field: string, fieldErrors: Record<string, string>) {
  return fieldErrors[field]
    ? { "aria-invalid": true as const, "aria-describedby": `${field}-error` }
    : { "aria-invalid": undefined, "aria-describedby": undefined };
}
export function focusFirstInvalidField(fieldErrors: Record<string, string>) {
  if (typeof document === "undefined") return;
  const first = Object.keys(fieldErrors)[0];
  if (!first) return;
  const control = Array.from(document.querySelectorAll<HTMLElement>("[name]"))
    .find((node) => node.getAttribute("name") === first);
  control?.focus();
}
