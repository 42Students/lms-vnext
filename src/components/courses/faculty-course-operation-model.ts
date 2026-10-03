export type FacultyOwnedStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "CLOSED"
  | "ARCHIVED";

export function facultyOwnedItemActions(input: {
  deliveryId: string | null;
  status: FacultyOwnedStatus;
  kind: "CONTENT" | "ASSIGNMENT" | "QUIZ";
}) {
  const exactDelivery =
    input.deliveryId !== null;

  if (!exactDelivery) {
    return {
      canPublish: false,
      canClose: false,
      canArchive: false,
    };
  }

  return {
    canPublish:
      input.status === "DRAFT",
    canClose:
      input.kind === "QUIZ" &&
      input.status === "PUBLISHED",
    canArchive:
      input.status !== "ARCHIVED",
  };
}


export function nextLessonItemSequence(
  sequences: readonly number[],
) {
  return (
    Math.max(
      -1,
      ...sequences,
    ) + 1
  );
}
