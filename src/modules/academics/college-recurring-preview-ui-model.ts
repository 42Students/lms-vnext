export function collegePreviewErrorLabel(value: unknown): string {
  if (value !== null && typeof value === "object" && "error" in value &&
    typeof value.error === "string") return value.error.slice(0, 150);
  return "The schedule preview could not be loaded";
}
