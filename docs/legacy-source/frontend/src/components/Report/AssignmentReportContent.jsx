import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Empty, message, Modal } from "antd";
import { getAssignmentSubmissions } from "@/api/Services/courseServices";
import { getLessonContentById, getLearnersByClass } from "@/api/Services/AdminService";
import { buildAssignmentReport } from "@/utils/assignmentReport";
import { downloadAssignmentReportPdf } from "@/utils/downloadAssignmentReportPdf";
import ReportSummaryHeader from "./ReportSummaryHeader";
import ScoreDistributionBars from "./ScoreDistributionBars";
import SubmissionTimingCard from "./SubmissionTimingCard";
import ReportStudentTable from "./ReportStudentTable";
import { DashboardSkeleton } from "@/components/Common/Skeletons";
import dayjs from "dayjs";

// Same unwrap as viewSubmissionsModal.jsx's unwrapSubmissions -- the assignment submissions
// endpoint returns a plain array for its "legacy" (no page/size) call shape, but a Spring
// Page<...> ({ content, totalElements, ... }) once page/size are supplied, which this report page
// does (see the getAssignmentSubmissions call below for why). Kept duplicated per this codebase's
// established convention rather than importing a sibling page's local helper.
function unwrap(res) {
  const data = res?.data ?? res;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  return [];
}

/**
 * The assignment report page's content. A standalone route
 * (`/teacher/report/assignment/[contentId]`), reached from either All Assignments or a course's
 * Blueprint assignment preview -- both just navigate here with the content id.
 */
const AssignmentReportContent = () => {
  const router = useRouter();
  const contentId = Number(router.query.contentId);
  const [assignment, setAssignment] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partialWarning, setPartialWarning] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (!Number.isFinite(contentId) || contentId <= 0) {
      setLoading(false);
      setError("Report not found.");
      setPartialWarning(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPartialWarning(null);

    getLessonContentById(contentId)
      .then(async (assignmentRes) => {
        if (cancelled) return;
        const body = assignmentRes?.data ?? assignmentRes;
        const assignmentData = body?.data ?? body;
        if (!assignmentData || Number(assignmentData.id) !== contentId) {
          throw new Error("Assignment not found");
        }

        const classId = assignmentData?.classId ?? assignmentData?.class_id;
        const [submissionsRes, rosterRes] = await Promise.allSettled([
          // Every page, not one (F-052): the backend pages at 100, and a report that stops there gets the average,
          // the distribution and "who's missing" wrong for any larger class.
          getAssignmentSubmissions({ lessonContentId: contentId, all: true }),
          classId ? getLearnersByClass(classId) : Promise.resolve(null),
        ]);

        if (cancelled) return;
        // Submission rows are the decisive source for every report metric. A rejected request is
        // unknown report state, never a real "0 submissions" result.
        if (submissionsRes.status !== "fulfilled") {
          throw submissionsRes.reason || new Error("Could not load assignment submissions");
        }
        const submissions = unwrap(submissionsRes.value);
        const roster = rosterRes.status === "fulfilled" && rosterRes.value ? unwrap(rosterRes.value) : null;
        if (classId && rosterRes.status !== "fulfilled") {
          setPartialWarning("Submission data loaded, but the class roster did not. Completion and missing-student counts may be unavailable.");
        }

        setAssignment(assignmentData);
        setReport(buildAssignmentReport({ assignment: assignmentData, submissions, roster }));
      })
      .catch((cause) => {
        if (cancelled) return;
        const serverMessage = cause?.response?.data?.message;
        setError(serverMessage ? `Couldn't load this assignment's report: ${serverMessage}` : "Couldn't load this assignment's report. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [router.isReady, contentId, reloadKey]);

  const handleDownload = useCallback(() => {
    if (!report) return;
    const generate = () => {
      setDownloading(true);
      try {
        downloadAssignmentReportPdf({ report, courseName: assignment?.courseName, incompleteNote: partialWarning || undefined });
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
  }, [report, assignment, partialWarning]);

  if (loading) {
    return (
      <div className="ln-report-page ln-report-page--loading">
        <DashboardSkeleton metrics={4} label="Loading assignment report" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="ln-report-page">
        <Empty
          description={error || "Report not found."}
        >
          {Number.isFinite(contentId) && contentId > 0 ? (
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
        subtitle={assignment?.courseName}
        onBack={() => router.back()}
        onDownloadPdf={handleDownload}
        downloading={downloading}
        stats={[
          { label: "Submitted", value: report.rosterSize ? `${report.submittedCount}/${report.rosterSize}` : String(report.submittedCount) },
          { label: "Average score", value: report.avgPercent != null ? `${report.avgPercent}%` : "—", tone: report.avgPercent != null && report.avgPercent < 60 ? "warning" : undefined },
          { label: "Graded", value: `${report.gradedCount}/${report.submittedCount}` },
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
        <h2 className="ln-report-section__title">Submission timing</h2>
        <SubmissionTimingCard
          onTimeCount={report.onTimeCount}
          lateCount={report.lateCount}
          notSubmitted={report.notSubmitted}
        />
      </section>

      <section className="ln-report-section">
        <h2 className="ln-report-section__title">Student scores</h2>
        <ReportStudentTable
          students={report.students}
          extraColumnLabel="Submitted"
          renderExtra={(student) => (
            student.submittedAt ? (
              <>
                {dayjs(student.submittedAt).format("MMM D, h:mm A")}
                {student.isLate && <span className="ln-report-table__late-badge">Late</span>}
              </>
            ) : "—"
          )}
          emptyMessage="No one has submitted this assignment yet."
        />
      </section>
    </div>
  );
};

export default AssignmentReportContent;
