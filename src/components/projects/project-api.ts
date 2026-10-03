export async function projectApiError(
  response: Response,
) {
  try {
    const body = (await response.json()) as {
      error?: string;
      issues?: Array<{ message?: string }>;
    };

    if (body.issues?.[0]?.message) {
      return body.issues[0].message;
    }

    if (body.error) {
      return body.error
        .toLowerCase()
        .split("_")
        .map(
          (part) =>
            part.charAt(0).toUpperCase() +
            part.slice(1),
        )
        .join(" ");
    }
  } catch {
    // Fall through to the HTTP status label.
  }

  return (
    response.statusText ||
    "The Project request could not be completed."
  );
}

export async function projectMutation(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
) {
  const response = await fetch(path, {
    method,
    headers:
      body === undefined
        ? undefined
        : {
            "Content-Type": "application/json",
          },
    body:
      body === undefined
        ? undefined
        : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      await projectApiError(response),
    );
  }

  return response.json();
}
