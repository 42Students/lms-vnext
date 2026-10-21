import { verifyAiGradingAccess } from "@/utils/apiAuth";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

const OPENAI_MODEL = "gpt-5.5";

// BE-0189: a hard envelope on what one request can cost. Checked before anything is buffered or sent to OpenAI.
export const LIMITS = Object.freeze({
  bodyBytes: 26 * 1024 * 1024, // the whole multipart request
  pdfBytes: 25 * 1024 * 1024,
  examJsonBytes: 200 * 1024,
  questions: 60,
  idChars: 40,
  textChars: 4000,
  rubricChars: 4000,
  maxMarks: 1000,
  labelHints: 20,
  upstreamMs: 180 * 1000, // each OpenAI call
  outputTokens: 32000,
  perUserInFlight: 1,
  inFlight: 3, // on this server
});

const running = { total: 0, byUser: new Map() };

export class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const TOO_LARGE = `The upload is too large. Keep the PDF under ${Math.floor(LIMITS.pdfBytes / 1024 / 1024)} MB.`;

function uniqueStrings(values) {
  const seen = new Set();
  return values
    .map((value) => String(value || "").trim())
    .filter((value) => {
      const key = value.toLowerCase();
      if (!value || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function generateLabelHints(questionId) {
  const id = String(questionId || "").trim();
  const compact = id.replace(/\s+/g, "");
  const lower = compact.toLowerCase();
  const letterMatch = lower.match(/^(\d+)([a-z])$/);
  const numberMatch = lower.match(/^(\d+)$/);
  const hints = [id, compact, `Q${compact}`, `Q ${compact}`, `Question ${compact}`, `${compact}.`];

  if (letterMatch) {
    const [, number, letter] = letterMatch;
    hints.push(
      `${number}${letter}`,
      `${number} ${letter}`,
      `${number}(${letter})`,
      `${number} (${letter})`,
      `${number}.${letter}`,
      `${number}.${letter}.`,
      `Q${number}${letter}`,
      `Q ${number}${letter}`,
      `Q${number}(${letter})`,
      `Q ${number}(${letter})`,
      `Q${number} (${letter})`,
      `Question ${number}${letter}`,
      `Question ${number}(${letter})`,
      `Question ${number} (${letter})`
    );
  }

  if (numberMatch) {
    const [, number] = numberMatch;
    hints.push(number, `${number}.`, `Q${number}`, `Q ${number}`, `Q${number}.`, `Question ${number}`, `Question ${number}.`);
  }

  return uniqueStrings(hints);
}

export function normalizeExam(rawExam) {
  if (!rawExam || !Array.isArray(rawExam.questions) || rawExam.questions.length === 0) {
    throw new RequestError(400, "Exam JSON must contain a non-empty questions array.");
  }
  if (rawExam.questions.length > LIMITS.questions) {
    throw new RequestError(400, `An exam can have at most ${LIMITS.questions} questions.`);
  }

  return {
    // Only the fields the prompts use go on; anything else in the JSON is dropped.
    exam_id: String(rawExam.exam_id || "").slice(0, LIMITS.idChars * 2),
    questions: rawExam.questions.map((question) => {
      if (!question || !question.id || !question.text || !question.rubric || !question.max_marks) {
        throw new RequestError(400, "Each question must include id, text, max_marks, and rubric.");
      }
      const id = String(question.id).trim();
      const text = String(question.text);
      const rubric = typeof question.rubric === "string" ? question.rubric : JSON.stringify(question.rubric);
      const maxMarks = Number(question.max_marks);
      if (id.length > LIMITS.idChars) throw new RequestError(400, `Question ids can be at most ${LIMITS.idChars} characters.`);
      if (text.length > LIMITS.textChars) throw new RequestError(400, `Question ${id}: the question text is over ${LIMITS.textChars} characters.`);
      if (rubric.length > LIMITS.rubricChars) throw new RequestError(400, `Question ${id}: the rubric is over ${LIMITS.rubricChars} characters.`);
      if (!Number.isFinite(maxMarks) || maxMarks <= 0 || maxMarks > LIMITS.maxMarks) {
        throw new RequestError(400, `Question ${id}: max marks must be more than 0 and at most ${LIMITS.maxMarks}.`);
      }
      const ownHints = Array.isArray(question.label_hints)
        ? question.label_hints.slice(0, LIMITS.labelHints).map((hint) => String(hint).slice(0, LIMITS.idChars))
        : [];
      return {
        id,
        text,
        rubric,
        max_marks: maxMarks,
        label_hints: uniqueStrings([...ownHints, ...generateLabelHints(id)]),
      };
    }),
  };
}

function jsonSchemaForExtraction() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      extraction_summary: {
        type: "object",
        additionalProperties: false,
        properties: {
          overall_confidence: { type: "number" },
          issues: { type: "array", items: { type: "string" } },
        },
        required: ["overall_confidence", "issues"],
      },
      question_answers: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            question_id: { type: "string" },
            matched_label: { type: ["string", "null"] },
            answer_text: { type: "string" },
            pages: { type: "array", items: { type: "integer" } },
            extraction_confidence: { type: "number" },
            issues: { type: "array", items: { type: "string" } },
          },
          required: ["question_id", "matched_label", "answer_text", "pages", "extraction_confidence", "issues"],
        },
      },
      unassigned: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            pages: { type: "array", items: { type: "integer" } },
            text: { type: "string" },
            confidence: { type: "number" },
            reason: { type: "string" },
          },
          required: ["pages", "text", "confidence", "reason"],
        },
      },
    },
    required: ["extraction_summary", "question_answers", "unassigned"],
  };
}

function jsonSchemaForGrading() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      grading_summary: {
        type: "object",
        additionalProperties: false,
        properties: {
          total_awarded: { type: "number" },
          total_max: { type: "number" },
          overall_confidence: { type: "number" },
          issues: { type: "array", items: { type: "string" } },
        },
        required: ["total_awarded", "total_max", "overall_confidence", "issues"],
      },
      results: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            question_id: { type: "string" },
            max_marks: { type: "number" },
            marks_awarded: { type: "number" },
            confidence: { type: "number" },
            review_recommended: { type: "boolean" },
            rubric_breakdown: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  criterion: { type: "string" },
                  marks: { type: "number" },
                  max_marks: { type: "number" },
                  note: { type: "string" },
                },
                required: ["criterion", "marks", "max_marks", "note"],
              },
            },
            feedback: { type: "string" },
          },
          required: ["question_id", "max_marks", "marks_awarded", "confidence", "review_recommended", "rubric_breakdown", "feedback"],
        },
      },
    },
    required: ["grading_summary", "results"],
  };
}

function buildExtractionPrompt(exam) {
  const questions = exam.questions.map((question) => {
    return `- ${question.id}: ${question.text}\n  Label hints: ${question.label_hints.join(", ")}`;
  });

  return [
    "You are extracting answers from a scanned, handwritten exam answer-sheet PDF.",
    "Assume worst-case handwriting: messy, partially illegible, and answers are NOT in order.",
    "Students do label answers, but they may skip around. Use labels + nearby context to assign text to questions.",
    "",
    "Rules:",
    "- Output STRICT JSON that matches the provided schema.",
    "- For each question_id listed below, return one entry in question_answers (even if empty/illegible).",
    "- If you are unsure, keep answer_text partial and add issues explaining why.",
    "- pages should list unique page numbers where you found relevant text (1-indexed). If unknown, use [].",
    "- matched_label is the label you actually observed (e.g. 'Q3', '3(b)') or null if not found.",
    "- Put any handwriting you cannot confidently map to a question into unassigned with a reason.",
    "",
    "Questions:",
    ...questions,
    "",
    "Now extract the student's answers.",
  ].join("\n");
}

function buildGradingPrompt(exam, extracted) {
  const questionById = new Map(exam.questions.map((question) => [question.id, question]));
  const payload = extracted.question_answers.map((answer) => {
    const question = questionById.get(answer.question_id);
    return {
      question_id: answer.question_id,
      question_text: question?.text || "",
      rubric: question?.rubric || "",
      max_marks: question?.max_marks ?? 0,
      answer_text: answer.answer_text || "",
      extraction_confidence: answer.extraction_confidence ?? 0,
      extraction_issues: answer.issues || [],
      pages: answer.pages || [],
    };
  });

  return [
    "You are grading handwritten exam answers using a rubric.",
    "Assume the extracted answer text may be incomplete or wrong due to bad handwriting and out-of-order answers.",
    "Be conservative when extraction_confidence is low or extraction_issues mention illegibility.",
    "",
    "Rules:",
    "- Output STRICT JSON that matches the provided schema.",
    "- marks_awarded must be between 0 and max_marks inclusive.",
    "- rubric_breakdown marks must sum to marks_awarded (within 0.01 tolerance).",
    "- Set review_recommended=true when confidence is low, when extraction is low-confidence, or when answer seems off-topic.",
    "- Keep feedback short and actionable for a human reviewer.",
    "",
    "Grade this JSON input (one object per question):",
    JSON.stringify(payload, null, 2),
  ].join("\n");
}

export async function readRequestBuffer(req, maxBytes = LIMITS.bodyBytes) {
  const declared = Number(req.headers?.["content-length"]);
  if (Number.isFinite(declared) && declared > maxBytes) throw new RequestError(413, TOO_LARGE);
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += part.length;
    // A missing or wrong Content-Length doesn't get past this: reading stops at the ceiling.
    if (size > maxBytes) {
      req.destroy?.();
      throw new RequestError(413, TOO_LARGE);
    }
    chunks.push(part);
  }
  return Buffer.concat(chunks);
}

function parseMultipart(buffer, contentType) {
  const boundaryMatch = contentType?.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = boundaryMatch?.[1] || boundaryMatch?.[2];
  if (!boundary) throw new RequestError(400, "Missing multipart boundary.");

  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const fields = {};
  const files = {};
  let cursor = buffer.indexOf(boundaryBuffer);

  while (cursor !== -1) {
    cursor += boundaryBuffer.length;
    if (buffer.slice(cursor, cursor + 2).toString() === "--") break;
    if (buffer.slice(cursor, cursor + 2).toString() === "\r\n") cursor += 2;

    const headerEnd = buffer.indexOf(Buffer.from("\r\n\r\n"), cursor);
    if (headerEnd === -1) break;

    const rawHeaders = buffer.slice(cursor, headerEnd).toString("utf8");
    const nextBoundary = buffer.indexOf(boundaryBuffer, headerEnd + 4);
    if (nextBoundary === -1) break;

    let body = buffer.slice(headerEnd + 4, nextBoundary);
    if (body.length >= 2 && body.slice(body.length - 2).toString() === "\r\n") {
      body = body.slice(0, body.length - 2);
    }

    const name = rawHeaders.match(/name="([^"]+)"/)?.[1];
    const filename = rawHeaders.match(/filename="([^"]*)"/)?.[1];
    const fieldContentType = rawHeaders.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim();

    if (name) {
      if (filename) {
        files[name] = {
          filename,
          contentType: fieldContentType || "application/octet-stream",
          buffer: body,
        };
      } else {
        fields[name] = body.toString("utf8");
      }
    }

    cursor = nextBoundary;
  }

  return { fields, files };
}

async function uploadPdfToOpenAI(pdfFile) {
  const form = new FormData();
  form.append("purpose", "user_data");
  form.append("file", new Blob([pdfFile.buffer], { type: pdfFile.contentType || "application/pdf" }), pdfFile.filename || "answer-booklet.pdf");

  const response = await fetch("https://api.openai.com/v1/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: form,
    signal: AbortSignal.timeout(LIMITS.upstreamMs),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Answer booklet upload failed.");
  }
  return data;
}

async function createResponse(payload) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...payload, max_output_tokens: LIMITS.outputTokens }),
    signal: AbortSignal.timeout(LIMITS.upstreamMs),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "AI grading call failed.");
  }
  return data;
}

async function deleteOpenAIFile(fileId) {
  if (!fileId) return;
  try {
    await fetch(`https://api.openai.com/v1/files/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    // best effort: the booklet is not needed once graded
  }
}

function getOutputText(response) {
  if (response.output_text) return response.output_text;
  const texts = [];
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") texts.push(content.text);
    }
  }
  return texts.join("");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  // BE-0188: the backend verifies the session (a decoded cookie proves nothing) and only staff pass.
  const access = await verifyAiGradingAccess(req);
  if (!access.ok) return res.status(access.status).json({ error: access.error });
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "AI grading service is not configured on this deployment." });
  }

  // BE-0189: one grading at a time per person, and a few at a time on this server.
  const userKey = `${access.user?.userType || "?"}:${access.user?.userId || "?"}`;
  if ((running.byUser.get(userKey) || 0) >= LIMITS.perUserInFlight) {
    return res.status(429).json({ error: "You already have a booklet being graded. Wait for it to finish." });
  }
  if (running.total >= LIMITS.inFlight) {
    return res.status(503).json({ error: "AI grading is busy right now. Try again in a few minutes." });
  }
  running.total += 1;
  running.byUser.set(userKey, (running.byUser.get(userKey) || 0) + 1);

  let file = null;
  try {
    const body = await readRequestBuffer(req);
    const { fields, files } = parseMultipart(body, req.headers["content-type"]);
    const examJson = fields.exam_json || "{}";
    if (Buffer.byteLength(examJson, "utf8") > LIMITS.examJsonBytes) {
      return res.status(413).json({ error: "The questions are too long. Shorten the question text or rubrics." });
    }
    let rawExam;
    try {
      rawExam = JSON.parse(examJson);
    } catch {
      return res.status(400).json({ error: "The questions could not be read. Check the exam JSON." });
    }
    const exam = normalizeExam(rawExam);
    const pdf = files.pdf;
    if (!pdf?.buffer?.length) {
      return res.status(400).json({ error: "Missing answer booklet PDF." });
    }
    if (pdf.buffer.length > LIMITS.pdfBytes) return res.status(413).json({ error: TOO_LARGE });
    if (pdf.buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
      return res.status(400).json({ error: "The answer booklet must be a PDF file." });
    }

    // Spend one of today's gradings only now, when everything is valid and the paid work starts.
    const spend = await verifyAiGradingAccess(req, { use: true });
    if (!spend.ok) return res.status(spend.status).json({ error: spend.error });

    file = await uploadPdfToOpenAI(pdf);
    const extractionResponse = await createResponse({
      model: OPENAI_MODEL,
      input: [
        {
          role: "user",
          content: [
            { type: "input_file", file_id: file.id },
            { type: "input_text", text: buildExtractionPrompt(exam) },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "answer_extraction",
          strict: true,
          schema: jsonSchemaForExtraction(),
        },
      },
    });

    const extractionText = getOutputText(extractionResponse);
    if (!extractionText) throw new Error("No extraction output returned by the grading service.");
    const extracted = JSON.parse(extractionText);

    const gradingResponse = await createResponse({
      model: OPENAI_MODEL,
      input: [
        {
          role: "user",
          content: [{ type: "input_text", text: buildGradingPrompt(exam, extracted) }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "grading_results",
          strict: true,
          schema: jsonSchemaForGrading(),
        },
      },
    });

    const gradingText = getOutputText(gradingResponse);
    if (!gradingText) throw new Error("No grading output returned by the grading service.");
    const graded = JSON.parse(gradingText);

    return res.status(200).json({
      file_id: file.id,
      extracted,
      graded,
    });
  } catch (error) {
    if (error instanceof RequestError) return res.status(error.status).json({ error: error.message });
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      return res.status(504).json({ error: "AI grading took too long. Try again, or split the booklet." });
    }
    return res.status(500).json({ error: error.message || "AI grading failed." });
  } finally {
    running.total -= 1;
    const left = (running.byUser.get(userKey) || 1) - 1;
    if (left > 0) running.byUser.set(userKey, left);
    else running.byUser.delete(userKey);
    deleteOpenAIFile(file?.id);
  }
}
