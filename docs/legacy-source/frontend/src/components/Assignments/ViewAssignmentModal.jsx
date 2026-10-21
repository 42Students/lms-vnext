import DrawerWidget from "@/components/Global/RightDrawer/DrawerWidget";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { Markup } from "interweave";
import SubmitAssignmentModal from "./SubmitAssignmentModal";
import { useSelector } from "react-redux";
import { getSubmittedAssign } from "@/api/Services/courseServices";
import { getFileUrl } from "@/api/Services/AdminService";
import { Alert, Button, Empty } from "antd";
import { deadlineMs, isPastDeadline } from "@/utils/dateUtils";
import {
  FileSearchOutlined, BarChartOutlined, FileTextOutlined, FilePdfOutlined, PaperClipOutlined,
  LinkOutlined, ExportOutlined, DownloadOutlined, CalendarOutlined, ArrowLeftOutlined,
} from "@ant-design/icons";
import {
  ASSIGNMENT_RESOURCE_TYPES,
  getSubmissionTypeLabel,
  normalizeAllowedSubmissionTypes,
  normalizeAssignmentResources,
  normalizeSubmissionResources,
} from "@/utils/assignmentSchema";

// Same submissions viewer the All Assignments page already uses (student list, PDF preview,
// grading) -- this was the "blunder" the punch list called out: clicking an assignment from the
// Blueprint page only ever showed resources/Open PDF/Download, with no way to see who submitted
// without leaving the page and going to All Assignments instead.
const ViewSubmissionsModal = dynamic(
  () => import("@/pages/Dashboard/course/syllabus/viewSubmissionsModal"),
  { ssr: false }
);

const ASSIGNMENT_ALLOWED_TAGS = [
  "p", "div", "span", "strong", "em", "u", "s", "br",
  "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
  "a", "img", "table", "thead", "tbody", "tr", "th", "td",
  "code", "pre", "blockquote",
];

const RESOURCE_META = {
  [ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS]: { icon: FileTextOutlined, label: "Instructions", tone: "text" },
  [ASSIGNMENT_RESOURCE_TYPES.PDF]: { icon: FilePdfOutlined, label: "PDF", tone: "file" },
  [ASSIGNMENT_RESOURCE_TYPES.FILE]: { icon: PaperClipOutlined, label: "File", tone: "file" },
  [ASSIGNMENT_RESOURCE_TYPES.LINK]: { icon: LinkOutlined, label: "Link", tone: "link" },
};

function ResourceCard({ resource, fileUrl }) {
  const meta = RESOURCE_META[resource?.type] || { icon: PaperClipOutlined, label: "Resource", tone: "file" };
  const Icon = meta.icon;
  const isFileType = [ASSIGNMENT_RESOURCE_TYPES.PDF, ASSIGNMENT_RESOURCE_TYPES.FILE].includes(resource?.type);
  const isLink = resource?.type === ASSIGNMENT_RESOURCE_TYPES.LINK && resource?.link;
  return (
    <div className={`ln-assign-resource ln-assign-resource--${meta.tone}`}>
      <div className="ln-assign-resource__head">
        <span className="ln-assign-resource__icon" aria-hidden="true"><Icon /></span>
        <div className="ln-assign-resource__heading">
          <strong className="ln-assign-resource__title">{resource?.title || meta.label}</strong>
          <span className="ln-assign-resource__kind">{meta.label}</span>
        </div>
        {isLink ? (
          <Button icon={<ExportOutlined />} href={resource.link} target="_blank" rel="noopener noreferrer">
            Open link
          </Button>
        ) : null}
        {isFileType && fileUrl ? (
          <div className="ln-assign-resource__actions">
            <Button type="primary" ghost href={fileUrl} target="_blank" rel="noopener noreferrer">
              {resource.type === ASSIGNMENT_RESOURCE_TYPES.PDF ? "Open PDF" : "Open file"}
            </Button>
            <Button
              icon={<DownloadOutlined />}
              href={fileUrl}
              download={resource?.file_dto?.original_name || resource?.title || "resource"}
              aria-label={`Download ${resource?.title || "file"}`}
            />
          </div>
        ) : null}
      </div>
      {resource?.type === ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS && (
        <div className="ln-assign-resource__body ln-assign-rich">
          <Markup content={resource?.text || ""} allowList={ASSIGNMENT_ALLOWED_TAGS} />
        </div>
      )}
      {isLink ? (
        <a className="ln-assign-resource__url" href={resource.link} target="_blank" rel="noopener noreferrer">
          {resource.link}
        </a>
      ) : null}
      {isFileType && !fileUrl && (
        <div className="ln-assign-resource__muted">File preview is unavailable right now.</div>
      )}
    </div>
  );
}

function formatDue(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const hasTime = /T\d{2}:\d{2}/.test(String(value));
  // Same "10 Oct 2026, 12:56 PM" as the assignment cards; the browser-locale version gave a bare
  // 24-hour "12:56" with no AM/PM.
  const day = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return hasTime ? `${day}, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : day;
}

export default function ViewAssignmentDrawer({ open, onClose, assignmentContent, insideSyllabus }) {
  const router = useRouter();
  const [viewAssignment, setViewAssignment] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState(false);
  const [viewingSubmissions, setViewingSubmissions] = useState(false);
  const loginUser = useSelector((state) => state?.loginUser);
  const isTeacherRole = loginUser?.userType === "FACULTY";
  const [disableSubmit, setDisableSubmit] = useState(false);
  const [mySubmission, setMySubmission] = useState(null);
  const [submissionState, setSubmissionState] = useState(isTeacherRole ? "ready" : "idle");
  const [submissionRefresh, setSubmissionRefresh] = useState(0);
  const [resourceUrls, setResourceUrls] = useState({});

  const assignmentRecord = assignmentContent?.record || assignmentContent;
  const assignmentRecordId = assignmentRecord?.id ?? assignmentRecord?.lessonContentId ?? assignmentRecord?.lesson_content_id;
  // The backend rejects assignment submissions after the cutoff. Prefer its canonical deadline,
  // with nested due_date kept only as compatibility for rows created by the older faculty editor.
  const assignmentDueDate = assignmentRecord?.deadline
    ?? assignmentRecord?.contentDataDTO?.due_date
    ?? assignmentRecord?.contentDataDTO?.dueDate
    ?? assignmentRecord?.content_data_dto?.due_date
    ?? assignmentRecord?.content_data_dto?.dueDate
    ?? null;
  const dueMs = deadlineMs(assignmentDueDate);
  const deadlineUnavailable = !Number.isFinite(dueMs);
  const isPastDue = !deadlineUnavailable && isPastDeadline(assignmentDueDate);
  const isDueSoon = !deadlineUnavailable && !isPastDue && dueMs - Date.now() < 48 * 60 * 60 * 1000;
  const dueLabel = formatDue(assignmentDueDate);
  const allowedTypes = useMemo(
    () => normalizeAllowedSubmissionTypes(assignmentRecord?.contentDataDTO || assignmentRecord?.content_data_dto),
    [assignmentRecord]
  );
  const resources = useMemo(() => {
    if (assignmentRecord?.contentDataDTO || assignmentRecord?.content_data_dto) {
      return normalizeAssignmentResources(assignmentRecord?.contentDataDTO || assignmentRecord?.content_data_dto);
    }
    if (assignmentContent?.content) {
      return [
        {
          id: "legacy-inline-file",
          type: ASSIGNMENT_RESOURCE_TYPES.PDF,
          title: assignmentContent?.contentTitle || "Assignment PDF",
          text: "",
          link: "",
          file_dto: {
            size: 0,
            encoding: "",
            mimetype: "application/pdf",
            field_name: "",
            original_name: assignmentContent?.contentTitle || "assignment.pdf",
            cloud_storage_object: assignmentContent.content,
          },
        },
      ];
    }
    return [];
  }, [assignmentContent, assignmentRecord]);

  useEffect(() => {
    let cancelled = false;
    if (!open || isTeacherRole || !assignmentRecordId) {
      if (isTeacherRole) setSubmissionState("ready");
      return undefined;
    }

    // The old flow had no catch handler here. If submission-history lookup failed, disableSubmit
    // stayed false and the footer confidently offered "Submit Your Work" even though the current
    // submission state was unknown. Treat unknown as unavailable, never as "not submitted".
    setSubmissionState("loading");
    setDisableSubmit(false);
    setMySubmission(null);
    getSubmittedAssign({ learnerId: loginUser?.id })
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const foundSubmitted = list.find((item) => item?.lessonContentId == assignmentRecordId);
        setDisableSubmit(!!foundSubmitted);
        setMySubmission(foundSubmitted || null);
        setSubmissionState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setDisableSubmit(false);
        setMySubmission(null);
        setSubmissionState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [assignmentRecordId, isTeacherRole, loginUser?.id, open, submissionRefresh]);

  const handleSubmitted = (submission) => {
    // Make the parent authoritative immediately so the Submit action cannot reappear while
    // the submission-history request catches up.
    setDisableSubmit(true);
    setSubmissionState("ready");
    if (submission) setMySubmission(submission);
    setViewAssignment(false);
    getSubmittedAssign({ learnerId: loginUser?.id })
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const foundSubmitted = list.find((item) => item?.lessonContentId == assignmentRecordId);
        if (foundSubmitted) setMySubmission(foundSubmitted);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!open) {
      setViewAssignment(false);
      setViewingSubmission(false);
      setViewingSubmissions(false);
    }
  }, [open]);

  const submissionResources = useMemo(
    () => normalizeSubmissionResources(mySubmission),
    [mySubmission]
  );

  useEffect(() => {
    let active = true;
    async function loadResourceUrls() {
      const nextUrls = {};
      for (const resource of [...resources, ...submissionResources]) {
        const key = resource?.file_dto?.cloud_storage_object;
        if (!key) continue;
        if (/^https?:\/\//i.test(key)) {
          nextUrls[resource.id] = key;
          continue;
        }
        try {
          nextUrls[resource.id] = await getFileUrl(key, {
            courseId: assignmentRecord?.courseId ?? assignmentRecord?.course_id,
            classId: assignmentRecord?.classId ?? assignmentRecord?.class_id,
          });
        } catch {
          nextUrls[resource.id] = "";
        }
      }
      if (active) setResourceUrls(nextUrls);
    }
    if (open) loadResourceUrls();
    return () => {
      active = false;
    };
  }, [assignmentRecord, open, resources, submissionResources]);

  return (
    <>
      <DrawerWidget
        className="ln-assignment-view-drawer"
        title={assignmentRecord?.contentTitle || assignmentContent?.contentTitle}
        drawerOpen={open}
        onClose={onClose}
        primaryButtonTitle={!insideSyllabus && "Close"}
        secondaryButtonTitle={
          isTeacherRole
            ? "View Submissions"
            : viewingSubmission
              ? undefined
              : submissionState === "loading"
                ? "Checking submission…"
                : submissionState === "error"
                  ? "Submission status unavailable"
                  : disableSubmit
                    ? "View Submission"
                    : deadlineUnavailable
                      ? "Submission unavailable"
                      : isPastDue
                        ? "Submission closed"
                        : "Submit Your Work"
        }
        onClickPrimary={() => {
          onClose();
          setViewAssignment(false);
        }}
        customWidth={800}
        onClickSecondary={() =>
          isTeacherRole
            ? setViewingSubmissions(true)
            : submissionState !== "ready"
              ? undefined
              : disableSubmit
                ? setViewingSubmission(true)
                : deadlineUnavailable || isPastDue
                  ? undefined
                  : setViewAssignment(true)
        }
        disableSecondary={!isTeacherRole && (submissionState !== "ready" || (!disableSubmit && (deadlineUnavailable || isPastDue)))}
        buttonJustification="justify-content-end"
        showFooter
        footerClass="ln-comn-foot ln-assignment-drawer-footer"
      >
        <div className="ln-drawer-body ln-assignment-view-drawer-body">
          {viewAssignment ? (
            <SubmitAssignmentModal
              open={viewAssignment}
              onClose={() => setViewAssignment(false)}
              onSubmitted={handleSubmitted}
              assignment={assignmentRecord}
            />
          ) : viewingSubmission ? (
            <>
              <div className="ln-assign-section-head">
                <div>
                  <h4 className="ln-assign-section-title">Your submission</h4>
                  <p className="ln-assign-section-sub">This is what you submitted for this assignment.</p>
                </div>
                <Button icon={<ArrowLeftOutlined />} onClick={() => setViewingSubmission(false)}>
                  Back to assignment
                </Button>
              </div>
              <div className="ln-assign-resource-list">
                {submissionResources.length > 0 ? submissionResources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} fileUrl={resourceUrls?.[resource.id]} />
                )) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="We couldn't load your submission. Try closing and reopening this assignment." />
                )}
              </div>
            </>
          ) : (
            <>
              {(() => {
                const status = !isTeacherRole
                ? submissionState === "loading"
                  ? { tone: "open", label: "Checking submission status…" }
                  : submissionState === "error"
                    ? { tone: "open", label: "Submission status unavailable" }
                    : disableSubmit
                      ? { tone: "done", label: "Submitted" }
                      : deadlineUnavailable
                        ? { tone: "open", label: "Submission unavailable · deadline missing" }
                        : isPastDue
                          ? { tone: "late", label: "Closed · not submitted" }
                          : isDueSoon
                            ? { tone: "soon", label: "Due soon · not submitted" }
                            : { tone: "open", label: "Not submitted" }
                : null;
                return (
                  <div className="ln-assign-summary">
                    <div className="ln-assign-summary__item">
                      <span className="ln-assign-summary__label">Due</span>
                      <span className={`ln-assign-summary__value${isPastDue ? " is-late" : isDueSoon ? " is-soon" : ""}`}>
                        <CalendarOutlined aria-hidden="true" /> {dueLabel || "Deadline unavailable"}
                      </span>
                    </div>
                    {status ? (
                      <div className="ln-assign-summary__item">
                        <span className="ln-assign-summary__label">Status</span>
                        <span className={`ln-assign-status ln-assign-status--${status.tone}`}>{status.label}</span>
                      </div>
                    ) : null}
                    {allowedTypes.length > 0 ? (
                      <div className="ln-assign-summary__item ln-assign-summary__item--wide">
                        <span className="ln-assign-summary__label">Submit as</span>
                        <span className="ln-assign-summary__chips">
                          {allowedTypes.map((type) => (
                            <span key={type} className="ln-assign-chip">{getSubmissionTypeLabel(type)}</span>
                          ))}
                        </span>
                      </div>
                    ) : null}
                  </div>
                );
              })()}
              {isTeacherRole && (
                <div className="ln-assign-cta-row">
                  <button
                    type="button"
                    className="ln-assignment-view-submissions-cta"
                    onClick={() => setViewingSubmissions(true)}
                  >
                    <FileSearchOutlined aria-hidden />
                    <span>
                      <strong>View submissions</strong>
                      <small>See who submitted and grade their work.</small>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="ln-assignment-view-submissions-cta"
                    onClick={() => router.push({ pathname: "/teacher/report/assignment/[contentId]", query: { contentId: assignmentRecordId } })}
                  >
                    <BarChartOutlined aria-hidden />
                    <span>
                      <strong>View report</strong>
                      <small>Scores, on-time vs. late, and who hasn&apos;t submitted.</small>
                    </span>
                  </button>
                </div>
              )}
              {!isTeacherRole && submissionState === "error" && (
                <Alert
                  className="ln-assign-alert"
                  type="warning"
                  showIcon
                  message="We couldn't verify your submission status"
                  description="Submitting is disabled until we can confirm whether you already submitted this assignment."
                  action={
                    <Button size="small" onClick={() => setSubmissionRefresh((value) => value + 1)}>
                      Retry
                    </Button>
                  }
                />
              )}
              {!isTeacherRole && submissionState === "ready" && deadlineUnavailable && !disableSubmit && (
                <Alert
                  className="ln-assign-alert"
                  type="warning"
                  showIcon
                  message="Submission unavailable"
                  description="This assignment does not have a valid deadline. Submitting is disabled until faculty corrects it."
                />
              )}
              {!isTeacherRole && submissionState === "ready" && isPastDue && !disableSubmit && (
                <Alert
                  className="ln-assign-alert"
                  type="warning"
                  showIcon
                  message="Submissions are closed"
                  description="This assignment's deadline has passed, so new submissions are no longer accepted."
                />
              )}
              <div className="ln-assign-section-head">
                <div>
                  <h4 className="ln-assign-section-title">
                    Instructions &amp; resources
                    {resources.length > 0 ? <span className="ln-assign-count">{resources.length}</span> : null}
                  </h4>
                  <p className="ln-assign-section-sub">
                    {isTeacherRole
                      ? "Materials shared with students for this assignment."
                      : "Read these before you submit your work."}
                  </p>
                </div>
              </div>
              <div className="ln-assign-resource-list">
                {resources.length > 0 ? resources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} fileUrl={resourceUrls?.[resource.id]} />
                )) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Your faculty hasn't added any resources to this assignment yet." />
                )}
              </div>
            </>
          )}
        </div>
      </DrawerWidget>
      {isTeacherRole && (
        <ViewSubmissionsModal
          open={viewingSubmissions}
          onClose={() => setViewingSubmissions(false)}
          selectedViewAssignment={assignmentRecord}
        />
      )}
    </>
  );
}
