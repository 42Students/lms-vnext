import { Readable } from "node:stream";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getAdminStorageBucket } from "@/auth/firebase-admin";
import { getLearnerCourseWorkspace } from "@/modules/courses/learner-course-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    deliveryId: string;
    contentId: string;
  }>;
};

function fileName(storageKey: string) {
  const segment = storageKey
    .split("/")
    .filter(Boolean)
    .at(-1);

  return (segment || "course-file").replace(
    /[^A-Za-z0-9._-]/g,
    "_",
  );
}

function parseRange(
  header: string | null,
  size: number,
) {
  if (!header?.startsWith("bytes=")) {
    return null;
  }

  const [startText, endText] = header
    .slice("bytes=".length)
    .split("-", 2);

  const start = startText
    ? Number(startText)
    : Number.NaN;
  const requestedEnd = endText
    ? Number(endText)
    : size - 1;

  if (
    !Number.isInteger(start) ||
    !Number.isInteger(requestedEnd) ||
    start < 0 ||
    requestedEnd < start ||
    start >= size
  ) {
    return { invalid: true as const };
  }

  return {
    invalid: false as const,
    start,
    end: Math.min(requestedEnd, size - 1),
  };
}

export async function GET(
  request: Request,
  { params }: RouteContext,
) {
  const { deliveryId, contentId } = await params;
  const context = await getCurrentRequestContext();
  const workspace = await getLearnerCourseWorkspace(
    context,
    deliveryId,
  );

  const content = workspace.lessons
    .flatMap((lesson) => lesson.contents)
    .find((item) => item.id === contentId);

  if (!content || !content.storageKey) {
    return Response.json(
      { error: "COURSE_FILE_NOT_FOUND" },
      { status: 404 },
    );
  }

  let metadata;
  let file;
  try {
    file = getAdminStorageBucket().file(
      content.storageKey,
    );
    [metadata] = await file.getMetadata();
  } catch {
    return Response.json(
      {
        error: "COURSE_FILE_UNAVAILABLE",
        message:
          "The course file is not available from storage.",
      },
      { status: 503 },
    );
  }

  const size = Number(metadata.size ?? 0);
  if (!Number.isFinite(size) || size <= 0) {
    return Response.json(
      { error: "COURSE_FILE_NOT_FOUND" },
      { status: 404 },
    );
  }

  const range = parseRange(
    request.headers.get("range"),
    size,
  );

  if (range?.invalid) {
    return new Response(null, {
      status: 416,
      headers: {
        "Content-Range": `bytes */${size}`,
      },
    });
  }

  const download =
    new URL(request.url).searchParams.get(
      "download",
    ) === "1";
  const name = fileName(content.storageKey);
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    "Content-Type":
      metadata.contentType ||
      "application/octet-stream",
    "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${name}"`,
  });

  if (range && !range.invalid) {
    const length = range.end - range.start + 1;
    headers.set(
      "Content-Range",
      `bytes ${range.start}-${range.end}/${size}`,
    );
    headers.set("Content-Length", String(length));

    const stream = Readable.toWeb(
      file.createReadStream({
        start: range.start,
        end: range.end,
      }),
    ) as ReadableStream<Uint8Array>;

    return new Response(stream, {
      status: 206,
      headers,
    });
  }

  headers.set("Content-Length", String(size));
  const stream = Readable.toWeb(
    file.createReadStream(),
  ) as ReadableStream<Uint8Array>;

  return new Response(stream, {
    status: 200,
    headers,
  });
}
