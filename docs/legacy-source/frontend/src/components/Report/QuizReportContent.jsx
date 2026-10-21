import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Empty, message, Modal } from "antd";
import { getQuizV2, getQuizSubmissionsV2 } from "@/api/Services/quizServices";
import { getLearnersByClass } from "@/api/Services/AdminService";
import { buildQuizReport } from "@/utils/quizReport";
import { downloadQuizReportPdf } from "@/utils/downloadQuizReportPdf";
import ReportSummaryHeader from "./ReportSummaryHeader";
import ScoreDistributionBars from "./ScoreDistributionBars";
import QuestionAccuracyList from "./QuestionAccuracyList";
import ReportStudentTable from "./ReportStudentTable";
import { DashboardSkeleton } from "@/components/Common/Skeletons";
import dayjs from "dayjs";

function unwrap(res) {
  const body = res?.data ?? res;
  return Array.isArray(body) ? body : (body?.data ?? body ?? []);
}

/**
 * The quiz report page's content. A standalone route (`/teacher/report/quiz/[quizId]`), reached
 * from either All Quizzes or a course's Blueprint quiz preview -- both just navigate here with
 * the quiz id, so there's one report, not two.
 */
const QuizReportContent = () => {
  const router = useRouter();
  const quizId = Number(router.query.quizId);
  const [quiz, setQuiz] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partialWarning, setPartialWarning] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (!Number.isFinite(quizId) || quizId <= 0) {
      setLoading(false);
      setError("Report not found.");
      setPartialWarning(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPartialWarning(null);

    Promise.all([
      getQuizV2(quizId, { includeCorrectAnswers: true }),
      getQuizSubmissionsV2(quizId),
    ])
      .then(async ([quizRes, submissionsRes]) => {
        if (cancelled) return;
        const quizData = quizRes?.data ?? quizRes;
        const submissions = unwrap(submissionsRes);

        let roster = null;
        if (quizData?.classId) {
          try {
            const rosterRes = await getLearnersByClass(quizData.classId);
            roster = unwrap(rosterRes);
          } catch {
            roster = null;
            setPartialWarning("Quiz and submission data loaded, but the class roster did not. Completion and missing-student counts may be unavailable.");
          }
        }

        if (cancelled) return;
        setQuiz(quizData);
        setReport(buildQuizReport({ quiz: quizData, submissions, roster }));
      })
      .catch((cause) => {
        if (cancelled) return;
        const serverMessage = cause?.response?.data?.message;
        setError(serverMessage ? `Couldn't load this quiz's report: ${serverMessage}` : "Couldn't load this quiz's report. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [router.isReady, quizId, reloadKey]);

  const handleDownload = useCallback(() => {
    if (!report) return;
    const generate = () => {
      setDownloading(true);
      try {
        downloadQuizReportPdf({ report, courseName: quiz?.courseName, incompleteNote: partialWarning || undefined });
      } catch {
        message.error("Couldn't generate the PDF. Please try again.");
      } finally {
        setDownloading(false);
      }
    };
    // F-054: an incomplete report is not exported as if it were complete; the PDF carries the warning too.
    if (partialWarning) {
      Modal.confirm({
        title: "This report is incomplete",
        content: `${partialWarning} The PDF will be marked as incomplete. Download anyway?`,
        okText: "Download marked incomplete",
        cancelText: "Cancel",
        onOk: generate,
      });
      return;
    }
    generate();
  }, [report, quiz, partialWarning]);

  if (loading) {
    return (
      <div className="ln-report-page ln-report-page--loading">
        <DashboardSkeleton metrics={4} label="Loading quiz report" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="ln-report-page">
        <Empty description={error || "Report not found."}>
          {Number.isFinite(quizId) && quizId > 0 ? (
            <Button type="primary" onClick={() => setReloadKey((value) => value + 1)}>
              Retry
            </Button>
          ) : null}
        </Empty>
      </div>
    );
  }

  return (
    <div className="ln-report-page">
      <ReportSummaryHeader
        title={report.title}
        subtitle={[quiz?.courseName, quiz?.lessonName].filter(Boolean).join(" · ")}
        onBack={() => router.back()}
        onDownloadPdf={handleDownload}
        downloading={downloading}
        stats={[
          { label: "Submitted", value: report.rosterSize ? `${report.submittedCount}/${report.rosterSize}` : String(report.submittedCount) },
          { label: "Average score", value: report.avgPercent != null ? `${report.avgPercent}%` : "—", tone: report.avgPercent != null && report.avgPercent < 60 ? "warning" : undefined },
          { label: "Questions", value: String(report.questionCount) },
          { label: "Due date", value: report.dueDate ? dayjs(report.dueDate).format("MMM D, YYYY") : "—" },
        ]}
      />
      {partialWarning && (
        <Alert
          type="warning"
          showIcon
          message="Report is partially loaded"
          description={partialWarning}
          action={<Button size="small" onClick={() => setReloadKey((value) => value + 1)}>Retry roster</Button>}
          style={{ marginBottom: 16 }}
        />
      )}

      <section className="ln-report-section">
        <h2 className="ln-report-section__title">Score distribution</h2>
        <ScoreDistributionBars distribution={report.distribution} />
      </section>

      <section className="ln-report-section">
        <h2 className="ln-report-section__title">Question accuracy</h2>
        <p className="ln-report-section__subtitle">Worst-answered first.</p>
        <QuestionAccuracyList questions={report.questions} />
      </section>

      <section className="ln-report-section">
        <h2 className="ln-report-section__title">Student scores</h2>
        <ReportStudentTable
          students={report.students}
          extraColumnLabel="Submitted"
          renderExtra={(student) => (
            student.submittedAt ? dayjs(student.submittedAt).format("MMM D, h:mm A") : "—"
          )}
          emptyMessage="No one has submitted this quiz yet."
        />
      </section>
    </div>
  );
};

export default QuizReportContent;
