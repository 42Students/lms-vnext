import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { reportFileUploadFailure } from "@/utils/clientErrorReporting";

const EXAMPLE_EXAM = {
  exam_id: "semester-exam-demo",
  questions: [
    {
      id: "1a",
      text: "Define normalization. Explain first normal form (1NF) with an example.",
      max_marks: 5,
      rubric:
        "2 marks for a correct definition of normalization. 2 marks for explaining 1NF. 1 mark for a relevant example.",
    },
    {
      id: "1b",
      text: "Differentiate between a primary key and a foreign key.",
      max_marks: 5,
      rubric:
        "2 marks for primary key definition. 2 marks for foreign key definition. 1 mark for a correct difference or example.",
    },
    {
      id: "2",
      text: "Explain the ACID properties of a transaction in DBMS.",
      max_marks: 10,
      rubric:
        "2 marks each for Atomicity, Consistency, Isolation, and Durability. 2 marks for clarity and relevant examples.",
    },
  ],
};

const EMPTY_QUESTION = {
  id: "",
  text: "",
  max_marks: 5,
  rubric: "",
};

function fmtPct(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "n/a";
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

function clampNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseExam(raw) {
  try {
    const exam = JSON.parse(raw);
    return validateExam(exam);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Exam JSON is not valid. Fix the JSON or switch to Form mode.");
    }
    throw error;
  }
}

function validateExam(exam) {
  if (!Array.isArray(exam?.questions) || exam.questions.length === 0) {
    throw new Error("Exam must contain at least one question.");
  }
  const normalizedQuestions = exam.questions.map((question, index) => {
    const id = String(question.id || "").trim();
    const text = String(question.text || "").trim();
    const rubric = String(question.rubric || "").trim();
    const maxMarks = clampNumber(question.max_marks, 0);
    if (!id || !text || !rubric || maxMarks <= 0) {
      throw new Error(`Question ${index + 1} needs question number, question text, max marks, and rubric.`);
    }
    return {
      ...question,
      id,
      text,
      rubric,
      max_marks: maxMarks,
    };
  });
  return {
    exam_id: String(exam.exam_id || "ai-grading-run").trim() || "ai-grading-run",
    questions: normalizedQuestions,
  };
}

function formRowsToExam(examId, rows) {
  return validateExam({
    exam_id: examId || "ai-grading-run",
    questions: rows.map((row) => ({
      id: row.id,
      text: row.text,
      max_marks: row.max_marks,
      rubric: row.rubric,
    })),
  });
}

async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const body = await response.text();

  if (contentType.includes("application/json")) {
    return body ? JSON.parse(body) : {};
  }

  const compactBody = body.replace(/\s+/g, " ").trim().slice(0, 240);
  throw new Error(
    `Server returned ${response.status} ${response.statusText || ""} instead of JSON. ${compactBody || "No response body."}`
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function calculateStats(result, exam) {
  const gradedResults = result?.graded?.results || [];
  const answers = result?.extracted?.question_answers || [];
  const answerById = new Map(answers.map((answer) => [answer.question_id, answer]));
  const total = result?.graded?.grading_summary;
  const totalAwarded = clampNumber(total?.total_awarded, 0);
  const totalMax = clampNumber(total?.total_max, exam?.questions?.reduce((sum, question) => sum + clampNumber(question.max_marks, 0), 0) || 0);
  const flagged = gradedResults.filter((item) => {
    const answer = answerById.get(item.question_id);
    return item.review_recommended || item.confidence < 0.7 || (answer?.extraction_confidence ?? 1) < 0.7 || (answer?.issues || []).length > 0;
  });
  const avgGradingConfidence =
    gradedResults.length > 0 ? gradedResults.reduce((sum, item) => sum + clampNumber(item.confidence, 0), 0) / gradedResults.length : 0;
  const avgExtractionConfidence =
    answers.length > 0 ? answers.reduce((sum, item) => sum + clampNumber(item.extraction_confidence, 0), 0) / answers.length : 0;
  const scorePct = totalMax > 0 ? totalAwarded / totalMax : 0;
  const pages = [...new Set(answers.flatMap((answer) => answer.pages || []))].sort((a, b) => a - b);

  return {
    totalAwarded,
    totalMax,
    scorePct,
    flaggedCount: flagged.length,
    questionCount: gradedResults.length || exam?.questions?.length || 0,
    avgGradingConfidence,
    avgExtractionConfidence,
    pagesSeen: pages.length,
    flagged,
  };
}

function buildReportHtml({ result, exam, pdfName, stats }) {
  const rows = (result?.graded?.results || [])
    .map((item) => {
      const rubric = (item.rubric_breakdown || [])
        .map((row) => `${escapeHtml(row.criterion)}: ${escapeHtml(row.marks)} / ${escapeHtml(row.max_marks)} - ${escapeHtml(row.note)}`)
        .join("<br />");
      return `
        <tr>
          <td>${escapeHtml(item.question_id)}</td>
          <td>${escapeHtml(item.marks_awarded)} / ${escapeHtml(item.max_marks)}</td>
          <td>${fmtPct(item.confidence)}</td>
          <td>${item.review_recommended ? "Yes" : "No"}</td>
          <td>${escapeHtml(item.feedback || "")}<br /><small>${rubric}</small></td>
        </tr>`;
    })
    .join("");

  const extractionRows = (result?.extracted?.question_answers || [])
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.question_id)}</td>
          <td>${fmtPct(item.extraction_confidence)}</td>
          <td>${escapeHtml((item.pages || []).join(", ") || "-")}</td>
          <td>${escapeHtml((item.issues || []).join(" | ") || "No major issue")}</td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>AI Grading Report</title>
  <style>
    @page { margin: 18mm; }
    body { color: #111827; font-family: Arial, sans-serif; line-height: 1.45; margin: 0; }
    h1 { font-size: 28px; margin: 0 0 4px; }
    h2 { border-bottom: 1px solid #d1d5db; font-size: 16px; margin: 26px 0 10px; padding-bottom: 6px; }
    .muted { color: #6b7280; font-size: 12px; }
    .top { align-items: flex-start; display: flex; justify-content: space-between; gap: 24px; }
    .badge { background: #ecfeff; border: 1px solid #a5f3fc; border-radius: 999px; color: #155e75; display: inline-block; font-size: 12px; font-weight: 700; padding: 6px 10px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 18px 0; }
    .stat { border: 1px solid #d1d5db; border-radius: 12px; padding: 12px; }
    .label { color: #6b7280; display: block; font-size: 11px; text-transform: uppercase; }
    .value { display: block; font-size: 20px; font-weight: 800; margin-top: 4px; }
    table { border-collapse: collapse; font-size: 12px; width: 100%; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; font-size: 11px; text-transform: uppercase; }
    small { color: #4b5563; display: block; margin-top: 4px; }
    .footer { color: #6b7280; font-size: 11px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="top">
    <div>
      <h1>AI Grading Report</h1>
      <div class="muted">Generated ${escapeHtml(new Date().toLocaleString())}</div>
      <div class="muted">Booklet: ${escapeHtml(pdfName || "-")}</div>
      <div class="muted">Exam: ${escapeHtml(exam?.exam_id || "-")}</div>
    </div>
    <div class="badge">MVP Run Report</div>
  </div>

  <div class="stats">
    <div class="stat"><span class="label">Marks</span><span class="value">${escapeHtml(stats.totalAwarded)} / ${escapeHtml(stats.totalMax)}</span></div>
    <div class="stat"><span class="label">Score</span><span class="value">${fmtPct(stats.scorePct)}</span></div>
    <div class="stat"><span class="label">Review Flags</span><span class="value">${escapeHtml(stats.flaggedCount)}</span></div>
    <div class="stat"><span class="label">Grading Confidence</span><span class="value">${fmtPct(stats.avgGradingConfidence)}</span></div>
    <div class="stat"><span class="label">Extraction Confidence</span><span class="value">${fmtPct(stats.avgExtractionConfidence)}</span></div>
    <div class="stat"><span class="label">Questions</span><span class="value">${escapeHtml(stats.questionCount)}</span></div>
  </div>

  <h2>Question Results</h2>
  <table>
    <thead><tr><th>Question</th><th>Marks</th><th>Confidence</th><th>Review</th><th>Feedback + Rubric</th></tr></thead>
    <tbody>${rows || "<tr><td colspan='5'>No grading results.</td></tr>"}</tbody>
  </table>

  <h2>Extraction Quality</h2>
  <table>
    <thead><tr><th>Question</th><th>Confidence</th><th>Pages</th><th>Issues</th></tr></thead>
    <tbody>${extractionRows || "<tr><td colspan='4'>No extraction evidence.</td></tr>"}</tbody>
  </table>

  <div class="footer">This is an AI-generated MVP grading report. Low-confidence and flagged answers should be reviewed before final marks are published.</div>
</body>
</html>`;
}

function QuestionForm({ examId, setExamId, rows, setRows, syncJson }) {
  const updateRow = (index, field, value) => {
    const next = rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row));
    setRows(next);
    syncJson(examId, next);
  };

  const addQuestion = () => {
    const next = [...rows, { ...EMPTY_QUESTION, id: `${rows.length + 1}` }];
    setRows(next);
    syncJson(examId, next);
  };

  const removeQuestion = (index) => {
    const next = rows.filter((_, rowIndex) => rowIndex !== index);
    setRows(next);
    syncJson(examId, next);
  };

  return (
    <div className="formMode">
      <label className="fieldLabel">
        Exam ID
        <input
          type="text"
          value={examId}
          onChange={(event) => {
            setExamId(event.target.value);
            syncJson(event.target.value, rows);
          }}
          placeholder="semester-exam-demo"
        />
      </label>

      <div className="formGuide">
        <strong>How to fill this:</strong> put the exact question number students write on paper, then question text, max marks, and marking scheme.
      </div>

      <div className="questionRows">
        {rows.map((row, index) => (
          <section className="questionEditor" key={`${row.id}-${index}`}>
            <div className="questionEditorTop">
              <span>Question {index + 1}</span>
              <button className="btn btnSubtle" type="button" onClick={() => removeQuestion(index)} disabled={rows.length === 1}>
                Remove
              </button>
            </div>
            <div className="miniGrid">
              <label className="fieldLabel">
                Number / Label
                <input type="text" value={row.id} onChange={(event) => updateRow(index, "id", event.target.value)} placeholder="1a" />
              </label>
              <label className="fieldLabel">
                Max marks
                <input
                  type="number"
                  min="1"
                  value={row.max_marks}
                  onChange={(event) => updateRow(index, "max_marks", event.target.value)}
                  placeholder="5"
                />
              </label>
            </div>
            <label className="fieldLabel">
              Question
              <textarea
                className="smallTextArea"
                value={row.text}
                onChange={(event) => updateRow(index, "text", event.target.value)}
                placeholder="Explain the ACID properties of a transaction in DBMS."
              />
            </label>
            <label className="fieldLabel">
              Rubric / marking scheme
              <textarea
                className="smallTextArea rubricArea"
                value={row.rubric}
                onChange={(event) => updateRow(index, "rubric", event.target.value)}
                placeholder="2 marks each for Atomicity, Consistency, Isolation, and Durability. 2 marks for clarity and examples."
              />
            </label>
          </section>
        ))}
      </div>

      <button className="btn btnWide" type="button" onClick={addQuestion}>
        Add Question
      </button>
    </div>
  );
}

function StatCard({ label, value, detail, tone = "" }) {
  return (
    <div className={`statCard ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}

function ResultsTable({ graded }) {
  const results = graded?.results || [];
  if (!results.length) return <p className="hint">No grading results yet.</p>;
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>Question</th>
            <th>Marks</th>
            <th>Confidence</th>
            <th>Review</th>
            <th>Feedback</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr key={result.question_id}>
              <td className="mono">{result.question_id}</td>
              <td className="mono">
                {result.marks_awarded} / {result.max_marks}
              </td>
              <td className="mono">{fmtPct(result.confidence)}</td>
              <td>
                <span className={result.review_recommended ? "tag warn" : "tag good"}>{result.review_recommended ? "Review" : "OK"}</span>
              </td>
              <td>{result.feedback}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExtractionEvidence({ extracted }) {
  const answers = extracted?.question_answers || [];
  if (!answers.length) return <p className="hint">No extraction evidence yet.</p>;
  return (
    <div className="answers">
      {answers.map((answer) => (
        <section className="answerCard" key={answer.question_id}>
          <div className="answerTop">
            <div>
              <div className="qid">{answer.question_id}</div>
              <p className="hint">detected label: {answer.matched_label || "-"}</p>
            </div>
            <div className="meta">
              <span>pages: {(answer.pages || []).join(", ") || "-"}</span>
              <span>confidence: {fmtPct(answer.extraction_confidence)}</span>
            </div>
          </div>
          {(answer.issues || []).length > 0 && <p className="issue">{answer.issues.join(" | ")}</p>}
          <div className="answerBody">
            <pre>{answer.answer_text || ""}</pre>
          </div>
        </section>
      ))}
    </div>
  );
}

function ReviewQueue({ extracted, graded }) {
  const answerById = new Map((extracted?.question_answers || []).map((item) => [item.question_id, item]));
  const flagged = (graded?.results || []).filter((result) => {
    const answer = answerById.get(result.question_id);
    return result.review_recommended || result.confidence < 0.7 || (answer?.extraction_confidence ?? 1) < 0.7 || (answer?.issues || []).length > 0;
  });

  if (!graded?.results?.length) return <p className="hint">No review queue yet.</p>;
  if (!flagged.length) return <span className="tag good">No flagged questions</span>;

  return (
    <div className="answers">
      {flagged.map((result) => {
        const answer = answerById.get(result.question_id);
        return (
          <section className="answerCard review" key={result.question_id}>
            <div className="answerTop">
              <div>
                <div className="qid">{result.question_id}</div>
                <p className="hint">
                  marks: {result.marks_awarded} / {result.max_marks}
                </p>
              </div>
              <div className="meta">
                <span>extraction: {fmtPct(answer?.extraction_confidence)}</span>
                <span>grading: {fmtPct(result.confidence)}</span>
              </div>
            </div>
            <p className="issue">{(answer?.issues || []).join(" | ") || result.feedback}</p>
            <div className="answerBody">
              <pre>{answer?.answer_text || ""}</pre>
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function AiGradingPage() {
  const [inputMode, setInputMode] = useState("form");
  const [examId, setExamId] = useState(EXAMPLE_EXAM.exam_id);
  const [questionRows, setQuestionRows] = useState(EXAMPLE_EXAM.questions);
  const [examJson, setExamJson] = useState(JSON.stringify(EXAMPLE_EXAM, null, 2));
  const [lastExam, setLastExam] = useState(EXAMPLE_EXAM);
  const [lastPdfName, setLastPdfName] = useState("");
  const [pdf, setPdf] = useState(null);
  const [status, setStatus] = useState("Idle");
  const [isRunning, setIsRunning] = useState(false);
  const [health, setHealth] = useState(null);
  const [result, setResult] = useState(null);

  const stats = useMemo(() => calculateStats(result, lastExam), [result, lastExam]);

  const syncJsonFromForm = (nextExamId = examId, nextRows = questionRows) => {
    setExamJson(
      JSON.stringify(
        {
          exam_id: nextExamId || "ai-grading-run",
          questions: nextRows.map((row) => ({
            id: row.id,
            text: row.text,
            max_marks: clampNumber(row.max_marks, 0),
            rubric: row.rubric,
          })),
        },
        null,
        2
      )
    );
  };

  const loadExample = () => {
    setExamId(EXAMPLE_EXAM.exam_id);
    setQuestionRows(EXAMPLE_EXAM.questions);
    setExamJson(JSON.stringify(EXAMPLE_EXAM, null, 2));
    setStatus("Example loaded. Upload a PDF and run grading.");
  };

  const clearInputs = () => {
    setExamId("ai-grading-run");
    setQuestionRows([{ ...EMPTY_QUESTION, id: "1" }]);
    setExamJson(JSON.stringify({ exam_id: "ai-grading-run", questions: [{ ...EMPTY_QUESTION, id: "1" }] }, null, 2));
    setResult(null);
    setLastPdfName("");
    setStatus("Inputs cleared.");
  };

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyHeight = document.body.style.height;

    document.documentElement.style.overflow = "auto";
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.height = previousBodyHeight;
    };
  }, []);

  useEffect(() => {
    fetch("/api/ai-grading/health")
      .then(readJsonResponse)
      .then(setHealth)
      .catch((error) => setHealth({ error: error.message }));
  }, []);

  const getExamForRun = () => {
    if (inputMode === "form") {
      const exam = formRowsToExam(examId, questionRows);
      setExamJson(JSON.stringify(exam, null, 2));
      return exam;
    }
    const exam = parseExam(examJson);
    setExamId(exam.exam_id);
    setQuestionRows(exam.questions);
    return exam;
  };

  const runGrading = async () => {
    try {
      setStatus("Validating questions...");
      const exam = getExamForRun();
      if (!pdf) throw new Error("Upload an answer booklet PDF first.");

      const formData = new FormData();
      formData.append("exam_json", JSON.stringify(exam));
      formData.append("pdf", pdf, pdf.name);

      setIsRunning(true);
      setResult(null);
      setLastExam(exam);
      setLastPdfName(pdf.name);
      setStatus("Uploading PDF and running extraction + grading. This can take a few minutes.");
      const response = await fetch("/api/ai-grading/grade-booklet", {
        method: "POST",
        body: formData,
      });
      const data = await readJsonResponse(response);
      if (!response.ok) {
        const message = data?.error || data?.detail || "AI grading failed.";
        reportFileUploadFailure({ fileName: pdf.name, endpoint: "ai-grading/grade-booklet", statusCode: response.status, message });
        throw new Error(message);
      }
      setResult(data);
      setStatus("Booklet graded. Review flagged questions before using final marks.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const exportJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ai-grading-export-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadReportPdf = () => {
    if (!result) return;
    const reportWindow = window.open("", "_blank", "width=1100,height=900");
    if (!reportWindow) {
      setStatus("Popup blocked. Allow popups to download the report PDF.");
      return;
    }
    reportWindow.document.open();
    reportWindow.document.write(buildReportHtml({ result, exam: lastExam, pdfName: lastPdfName, stats }));
    reportWindow.document.close();
    reportWindow.focus();
    setTimeout(() => {
      reportWindow.print();
    }, 350);
  };

  return (
    <>
      <Head>
        <title>AI Grading MVP</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <main className="aiPage">
        <div className="shell">
          <header className="hero">
            <div>
              <p className="eyebrow">Handwritten answer booklet evaluator</p>
              <h1>AI Grading MVP</h1>
              <p className="sub">
                Upload answer sheets, define questions with rubrics, run extraction + grading, and export a clean review report.
              </p>
            </div>
            <div className="heroMeta">
              <span className={health?.ok ? "pill good" : "pill warn"}>
                {health?.ok ? "Grading service online" : health?.error || "Checking service"}
              </span>
            </div>
          </header>

          <section className="pageFlow">
            <div className="panel stepPanel inputPanel">
              <div className="panelHeader">
                <div>
                  <span className="stepKicker">Step 1</span>
                  <h2>Questions + Rubric</h2>
                  <p>Use the form for non-technical users. JSON remains available for copy/paste workflows.</p>
                </div>
                <div className="segmented">
                  <button className={inputMode === "form" ? "active" : ""} type="button" onClick={() => setInputMode("form")}>
                    Form
                  </button>
                  <button className={inputMode === "json" ? "active" : ""} type="button" onClick={() => setInputMode("json")}>
                    JSON
                  </button>
                </div>
              </div>
              <div className="toolbar">
                <button className="btn" type="button" onClick={loadExample}>
                  Load Example
                </button>
                <button className="btn btnDanger" type="button" onClick={clearInputs}>
                  Clear
                </button>
              </div>
              {inputMode === "form" ? (
                <QuestionForm
                  examId={examId}
                  setExamId={setExamId}
                  rows={questionRows}
                  setRows={setQuestionRows}
                  syncJson={syncJsonFromForm}
                />
              ) : (
                <div className="jsonMode">
                  <textarea value={examJson} onChange={(event) => setExamJson(event.target.value)} spellCheck={false} />
                  <p className="hint">
                    JSON must contain `exam_id` and `questions`. Each question needs `id`, `text`, `max_marks`, and `rubric`.
                  </p>
                </div>
              )}
            </div>

            <div className="panel stepPanel uploadPanel">
              <div className="panelHeader">
                <div>
                  <span className="stepKicker">Step 2</span>
                  <h2>Upload Answer Booklet + Run</h2>
                  <p>Upload the scanned handwritten PDF. The run can take a few minutes because extraction and grading happen together.</p>
                </div>
              </div>
              <div className="uploadBody">
                <div className="uploadBox">
                  <span className="stripLabel">Current PDF</span>
                  <strong>{pdf?.name || "No PDF uploaded yet"}</strong>
                  <input type="file" accept="application/pdf" onChange={(event) => setPdf(event.target.files?.[0] || null)} />
                </div>
                <div className="statusBox">
                  <span className="stripLabel">Status</span>
                  <strong>{status}</strong>
                </div>
                <button className="btn btnPrimary btnRun" type="button" onClick={runGrading} disabled={isRunning}>
                  {isRunning ? "Grading..." : "Grade Booklet"}
                </button>
              </div>
            </div>

            <div className="panel stepPanel">
              <div className="panelHeader">
                <div>
                  <span className="stepKicker">Step 3</span>
                  <h2>Run Stats</h2>
                  <p>Useful numbers for grading quality, review effort, and answer coverage.</p>
                </div>
              </div>
              <div className="statsGrid">
                <StatCard label="Marks" value={result ? `${stats.totalAwarded} / ${stats.totalMax}` : "-"} detail={result ? `${fmtPct(stats.scorePct)} score` : "Run grading to see marks"} />
                <StatCard label="Review Queue" value={result ? stats.flaggedCount : "-"} detail={result ? `${stats.questionCount} questions checked` : "Flags low confidence answers"} tone={stats.flaggedCount ? "amber" : "green"} />
                <StatCard label="Extraction Confidence" value={result ? fmtPct(stats.avgExtractionConfidence) : "-"} detail={result ? `${stats.pagesSeen || "n/a"} pages referenced` : "OCR + answer matching quality"} />
                <StatCard label="Pages Referenced" value={result ? stats.pagesSeen || "n/a" : "-"} detail={result ? "Pages with detected answer evidence" : "Shown after each run"} />
              </div>
            </div>

            <div className="panel stepPanel resultsPanel">
              <div className="panelHeader">
                <div>
                  <span className="stepKicker">Step 4</span>
                  <h2>Run Output</h2>
                  <p>Quality summary, grading, extraction evidence, and reviewer queue for the latest run.</p>
                </div>
                <div className="row">
                  <button className="btn" type="button" onClick={exportJson} disabled={!result}>
                    Export JSON
                  </button>
                  <button className="btn btnPrimary" type="button" onClick={downloadReportPdf} disabled={!result}>
                    Download Report PDF
                  </button>
                </div>
              </div>

              <section className="sectionBlock">
                <div className="sectionHeader">
                  <h3>Quality Summary</h3>
                  <span className={stats.flaggedCount ? "tag warn" : "tag good"}>{result ? `${stats.flaggedCount} flagged` : "No run yet"}</span>
                </div>
                <div className="qualityGrid">
                  <StatCard label="Overall Confidence" value={result ? fmtPct(result?.graded?.grading_summary?.overall_confidence) : "-"} />
                  <StatCard label="Grading Confidence" value={result ? fmtPct(stats.avgGradingConfidence) : "-"} />
                  <StatCard label="Extraction Confidence" value={result ? fmtPct(stats.avgExtractionConfidence) : "-"} />
                </div>
              </section>

              <section className="sectionBlock">
                <div className="sectionHeader">
                  <h3>Grading Results</h3>
                  <span className="tag">{result ? `${stats.totalAwarded} / ${stats.totalMax}` : "No data"}</span>
                </div>
                <ResultsTable graded={result?.graded} />
              </section>

              <section className="sectionBlock">
                <div className="sectionHeader">
                  <h3>Review Queue</h3>
                  <span className={stats.flaggedCount ? "tag warn" : "tag good"}>{result ? `${stats.flaggedCount} needs review` : "No data"}</span>
                </div>
                <ReviewQueue extracted={result?.extracted} graded={result?.graded} />
              </section>

              <section className="sectionBlock">
                <div className="sectionHeader">
                  <h3>Extraction Evidence</h3>
                  <span className="tag">{result?.extracted ? `Overall: ${fmtPct(result.extracted.extraction_summary?.overall_confidence)}` : "No data"}</span>
                </div>
                <ExtractionEvidence extracted={result?.extracted} />
              </section>
            </div>
          </section>
        </div>
      </main>

      <style jsx global>{`
        :global(html),
        :global(body),
        :global(#__next) {
          min-height: 100%;
          height: auto;
          overflow-y: auto;
        }
        :global(body) {
          margin: 0;
          background:
            radial-gradient(circle at 12% 8%, rgba(38, 186, 199, 0.18), transparent 28%),
            radial-gradient(circle at 88% 2%, rgba(158, 228, 232, 0.24), transparent 30%),
            linear-gradient(180deg, #f1f4f9 0%, #fafbfc 44%, #f1f4f9 100%);
        }
        .aiPage {
          --bg: #f1f4f9;
          --card: #ffffff;
          --card-strong: #fafbfc;
          --stroke: #e5e9f0;
          --muted: #54505d;
          --text: #1a1d21;
          --green: #26bac7;
          --amber: #d97706;
          --danger: #ef4444;
          --blue: #1e9aa8;
          --shadow: rgba(10, 5, 23, 0.08);
          min-height: 100vh;
          color: var(--text);
          font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
          font-size: 15px;
          letter-spacing: -0.01em;
        }
        .shell {
          max-width: 1480px;
          margin: 0 auto;
          padding: 30px 22px 70px;
        }
        .hero {
          display: flex;
          justify-content: space-between;
          gap: 22px;
          align-items: flex-start;
          margin-bottom: 18px;
        }
        .eyebrow {
          color: var(--green);
          font-family: "IBM Plex Mono", monospace;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          margin: 0 0 8px;
          text-transform: uppercase;
        }
        h1,
        h2,
        h3,
        p {
          margin: 0;
        }
        h1 {
          font-size: clamp(34px, 5vw, 58px);
          font-weight: 800;
          letter-spacing: -0.055em;
          line-height: 0.95;
        }
        h2 {
          font-size: 18px;
          font-weight: 800;
        }
        h3 {
          font-size: 15px;
          font-weight: 800;
        }
        .sub {
          color: var(--muted);
          font-size: 16px;
          line-height: 1.55;
          margin-top: 10px;
          max-width: 760px;
        }
        .heroMeta,
        .row,
        .toolbar,
        .runActions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        .heroMeta {
          justify-content: flex-end;
        }
        .pill,
        .tag {
          align-items: center;
          border: 1px solid var(--stroke);
          border-radius: 999px;
          display: inline-flex;
          font-family: "IBM Plex Mono", monospace;
          font-size: 12px;
          font-weight: 700;
          gap: 8px;
          padding: 8px 11px;
          white-space: nowrap;
        }
        .pill {
          background: #ffffff;
          box-shadow: 0 14px 36px var(--shadow);
        }
        .good,
        .tag.good {
          border-color: rgba(38, 186, 199, 0.32);
          color: #1a95a1;
          background: #eff8fa;
        }
        .warn,
        .tag.warn {
          border-color: rgba(217, 119, 6, 0.24);
          color: #9a5a05;
          background: rgba(217, 119, 6, 0.1);
        }
        .uploadBox,
        .statusBox,
        .panel,
        .statCard {
          backdrop-filter: blur(18px);
          background: linear-gradient(180deg, var(--card), var(--card-strong));
          border: 1px solid var(--stroke);
          box-shadow: 0 22px 55px var(--shadow);
        }
        .stripLabel,
        .statCard span,
        .fieldLabel,
        th {
          color: var(--muted);
          font-family: "IBM Plex Mono", monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .uploadBox strong,
        .statusBox strong {
          display: block;
          font-size: 15px;
          line-height: 1.35;
          margin: 6px 0 12px;
        }
        input[type="file"] {
          color: var(--muted);
          max-width: 100%;
        }
        .statsGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          padding: 18px;
        }
        .statCard {
          border-radius: 22px;
          padding: 16px;
        }
        .statCard strong {
          display: block;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.05em;
          line-height: 1.05;
          margin-top: 8px;
        }
        .statCard small {
          color: var(--muted);
          display: block;
          font-size: 12px;
          line-height: 1.35;
          margin-top: 8px;
        }
        .statCard.green {
          border-color: rgba(94, 234, 212, 0.24);
        }
        .statCard.amber {
          border-color: rgba(251, 191, 36, 0.28);
        }
        .pageFlow {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .panel {
          border-radius: 28px;
          overflow: hidden;
        }
        .stepPanel {
          width: 100%;
        }
        .stepKicker {
          color: var(--green);
          display: inline-block;
          font-family: "IBM Plex Mono", monospace;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
          text-transform: uppercase;
        }
        .panelHeader {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
          padding: 18px;
          border-bottom: 1px solid #e5e9f0;
          background: #fafbfc;
        }
        .panelHeader p {
          color: var(--muted);
          font-size: 13px;
          line-height: 1.4;
          margin-top: 5px;
        }
        .toolbar {
          padding: 14px 18px 0;
        }
        .uploadBody {
          display: grid;
          grid-template-columns: minmax(280px, 1.1fr) minmax(280px, 1.2fr) auto;
          gap: 14px;
          align-items: stretch;
          padding: 18px;
        }
        .uploadBox,
        .statusBox {
          border-radius: 20px;
          box-shadow: none;
          padding: 16px;
        }
        .btnRun {
          align-self: stretch;
          border-radius: 20px;
          min-width: 190px;
        }
        .segmented {
          background: #f1f4f9;
          border: 1px solid #e5e9f0;
          border-radius: 999px;
          display: flex;
          padding: 4px;
        }
        .segmented button {
          border: 0;
          border-radius: 999px;
          color: var(--muted);
          cursor: pointer;
          font-weight: 800;
          background: transparent;
          padding: 8px 14px;
        }
        .segmented button.active {
          background: #26bac7;
          color: #ffffff;
        }
        .btn {
          appearance: none;
          border: 1px solid #bfc9da;
          border-radius: 999px;
          background: #ffffff;
          color: var(--text);
          cursor: pointer;
          font-weight: 800;
          padding: 10px 14px;
          transition: transform 130ms ease, background 130ms ease, border-color 130ms ease, opacity 130ms ease;
        }
        .btn:hover {
          transform: translateY(-1px);
          border-color: #26bac7;
          background: #eff8fa;
        }
        .btn:disabled {
          cursor: not-allowed;
          opacity: 0.48;
          transform: none;
        }
        .btnPrimary {
          background: #26bac7;
          border-color: transparent;
          color: #ffffff;
        }
        .btnDanger {
          border-color: rgba(239, 68, 68, 0.28);
          background: rgba(239, 68, 68, 0.08);
          color: #b91c1c;
        }
        .btnSubtle {
          padding: 7px 10px;
          font-size: 12px;
        }
        .btnWide {
          margin-top: 14px;
          width: 100%;
        }
        .formMode,
        .jsonMode {
          padding: 18px;
        }
        .formGuide {
          border: 1px solid rgba(38, 186, 199, 0.24);
          border-radius: 18px;
          background: #eff8fa;
          color: #54505d;
          font-size: 13px;
          line-height: 1.45;
          margin: 14px 0;
          padding: 12px;
        }
        .fieldLabel {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-bottom: 12px;
        }
        input[type="text"],
        input[type="number"],
        textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #e5e9f0;
          border-radius: 14px;
          background: #ffffff;
          color: var(--text);
          font: inherit;
          outline: none;
          padding: 12px 13px;
        }
        textarea {
          min-height: 560px;
          resize: vertical;
          font-family: "IBM Plex Mono", monospace;
          font-size: 13px;
          line-height: 1.55;
        }
        .smallTextArea {
          min-height: 88px;
          font-family: "IBM Plex Sans", sans-serif;
          font-size: 14px;
        }
        .rubricArea {
          min-height: 104px;
        }
        .miniGrid {
          display: grid;
          grid-template-columns: 1fr 120px;
          gap: 12px;
        }
        .questionRows {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .questionEditor {
          border: 1px solid #e5e9f0;
          border-radius: 20px;
          background: #fafbfc;
          padding: 14px;
        }
        .questionEditorTop,
        .sectionHeader,
        .answerTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .questionEditorTop {
          color: var(--text);
          font-weight: 800;
          margin-bottom: 12px;
        }
        .hint {
          color: var(--muted);
          font-size: 13px;
          line-height: 1.45;
        }
        .sectionBlock {
          padding: 18px;
          border-bottom: 1px solid #e5e9f0;
        }
        .sectionBlock:last-child {
          border-bottom: 0;
        }
        .sectionHeader {
          margin-bottom: 12px;
        }
        .qualityGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }
        .qualityGrid .statCard {
          box-shadow: none;
        }
        .tableWrap {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        th,
        td {
          border-bottom: 1px solid #e5e9f0;
          padding: 11px 10px;
          text-align: left;
          vertical-align: top;
        }
        td {
          color: #54505d;
          line-height: 1.45;
        }
        .answers {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .answerCard {
          overflow: hidden;
          border: 1px solid #e5e9f0;
          border-radius: 18px;
          background: #ffffff;
        }
        .answerCard.review {
          border-color: rgba(217, 119, 6, 0.28);
        }
        .answerTop {
          padding: 12px 14px;
          border-bottom: 1px solid #e5e9f0;
          background: #fafbfc;
        }
        .qid,
        .mono,
        pre {
          font-family: "IBM Plex Mono", monospace;
        }
        .qid {
          font-weight: 800;
        }
        .meta {
          color: var(--muted);
          display: flex;
          flex-direction: column;
          font-family: "IBM Plex Mono", monospace;
          font-size: 12px;
          gap: 3px;
          text-align: right;
        }
        .issue {
          border: 1px solid rgba(217, 119, 6, 0.24);
          border-radius: 14px;
          background: rgba(217, 119, 6, 0.1);
          color: #9a5a05;
          font-size: 13px;
          line-height: 1.4;
          margin: 12px 14px 0;
          padding: 9px 10px;
        }
        .answerBody {
          padding: 12px 14px 14px;
        }
        pre {
          color: #54505d;
          font-size: 13px;
          line-height: 1.55;
          margin: 0;
          white-space: pre-wrap;
        }
        @media (max-width: 1120px) {
          .uploadBody {
            grid-template-columns: 1fr;
          }
          .statsGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .hero {
            flex-direction: column;
          }
          .heroMeta {
            justify-content: flex-start;
          }
        }
        @media (max-width: 680px) {
          .shell {
            padding: 20px 12px 48px;
          }
          .statsGrid,
          .qualityGrid,
          .miniGrid {
            grid-template-columns: 1fr;
          }
          .uploadBody {
            padding: 14px;
          }
          .panelHeader,
          .sectionHeader {
            flex-direction: column;
            align-items: flex-start;
          }
          textarea {
            min-height: 360px;
          }
        }
      `}</style>
    </>
  );
}

AiGradingPage.nolayout = true;
