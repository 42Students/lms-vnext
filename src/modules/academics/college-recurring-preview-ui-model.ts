/** Server/provider error bodies are untrusted and must never become user-visible copy. */
export function collegePreviewErrorLabel(_value: unknown): string {
  return "The schedule preview could not be loaded";
}
