import {
  getAssignmentSubmissions,
} from "@/api/Services/courseServices";
import { Alert, Button, Empty, Input, List, message, Modal, Select, Spin, Typography } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Markup } from "interweave";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getFileUrl } from "@/api/Services/AdminService";
import Api from "@/api/ApiMethod";

// Same tinted-initials language as the quiz submissions list (Quiz/Table/table.js,
// quizpanel.js) and the Students roster, for the same reason: a name-only row gives the eye
// nothing to lock onto in a 30+ student list.
const AVATAR_TINTS = [
  { bg: "#e0f2f1", fg: "#0f766e" },
  { bg: "#ede9fe", fg: "#5b21b6" },
  { bg: "#fef3c7", fg: "#92400e" },
  { bg: "#e0e7ff", fg: "#3730a3" },
  { bg: "#fce7f3", fg: "#9d174d" },
  { bg: "#dcfce7", fg: "#166534" },
];

function studentInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

function studentAvatarTint(seedValue) {
  const seed = String(seedValue ?? "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_TINTS[seed % AVATAR_TINTS.length];
}

function unwrapSubmissions(response) {
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  return [];
}

function getSubmissionId(submission) {
  return submission?.id ?? submission?.submissionId ?? submission?.studentAssignmentId;
}

function getSubmissionStudentId(submission) {
  return submission?.studentId ?? submission?.student_id ?? submission?.learnerId ?? submission?.learner_id;
}

function getSubmissionStudentName(submission) {
  const firstName = submission?.studentFirstName ?? submission?.student_first_name ?? submission?.firstName ?? "";
  const lastName = submission?.studentLastName ?? submission?.student_last_name ?? submission?.lastName ?? "";
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || `Student ${getSubmissionStudentId(submission) ?? ""}`.trim();
}

function getSubmissionFileDTO(submission) {
  return submission?.fileDTO ?? submission?.file_dto ?? submission?.fileDto ?? null;
}

function getSubmissionFileKey(submission) {
  const fileDTO = getSubmissionFileDTO(submission);
  return fileDTO?.cloud_storage_object ?? fileDTO?.cloudStorageObject ?? fileDTO?.url ?? "";
}

function getSubmissionType(submission) {
  return submission?.submissionType ?? submission?.submission_type ?? "";
}

function getSubmissionLink(submission) {
  return submission?.submissionLink ?? submission?.submission_link ?? "";
}

function getSubmissionAssets(submission) {
  const assets = submission?.submissionAssets ?? submission?.submission_assets ?? [];
  return Array.isArray(assets) ? assets : [];
}

function getAssignmentId(assignment) {
  return assignment?.id ?? assignment?.lessonContentId ?? assignment?.lesson_content_id;
}

function getSubmissionOptionKey(submission) {
  return String(getSubmissionId(submission) ?? getSubmissionStudentId(submission) ?? "");
}

// Same "has a grade" test the per-student grade-panel effect already runs on select -- pulled out
// so the student list can show the same Graded/Pending state without waiting for a click.
function isSubmissionGraded(submission) {
  const points = submission?.pointsObtained;
  return submission?.graded === 1 || (points != null && points !== "" && Number(points) >= 0);
}

function SubmissionPdfPreview({ assignmentPdf }) {
  return (
    <iframe
      src={assignmentPdf}
      title="Submitted assignment PDF preview"
      width="100%"
      height="520"
      style={{ border: "none", borderRadius: 12, background: "#f8fafc" }}
      allowFullScreen
      sandbox="allow-same-origin allow-scripts"
    >
      <p>Preview not available. <a href={assignmentPdf} target="_blank" rel="noopener noreferrer">Open PDF</a></p>
    </iframe>
  );
}

function getAssetFileDTO(asset) {
  return asset?.fileDTO ?? asset?.file_dto ?? null;
}

function getAssetFileKey(asset) {
  const fileDTO = getAssetFileDTO(asset);
  return fileDTO?.cloud_storage_object ?? fileDTO?.cloudStorageObject ?? fileDTO?.url ?? "";
}

const SUBMISSION_ALLOWED_TAGS = [
  "p", "div", "span",
  "strong", "em", "u", "s", "br",
  "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "a", "img",
  "table", "thead", "tbody", "tr", "th", "td",
  "code", "pre", "blockquote",
];

function ViewSubmissionsModal({ open, onClose, selectedViewAssignment }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [gradesSubmitted, setGradesSubmitted] = useState(false);
  const [isEditingGrade, setIsEditingGrade] = useState(false);
  const [grades, setGrades] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const loadedAssignmentIdRef = useRef(null);
  const [gradeSubmitting, setGradeSubmitting] = useState(false);
  const gradeSubmittingRef = useRef(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [selectedStudentPdfUrl, setSelectedStudentPdfUrl] = useState("");
  const [assetUrls, setAssetUrls] = useState({});
  const msgKey = "grade-submit-msg";
  const assignmentTitle =
    selectedViewAssignment?.contentTitle ||
    selectedViewAssignment?.content_title ||
    "Assignment submissions";

  // Only load once the popup is actually opened. It stays mounted inside the assignment drawer,
  // which the syllabus feeds whatever item was opened last (a quiz, a video), so fetching on mount
  // sent those ids to fetchSubmissions and logged 404s/403s on prod.
  useEffect(() => {
    const assignmentId = getAssignmentId(selectedViewAssignment);
    if (!open || !assignmentId) return;
    let cancelled = false;
    const replacingAssignment = loadedAssignmentIdRef.current !== assignmentId;
    setLoading(true);
    setLoadError(null);
    if (replacingAssignment) {
      setStudents([]);
      setSelectedStudent(null);
    }
    getAssignmentSubmissions({ lessonContentId: assignmentId, all: true })
      .then(res => {
        if (cancelled) return;
        const submissions = unwrapSubmissions(res);
        loadedAssignmentIdRef.current = assignmentId;
        setStudents(submissions);
        setSelectedStudent((current) => {
          const currentKey = current ? getSubmissionOptionKey(current) : null;
          return submissions.find((item) => getSubmissionOptionKey(item) === currentKey) ?? submissions?.[0] ?? null;
        });
        setLoadError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        if (replacingAssignment) {
          setStudents([]);
          setSelectedStudent(null);
        }
        setLoadError(error?.response?.data?.message || "Failed to load submissions");
        messageApi.open({ type: "error", content: "Failed to load submissions", duration: 2 });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, selectedViewAssignment, messageApi, reloadKey]);

  useEffect(() => {
    const points = selectedStudent?.pointsObtained;
    setGrades(points ?? "");
    const hasExistingGrade =
      selectedStudent?.graded === 1 ||
      (points != null && points !== "" && Number(points) >= 0);
    setGradesSubmitted(hasExistingGrade);
    setIsEditingGrade(!hasExistingGrade);
  }, [selectedStudent]);

  useEffect(() => {
    let cancelled = false;
    const key = getSubmissionFileKey(selectedStudent);
    const assets = getSubmissionAssets(selectedStudent);
    const fileAssets = assets.filter((asset) => getAssetFileKey(asset));
    if (!key) {
      setSelectedStudentPdfUrl("");
    }
    if (!key && fileAssets.length === 0) {
      setFileLoading(false);
      setAssetUrls({});
      return;
    }
    setFileLoading(true);
    const options = {
      courseId: selectedViewAssignment?.courseId ?? selectedViewAssignment?.course_id,
      classId: selectedViewAssignment?.classId ?? selectedViewAssignment?.class_id,
      userId: getSubmissionStudentId(selectedStudent),
    };
    Promise.all([
      key ? getFileUrl(key, options).catch(() => "") : Promise.resolve(""),
      Promise.all(
        fileAssets.map((asset) =>
          getFileUrl(getAssetFileKey(asset), options)
            .then((url) => ({ id: asset?.id, url: url || "" }))
            .catch(() => ({ id: asset?.id, url: "" }))
        )
      ),
    ])
      .then(([primaryUrl, urls]) => {
        if (cancelled) return;
        setSelectedStudentPdfUrl(primaryUrl || "");
        setAssetUrls(
          urls.reduce((acc, item) => {
            if (item?.id) acc[item.id] = item.url;
            return acc;
          }, {})
        );
      })
      .finally(() => { if (!cancelled) setFileLoading(false); });
    return () => { cancelled = true; };
  }, [selectedStudent, selectedViewAssignment]);

  const selectedStudentKey = selectedStudent ? getSubmissionOptionKey(selectedStudent) : undefined;
  const gradedCount = useMemo(() => students.filter(isSubmissionGraded).length, [students]);
  const selectedIndex = useMemo(
    () => students.findIndex((student) => getSubmissionOptionKey(student) === selectedStudentKey),
    [students, selectedStudentKey]
  );
  const goToStudent = (index) => {
    if (gradeSubmittingRef.current || index < 0 || index >= students.length) return;
    setSelectedStudent(students[index]);
  };

  return (
    <Modal
      open={open}
      onCancel={() => { if (!gradeSubmittingRef.current) onClose?.(); }}
      footer={null}
      centered
      destroyOnClose
      width={780}
      title={assignmentTitle}
      className="ln-assignment-submissions-modal ln-mobile-safe-modal"
      wrapClassName="ln-mobile-safe-modal-wrap"
    >
      {contextHolder}
      {loading && students.length === 0 ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 240 }}>
          <Spin />
        </div>
      ) : loadError && students.length === 0 ? (
        <Alert
          type="error"
          showIcon
          message="Submissions could not be loaded"
          description={loadError}
          action={<Button size="small" onClick={() => setReloadKey((value) => value + 1)}>Retry</Button>}
        />
      ) : students.length === 0 ? (
        <Empty description="No submissions yet" />
      ) : (
        <>
          {loadError ? (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
              message="Showing the last loaded submissions"
              description={loadError}
              action={<Button size="small" onClick={() => setReloadKey((value) => value + 1)}>Retry</Button>}
            />
          ) : null}
        <div className="ln-assignment-submissions-modal__content">
          <List
            size="small"
            dataSource={students}
            header={
              <Typography.Text strong>
                Students <Typography.Text type="secondary">({gradedCount}/{students.length} graded)</Typography.Text>
              </Typography.Text>
            }
            className="ln-assignment-submissions-modal__students"
            renderItem={(student) => {
              const key = getSubmissionOptionKey(student);
              const name = getSubmissionStudentName(student);
              const tint = studentAvatarTint(getSubmissionStudentId(student) ?? name);
              const graded = isSubmissionGraded(student);
              return (
                <List.Item className={key === selectedStudentKey ? "is-active" : ""}>
                  <button
                    type="button"
                    className="ln-submission-student-row"
                    disabled={gradeSubmitting}
                    onClick={() => { if (!gradeSubmittingRef.current) setSelectedStudent(student); }}
                  >
                    <span
                      className="ln-submission-student-row__avatar"
                      style={{ background: tint.bg, color: tint.fg }}
                      aria-hidden="true"
                    >
                      {studentInitials(name)}
                    </span>
                    <span className="ln-submission-student-row__name">{name}</span>
                    <span className={`ln-submission-student-row__status ${graded ? "is-graded" : "is-pending"}`}>
                      {graded ? "Graded" : "Pending"}
                    </span>
                  </button>
                </List.Item>
              );
            }}
          />
          <div className="ln-assignment-submissions-modal__main">
            <div className="ln-assignment-submissions-modal__picker">
              {/* Desktop has the student list to the left; this Select exists purely for mobile,
                  where that list is hidden (see the max-width: 767px rule below) -- it used to
                  render unconditionally on every width, duplicating the list as a second, fully
                  redundant way to do the exact same thing right next to it. */}
              <Select
                showSearch
                optionFilterProp="label"
                value={selectedStudentKey}
                placeholder="Select student"
                className="ln-assignment-submissions-modal__mobile-picker"
                style={{ width: "100%" }}
                options={students.map((student) => ({
                  value: getSubmissionOptionKey(student),
                  label: getSubmissionStudentName(student),
                }))}
                disabled={gradeSubmitting}
                onChange={(value) => {
                  if (gradeSubmittingRef.current) return;
                  const next = students.find((student) => getSubmissionOptionKey(student) === String(value));
                  setSelectedStudent(next ?? null);
                }}
              />
              {/* Grading submissions one after another was a click back to the list (or the
                  mobile dropdown) per student -- these move through the same order without
                  leaving the grading panel. */}
              <div className="ln-assignment-submissions-modal__nav">
                <Button
                  icon={<LeftOutlined aria-hidden />}
                  disabled={gradeSubmitting || selectedIndex <= 0}
                  onClick={() => goToStudent(selectedIndex - 1)}
                  aria-label="Previous student"
                />
                <span className="ln-assignment-submissions-modal__nav-count">
                  {selectedIndex + 1} / {students.length}
                </span>
                <Button
                  icon={<RightOutlined aria-hidden />}
                  disabled={gradeSubmitting || selectedIndex < 0 || selectedIndex >= students.length - 1}
                  onClick={() => goToStudent(selectedIndex + 1)}
                  aria-label="Next student"
                />
              </div>
            </div>
            {getSubmissionAssets(selectedStudent).length > 0 ? (
              <div className="ln-assignment-submissions-modal__preview black">
                {getSubmissionAssets(selectedStudent).map((asset) => {
                  const type = asset?.type || "";
                  const key = getAssetFileKey(asset);
                  const resolvedUrl = assetUrls[asset?.id] || "";
                  if (type === "WRITTEN_RESPONSE") {
                    return (
                      <div key={asset?.id} className="mb-3">
                        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                          Written Response
                        </Typography.Text>
                        <Markup content={selectedStudent?.htmlContent || ""} allowList={SUBMISSION_ALLOWED_TAGS} />
                      </div>
                    );
                  }
                  if (key) {
                    return (
                      <div key={asset?.id} className="mb-3">
                        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                          {asset?.title || (type === "PDF_UPLOAD" ? "Uploaded PDF" : "Uploaded File")}
                        </Typography.Text>
                        {resolvedUrl ? (
                          <a href={resolvedUrl} target="_blank" rel="noopener noreferrer">
                            Open file
                          </a>
                        ) : (
                          <Typography.Text type="secondary">Unable to load this file</Typography.Text>
                        )}
                      </div>
                    );
                  }
                  if (asset?.link) {
                    return (
                      <div key={asset?.id} className="mb-3">
                        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                          {type === "REPOSITORY_LINK" ? "Repository Link" : "Submitted Link"}
                        </Typography.Text>
                        <a href={asset.link} target="_blank" rel="noopener noreferrer">
                          {asset.link}
                        </a>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ) : getSubmissionFileKey(selectedStudent) ? (
              <div className="ln-assignment-submissions-modal__preview">
                {fileLoading ? (
                  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}>
                    <Spin />
                  </div>
                ) : selectedStudentPdfUrl ? (
                  <SubmissionPdfPreview assignmentPdf={selectedStudentPdfUrl} />
                ) : (
                  <Empty description="Unable to load this submitted file" />
                )}
              </div>
            ) : getSubmissionLink(selectedStudent) ? (
              <div className="ln-assignment-submissions-modal__preview black">
                <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                  {getSubmissionType(selectedStudent) === "REPOSITORY_LINK" ? "Repository Link" : "Submitted Link"}
                </Typography.Text>
                <a href={getSubmissionLink(selectedStudent)} target="_blank" rel="noopener noreferrer">
                  {getSubmissionLink(selectedStudent)}
                </a>
              </div>
            ) : selectedStudent?.htmlContent ? (
              <div className="ln-assignment-submissions-modal__preview black">
                <Markup content={selectedStudent.htmlContent} allowList={SUBMISSION_ALLOWED_TAGS} />
              </div>
            ) : (
              <Empty description="Select a student to view their submission" />
            )}

            <div className="ln-assignment-submissions-modal__grade">
              <span className={`ln-submission-grade-status ${gradesSubmitted ? "is-graded" : "is-pending"}`}>
                {selectedStudent?.gradePublished || selectedStudent?.isGradePublished
                  ? `Graded: ${selectedStudent?.pointsObtained} pts`
                  : gradesSubmitted
                    ? `Graded: ${grades} pts`
                    : "Grade pending"}
              </span>
              {(() => {
                // Cap at what the assignment is worth (was a flat 0-1000, so "15 / 10" saved fine).
                const maxPoints = Number(selectedStudent?.points ?? selectedViewAssignment?.points
                  ?? selectedViewAssignment?.contentDataDTO?.points) || 0;
                const limit = maxPoints > 0 ? maxPoints : 1000;
                return (
                  <Input
                    type="number"
                    disabled={!isEditingGrade || gradeSubmitting}
                    placeholder="Grade points"
                    value={grades}
                    min={0}
                    max={limit}
                    step={1}
                    suffix={maxPoints > 0 ? `/ ${maxPoints}` : undefined}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === "" || (Number(val) >= 0 && Number(val) <= limit)) {
                        setGrades(val);
                      }
                    }}
                  />
                );
              })()}
              {isEditingGrade ? (
                <Button type="primary" onClick={submitGrades} loading={gradeSubmitting} disabled={gradeSubmitting}>Submit grade</Button>
              ) : (
                <Button onClick={() => setIsEditingGrade(true)} disabled={gradeSubmitting}>Edit grade</Button>
              )}
            </div>
          </div>
        </div>
        </>
      )}
    </Modal>
  );

  // Was posting to /api/v1/assignment/submit — the LEARNER submission endpoint, which the
  // backend explicitly rejects for any non-learner principal (AssignmentController.submit()
  // 403s any caller that isn't a learner). Faculty clicking "Submit grade" here always failed.
  // Even ignoring that, submit() never reads points_obtained/submission_id at all — those fields
  // were silently dropped. The correct grading endpoints, already used correctly by the sibling
  // quiz-grading screen (submissondata.js), are updatePoints then publishGrade.
  async function submitGrades() {
    if (gradeSubmittingRef.current) return;
    if (grades === "" || grades == null || !Number.isFinite(Number(grades))) {
      messageApi.open({ key: msgKey, type: "warning", content: "Enter a score before submitting", duration: 2 });
      return;
    }
    const studentAssignmentId = getSubmissionId(selectedStudent);
    const selectedKey = selectedStudent ? getSubmissionOptionKey(selectedStudent) : null;
    const gradeValue = grades;
    if (!studentAssignmentId || !selectedKey) {
      messageApi.open({ key: msgKey, type: "error", content: "Could not resolve this submission", duration: 2 });
      return;
    }
    const shownAssignmentId = getAssignmentId(selectedViewAssignment);
    const submissionAssignmentId = selectedStudent?.lessonContentId ?? selectedStudent?.lesson_content_id;
    if (submissionAssignmentId != null && shownAssignmentId != null && String(submissionAssignmentId) !== String(shownAssignmentId)) {
      messageApi.open({ key: msgKey, type: "error", content: "This submission belongs to a different assignment. Reopen the assignment and try again.", duration: 4 });
      return;
    }
    gradeSubmittingRef.current = true;
    setGradeSubmitting(true);
    try {
      await Api.patch("/api/v1/assignment/updatePoints", null, {
        params: { studentAssignmentId, pointsObtained: gradeValue },
      });
      await Api.post("/api/v1/assignment/publishGrade", null, {
        params: { studentAssignmentId },
      });
      messageApi.open({ key: msgKey, type: "success", content: "Grade submitted", duration: 2 });
      setStudents((previous) => previous.map((item) =>
        getSubmissionOptionKey(item) === selectedKey
          ? { ...item, pointsObtained: gradeValue, graded: 1, gradePublished: true, isGradePublished: true }
          : item
      ));
      setSelectedStudent((previous) =>
        previous && getSubmissionOptionKey(previous) === selectedKey
          ? { ...previous, pointsObtained: gradeValue, graded: 1, gradePublished: true, isGradePublished: true }
          : previous
      );
      setGradesSubmitted(true);
      setIsEditingGrade(false);
    } catch (error) {
      messageApi.open({
        key: msgKey,
        type: "error",
        content: error?.response?.data?.message || "Failed to submit grade",
        duration: 2,
      });
    } finally {
      gradeSubmittingRef.current = false;
      setGradeSubmitting(false);
    }
  }
}

export default ViewSubmissionsModal;
