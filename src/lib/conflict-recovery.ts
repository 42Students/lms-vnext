/**
 * GR-32: optimistic concurrency helpers.
 * Usage: if (isConflictError(reason)) show conflictMessage and offer
 * "Refresh and re-apply" using mergeLocalEdits(latest, editedFields).
 * Keep draft state before refetching; never erase it on 409.
 */
import { FriendlyFetchError } from "@/lib/api-fetch";
import { FRIENDLY_MESSAGES } from "@/lib/friendly-error";

export const conflictMessage = FRIENDLY_MESSAGES.conflict;
export function isConflictError(error: unknown): error is FriendlyFetchError {
  return error instanceof FriendlyFetchError && error.status === 409;
}
export function mergeLocalEdits<T extends object>(latest: T, editedFields: Partial<T>): T {
  return { ...latest, ...editedFields };
}
