import { saveContentProgress, submitAssignment } from "@/api/Services/courseServices";
import { uploadFileViaPresign } from "@/utils/uploadToR2";
import UploadFromLinkButton from "@/components/Global/Upload/UploadFromLinkButton";
import DrawerWidget from "@/components/Global/RightDrawer/DrawerWidget";
import Editor from "@/components/Global/Editor/editor";
import { Alert, Button, Form, Input, Modal, Upload, message } from "antd";
import React, { useMemo, useRef, useState } from "react";
import {
  UploadOutlined, LinkOutlined, DeleteOutlined, PlusOutlined, EditOutlined, FilePdfOutlined,
  PaperClipOutlined, GithubOutlined, GlobalOutlined, CheckCircleFilled,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { deadlineMs } from "@/utils/dateUtils";
import {
  ASSIGNMENT_SUBMISSION_TYPES,
  getSubmissionTypeLabel,
  normalizeAllowedSubmissionTypes,
} from "@/utils/assignmentSchema";

const msgKey = "submit-assignment-msg";
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function emptyFileDTO() {
  return {
    size: 0,
    encoding: "",
    mimetype: "",
    field_name: "",
    original_name: "",
    cloud_storage_object: "",
  };
}

function createUploadEntry(type) {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    fileDTO: null,
    uploading: false,
  };
}

function createLinkEntry(type) {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    value: "",
  };
}

function SubmitAssignmentModal({ open, onClose, onSubmitted, assignment }) {
  const loginUser = useSelector((state) => state.loginUser);
  const [writtenResponse, setWrittenResponse] = useState("");
  const [pdfUploads, setPdfUploads] = useState([]);
  const [fileUploads, setFileUploads] = useState([]);
  const [repositoryLinks, setRepositoryLinks] = useState([]);
  const [externalLinks, setExternalLinks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const submittingRef = useRef(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const assignmentData = assignment?.contentDataDTO || assignment?.content_data_dto;
  const allowedSubmissionTypes = useMemo(
    () => normalizeAllowedSubmissionTypes(assignmentData),
    [assignmentData]
  );

  const allowWrittenResponse = allowedSubmissionTypes.includes(ASSIGNMENT_SUBMISSION_TYPES.WRITTEN_RESPONSE);
  const allowPdfUpload = allowedSubmissionTypes.includes(ASSIGNMENT_SUBMISSION_TYPES.PDF_UPLOAD);
  const allowFileUpload = allowedSubmissionTypes.includes(ASSIGNMENT_SUBMISSION_TYPES.FILE_UPLOAD);
  const allowRepositoryLink = allowedSubmissionTypes.includes(ASSIGNMENT_SUBMISSION_TYPES.REPOSITORY_LINK);
  const allowExternalLink = allowedSubmissionTypes.includes(ASSIGNMENT_SUBMISSION_TYPES.EXTERNAL_LINK);
  const assignmentLessonContentId = assignment?.id || assignment?.lessonContentId || assignment?.lesson_content_id;
  const assignmentDeadlineRaw = assignment?.deadline
    ?? assignmentData?.due_date
    ?? assignmentData?.dueDate
    ?? assignment?.due_date
    ?? assignment?.dueDate
    ?? null;
  const assignmentDeadlineMs = deadlineMs(assignmentDeadlineRaw);
  const deadlineUnavailable = !Number.isFinite(assignmentDeadlineMs);
  const submissionClosed = deadlineUnavailable || assignmentDeadlineMs < Date.now();

  React.useEffect(() => {
    setWrittenResponse("");
    setPdfUploads(allowPdfUpload ? [createUploadEntry(ASSIGNMENT_SUBMISSION_TYPES.PDF_UPLOAD)] : []);
    setFileUploads(allowFileUpload ? [createUploadEntry(ASSIGNMENT_SUBMISSION_TYPES.FILE_UPLOAD)] : []);
    setRepositoryLinks(allowRepositoryLink ? [createLinkEntry(ASSIGNMENT_SUBMISSION_TYPES.REPOSITORY_LINK)] : []);
    setExternalLinks(allowExternalLink ? [createLinkEntry(ASSIGNMENT_SUBMISSION_TYPES.EXTERNAL_LINK)] : []);
    setSubmitError(null);
    submittingRef.current = false;
    setIsSubmitting(false);
    form.resetFields();
  }, [
    allowExternalLink,
    allowFileUpload,
    allowPdfUpload,
    allowRepositoryLink,
    allowWrittenResponse,
    assignment?.id,
    form,
    open,
  ]);

  const isUploadingFile = useMemo(
    () =>
      [...pdfUploads, ...fileUploads].some((entry) => entry?.uploading),
    [fileUploads, pdfUploads]
  );

  const hasUnsavedWork = useMemo(
    () =>
      !!writtenResponse?.trim() ||
      [...pdfUploads, ...fileUploads].some((entry) => entry?.fileDTO?.cloud_storage_object || entry?.uploading) ||
      [...repositoryLinks, ...externalLinks].some((entry) => entry?.value?.trim()),
    [writtenResponse, pdfUploads, fileUploads, repositoryLinks, externalLinks]
  );

  const requestClose = () => {
    if (isSubmitting) {
      messageApi.open({
        key: msgKey,
        type: "info",
        content: "Your submission is being sent. Keep this window open until it finishes.",
        duration: 2,
      });
      return;
    }
    if (isUploadingFile) {
      messageApi.open({
        key: msgKey,
        type: "info",
        content: "Wait for the upload to finish before closing this submission.",
        duration: 2,
      });
      return;
    }
    if (hasUnsavedWork) {
      setConfirmDiscardOpen(true);
      return;
    }
    onClose();
  };

  return (
    <>
      <Modal
        open={confirmDiscardOpen}
        onOk={() => {
          setConfirmDiscardOpen(false);
          onClose();
        }}
        onCancel={() => setConfirmDiscardOpen(false)}
        okText="Discard"
        cancelText="Keep editing"
        okButtonProps={{ danger: true }}
        centered
      >
        <h2>Discard this submission?</h2>
        <p className="mb-0">
          You have unsaved work here (a written response, an upload, or a link). Closing now will discard it — it
          hasn&apos;t been submitted yet.
        </p>
      </Modal>
      <DrawerWidget
        className="ln-assignment-submit-drawer"
        title="Submit Your Work"
        drawerOpen={open}
        onClose={requestClose}
        primaryButtonTitle="Cancel"
        secondaryButtonTitle={deadlineUnavailable ? "Submission unavailable" : submissionClosed ? "Submission closed" : "Submit"}
        onClickPrimary={requestClose}
        customWidth={typeof window !== "undefined" && window.innerWidth < 768 ? "100%" : 720}
        onClickSecondary={handleSubmit}
        disablePrimary={isSubmitting || isUploadingFile}
        disableSecondary={isSubmitting || isUploadingFile || submissionClosed}
        secondaryLoading={isSubmitting}
        buttonJustification="justify-content-end"
        showFooter
        footerClass="ln-comn-foot ln-assignment-drawer-footer"
      >
        <div className="ln-drawer-body ln-assignment-submit-drawer-body">
          {contextHolder}
          <div className="ln-com-drw ln-assignment-submit-form">
            {submitError ? (
              <Alert
                type="error"
                showIcon
                message="Assignment was not submitted"
                description={submitError}
                action={<Button size="small" onClick={handleSubmit} disabled={isSubmitting || isUploadingFile}>Retry</Button>}
                style={{ marginBottom: 16 }}
              />
            ) : null}
            <div className="ln-assign-submit-intro">
              <span className="ln-assign-submit-intro__eyebrow">Submitting for</span>
              <h4 className="ln-assign-submit-intro__title">{assignment?.contentTitle || "This assignment"}</h4>
              <p className="ln-assign-submit-intro__sub">
                Add your work using {allowedSubmissionTypes.length > 1 ? "any of the methods below — you can combine them" : "the method below"}.
              </p>
            </div>

            <Form form={form} layout="vertical" autoComplete="off">
              {allowWrittenResponse && (
                <section className="ln-assign-method">
                  <div className="ln-assign-method__head">
                    <span className="ln-assign-method__icon" aria-hidden="true"><EditOutlined /></span>
                    <span className="ln-assign-method__title">Written response</span>
                  </div>
                  <div className="ln-editor-wraper ln-assign-method__editor">
                    <Editor editorContent={writtenResponse} setEditorContent={setWrittenResponse} />
                  </div>
                </section>
              )}

              {allowPdfUpload && renderUploadSection({
                title: "PDF Uploads",
                addLabel: "Add another PDF",
                uploads: pdfUploads,
                setUploads: setPdfUploads,
                accept: ".pdf,application/pdf",
                type: ASSIGNMENT_SUBMISSION_TYPES.PDF_UPLOAD,
              })}

              {allowFileUpload && renderUploadSection({
                title: "File Uploads",
                addLabel: "Add another file",
                uploads: fileUploads,
                setUploads: setFileUploads,
                type: ASSIGNMENT_SUBMISSION_TYPES.FILE_UPLOAD,
              })}

              {allowRepositoryLink && renderLinkSection({
                title: "Repository Links",
                addLabel: "Add another repository link",
                links: repositoryLinks,
                setLinks: setRepositoryLinks,
                type: ASSIGNMENT_SUBMISSION_TYPES.REPOSITORY_LINK,
                placeholder: "Paste the repository URL",
              })}

              {allowExternalLink && renderLinkSection({
                title: "Website / External Links",
                addLabel: "Add another link",
                links: externalLinks,
                setLinks: setExternalLinks,
                type: ASSIGNMENT_SUBMISSION_TYPES.EXTERNAL_LINK,
                placeholder: "Paste the link",
              })}
            </Form>
          </div>
        </div>
      </DrawerWidget>
    </>
  );

  function renderUploadSection({ title, addLabel, uploads, setUploads, accept, type }) {
    const isPdf = type === ASSIGNMENT_SUBMISSION_TYPES.PDF_UPLOAD;
    const SectionIcon = isPdf ? FilePdfOutlined : PaperClipOutlined;
    return (
      <section className="ln-assign-method">
        <div className="ln-assign-method__head">
          <span className="ln-assign-method__icon" aria-hidden="true"><SectionIcon /></span>
          <span className="ln-assign-method__title">{title}</span>
          <Button type="link" size="small" icon={<PlusOutlined />} className="ln-assign-method__add"
            onClick={() => setUploads((prev) => [...prev, createUploadEntry(type)])}>
            {addLabel}
          </Button>
        </div>
        {uploads.map((entry, index) => (
          <div key={entry.id} className="ln-assign-method__entry">
            {uploads.length > 1 && (
              <div className="ln-assign-method__entry-head">
                <span>{`${getSubmissionTypeLabel(type)} ${index + 1}`}</span>
                <Button type="text" size="small" danger icon={<DeleteOutlined />}
                  onClick={() => setUploads((prev) => prev.filter((item) => item.id !== entry.id))}>
                  Remove
                </Button>
              </div>
            )}
            {entry.fileDTO?.cloud_storage_object ? (
              <div className="ln-assign-file-chip">
                <CheckCircleFilled className="ln-assign-file-chip__ok" aria-hidden="true" />
                <span className="ln-assign-file-chip__name">{entry.fileDTO.original_name || "Uploaded file"}</span>
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label="Remove this file"
                  onClick={() =>
                    setUploads((prev) =>
                      prev.map((item) => (item.id === entry.id ? { ...item, fileDTO: null, uploading: false } : item))
                    )
                  }
                />
              </div>
            ) : (
              <div className="ln-upload ln-assign-upload">
                <Upload
                  maxCount={1}
                  showUploadList={false}
                  accept={accept}
                  beforeUpload={(file) => {
                    onSelectedFile({ file, entryId: entry.id, type, setUploads });
                    return false;
                  }}
                >
                  <Button className="w-100 ant-custom-upload ln-assign-dropzone" icon={<UploadOutlined />} loading={entry.uploading}>
                    {entry.uploading ? "Uploading…" : isPdf ? "Choose a PDF to upload" : "Choose a file to upload"}
                    <span className="ln-assign-dropzone__hint">{isPdf ? "PDF" : "Any file"} · up to {MAX_FILE_SIZE_MB} MB</span>
                  </Button>
                </Upload>
                <UploadFromLinkButton
                  folder="assignments"
                  type="assignment"
                  lessonContentId={assignmentLessonContentId}
                  onImported={(result) => {
                    setUploads((prev) =>
                      prev.map((item) =>
                        item.id === entry.id
                          ? {
                              ...item,
                              uploading: false,
                              fileDTO: {
                                size: result?.size || 0,
                                encoding: "",
                                mimetype: type === ASSIGNMENT_SUBMISSION_TYPES.PDF_UPLOAD ? "application/pdf" : "",
                                field_name: "",
                                original_name: result?.originalName || "",
                                cloud_storage_object: result?.key || result?.publicUrl || "",
                              },
                              uploadReceiptId: result?.uploadReceiptId,
                            }
                          : item
                      )
                    );
                  }}
                  buttonProps={{ className: "w-100 ln-assign-drive-btn" }}
                >
                  {isPdf ? "Or import a PDF from Google Drive" : "Or import a file from Google Drive"}
                </UploadFromLinkButton>
              </div>
            )}
          </div>
        ))}
      </section>
    );
  }

  function renderLinkSection({ title, addLabel, links, setLinks, type, placeholder }) {
    const SectionIcon = type === ASSIGNMENT_SUBMISSION_TYPES.REPOSITORY_LINK ? GithubOutlined : GlobalOutlined;
    return (
      <section className="ln-assign-method">
        <div className="ln-assign-method__head">
          <span className="ln-assign-method__icon" aria-hidden="true"><SectionIcon /></span>
          <span className="ln-assign-method__title">{title}</span>
          <Button type="link" size="small" icon={<PlusOutlined />} className="ln-assign-method__add"
            onClick={() => setLinks((prev) => [...prev, createLinkEntry(type)])}>
            {addLabel}
          </Button>
        </div>
        {links.map((entry, index) => (
          <div key={entry.id} className="ln-assign-method__link-row">
            <Input
              className="ln-in2"
              size="large"
              prefix={<LinkOutlined />}
              placeholder={links.length > 1 ? `${placeholder} (${index + 1})` : placeholder}
              aria-label={`${getSubmissionTypeLabel(type)} ${index + 1}`}
              value={entry.value}
              onChange={(event) =>
                setLinks((prev) =>
                  prev.map((item) => (item.id === entry.id ? { ...item, value: event.target.value } : item))
                )
              }
            />
            {links.length > 1 && (
              <Button type="text" danger icon={<DeleteOutlined />} aria-label="Remove this link"
                onClick={() => setLinks((prev) => prev.filter((item) => item.id !== entry.id))} />
            )}
          </div>
        ))}
      </section>
    );
  }

  function buildSubmissionAssets() {
    const assets = [];
    if (writtenResponse?.trim()) {
      assets.push({
        id: `written-${Date.now()}`,
        type: ASSIGNMENT_SUBMISSION_TYPES.WRITTEN_RESPONSE,
        title: "Written Response",
        link: "",
        file_dto: emptyFileDTO(),
      });
    }
    pdfUploads.forEach((entry) => {
      if (entry?.fileDTO?.cloud_storage_object) {
        assets.push({
          id: entry.id,
          type: ASSIGNMENT_SUBMISSION_TYPES.PDF_UPLOAD,
          title: entry.fileDTO.original_name || "PDF Upload",
          link: "",
          upload_receipt_id: entry.uploadReceiptId || "",
          file_dto: entry.fileDTO,
        });
      }
    });
    fileUploads.forEach((entry) => {
      if (entry?.fileDTO?.cloud_storage_object) {
        assets.push({
          id: entry.id,
          type: ASSIGNMENT_SUBMISSION_TYPES.FILE_UPLOAD,
          title: entry.fileDTO.original_name || "File Upload",
          link: "",
          upload_receipt_id: entry.uploadReceiptId || "",
          file_dto: entry.fileDTO,
        });
      }
    });
    repositoryLinks.forEach((entry) => {
      if (entry?.value?.trim()) {
        assets.push({
          id: entry.id,
          type: ASSIGNMENT_SUBMISSION_TYPES.REPOSITORY_LINK,
          title: "Repository Link",
          link: entry.value.trim(),
          file_dto: emptyFileDTO(),
        });
      }
    });
    externalLinks.forEach((entry) => {
      if (entry?.value?.trim()) {
        assets.push({
          id: entry.id,
          type: ASSIGNMENT_SUBMISSION_TYPES.EXTERNAL_LINK,
          title: "External Link",
          link: entry.value.trim(),
          file_dto: emptyFileDTO(),
        });
      }
    });
    return assets;
  }

  function buildPayload() {
    const submissionAssets = buildSubmissionAssets();
    const firstFileAsset = submissionAssets.find((asset) =>
      [ASSIGNMENT_SUBMISSION_TYPES.PDF_UPLOAD, ASSIGNMENT_SUBMISSION_TYPES.FILE_UPLOAD].includes(asset.type)
    );
    const firstLinkAsset = submissionAssets.find((asset) =>
      [ASSIGNMENT_SUBMISSION_TYPES.REPOSITORY_LINK, ASSIGNMENT_SUBMISSION_TYPES.EXTERNAL_LINK].includes(asset.type)
    );
    const firstType = submissionAssets[0]?.type || (writtenResponse?.trim() ? ASSIGNMENT_SUBMISSION_TYPES.WRITTEN_RESPONSE : "");
    return {
      lesson_content_id: assignmentLessonContentId,
      html_content: writtenResponse?.trim() ? writtenResponse : "",
      file_dto: firstFileAsset?.file_dto || emptyFileDTO(),
      upload_receipt_id: firstFileAsset?.upload_receipt_id || "",
      submission_type: submissionAssets.length > 1 ? "MULTI_PART" : firstType,
      submission_link: firstLinkAsset?.link || "",
      submission_assets: submissionAssets,
      student_id: parseInt(loginUser?.id),
    };
  }

  function handleSubmit() {
    if (submittingRef.current) return;
    // Re-check deadline validity and the live clock at click time. Missing/corrupt deadline data
    // fails closed, matching the server instead of silently becoming an unlimited assignment.
    if (deadlineUnavailable) {
      messageApi.open({
        key: msgKey,
        type: "error",
        content: "This assignment does not have a valid deadline. Submission is unavailable.",
        duration: 3,
      });
      return;
    }
    if (assignmentDeadlineMs < Date.now()) {
      messageApi.open({
        key: msgKey,
        type: "error",
        content: "This assignment's deadline has passed. Submissions are closed.",
        duration: 3,
      });
      return;
    }
    if (isUploadingFile) {
      messageApi.open({ key: msgKey, type: "warning", content: "Wait for the upload to finish.", duration: 2 });
      return;
    }
    const submissionAssets = buildSubmissionAssets();
    const hasWrittenResponse = writtenResponse?.trim();
    if (!hasWrittenResponse && submissionAssets.length === 0) {
      messageApi.open({ key: msgKey, type: "error", content: "Add at least one submission before submitting.", duration: 2 });
      return;
    }

    submittingRef.current = true;
    setSubmitError(null);
    setIsSubmitting(true);
    const payload = buildPayload();
    submitAssignment(payload)
      .then((response) => {
        messageApi.open({ key: msgKey, type: "success", content: "Assignment submitted successfully.", duration: 2 });
        if (assignment?.id != null) {
          saveContentProgress({ lessonContentId: assignment.id, completed: true }).catch(() => {});
        }
        onSubmitted?.(response?.data?.data ?? response?.data ?? { lessonContentId: assignmentLessonContentId });
        form.resetFields();
        onClose();
      })
      .catch((error) => {
        const backendMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to submit assignment.";
        // Shown inline with a Retry (below the intro), not also as a toast.
        setSubmitError(backendMessage);
      })
      .finally(() => {
        submittingRef.current = false;
        setIsSubmitting(false);
      });
  }

  function onSelectedFile({ file, entryId, type, setUploads }) {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      messageApi.error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
      return;
    }
    if (type === ASSIGNMENT_SUBMISSION_TYPES.PDF_UPLOAD && file.type !== "application/pdf") {
      messageApi.error("Only PDF files are allowed.");
      return;
    }
    setUploads((prev) => prev.map((item) => (item.id === entryId ? { ...item, uploading: true } : item)));
    uploadFileViaPresign(file, {
      folder: "assignments",
      type: "assignment",
      lessonContentId: assignmentLessonContentId,
    })
      .then((result) => {
        setUploads((prev) =>
          prev.map((item) =>
            item.id === entryId
              ? {
                  ...item,
                  uploading: false,
                  fileDTO: {
                    size: result?.size || file?.size || 0,
                    encoding: "",
                    mimetype: file?.type || "",
                    field_name: "",
                    original_name: result?.originalName || file?.name || "",
                    cloud_storage_object: result?.key || result?.publicUrl || "",
                  },
                  uploadReceiptId: result?.uploadReceiptId,
                }
              : item
          )
        );
      })
      .catch(() => {
        messageApi.open({
          key: msgKey,
          type: "error",
          content: "Upload failed. Try again.",
          duration: 2,
        });
        setUploads((prev) => prev.map((item) => (item.id === entryId ? { ...item, uploading: false, fileDTO: null } : item)));
      });
  }
}

export default SubmitAssignmentModal;
