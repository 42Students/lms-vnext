import React, { useState } from "react";
import { Alert, Button, Drawer, Empty, Popconfirm, message } from "antd";
import {
  DeleteOutlined, DownloadOutlined, EditOutlined, LinkOutlined, PaperClipOutlined,
  FilePdfOutlined, FileImageOutlined, FileExcelOutlined, FileWordOutlined,
  FilePptOutlined, FileZipOutlined, FileOutlined,
} from "@ant-design/icons";
import { Interweave } from "interweave";
import { useSelector } from "react-redux";
import Api from "@/api/ApiMethod";
import deleteLessonContent from "@/utils/courseUtils/syllabusUtils";
import ContentTitle, { ContentAddedDate } from "@/components/Course/Syllabus/ContentTitle";
import MarkCompleteButton from "@/components/Course/Syllabus/MarkCompleteButton";
import ResourceComposer from "@/components/Global/Offcanvas/Syallabus/ResourceComposer";

function safeHttpsUrl(value) {
  if (typeof value !== "string" || value.length > 2048 || /[\x00-\x20\x7f]/.test(value)) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

// #7: the materials list was bare bootstrap-utility rows (a title, a plain "Open" button, no
// visual cue for what kind of file you're about to open) -- every other content-type icon in this
// app (assignment resources, quiz question types) gets a real per-type icon; this was the one
// list still relying on a generic bullet-less line.
const EXTENSION_ICONS = {
  pdf: FilePdfOutlined,
  png: FileImageOutlined, jpg: FileImageOutlined, jpeg: FileImageOutlined, gif: FileImageOutlined, webp: FileImageOutlined,
  xls: FileExcelOutlined, xlsx: FileExcelOutlined, csv: FileExcelOutlined,
  doc: FileWordOutlined, docx: FileWordOutlined,
  ppt: FilePptOutlined, pptx: FilePptOutlined,
  zip: FileZipOutlined, rar: FileZipOutlined,
};

function materialIcon(kind, title) {
  if (kind === "LINK") return LinkOutlined;
  const ext = String(title || "").toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return EXTENSION_ICONS[ext] || FileOutlined;
}

function materialCaption(kind, material) {
  if (kind === "LINK") return "Link";
  const size = material?.file_dto?.size ?? material?.fileDTO?.size;
  if (!Number.isFinite(Number(size)) || Number(size) <= 0) return "File";
  const kb = Number(size) / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

/** A Resource contains many FILE/LINK materials; never expose raw R2 keys as external links. */
const Resource = ({ content, refreshAllContent, progress, onProgressUpdate, progressUnavailable = false, inModal = false }) => {
  const loginUser = useSelector(state => state.loginUser);
  const [opening, setOpening] = useState({});
  const [resolveError, setResolveError] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const data = content?.contentDataDTO ?? content?.content_data_dto ?? {};
  const materials = Array.isArray(data?.resource_materials)
    ? data.resource_materials : Array.isArray(data?.resourceMaterials) ? data.resourceMaterials : [];
  const contentId = content?.id ?? content?.lessonContentId ?? content?.lesson_content_id;
  const isFaculty = loginUser?.userType === "FACULTY";
  const isLearner = loginUser?.userType === "LEARNER";

  const openFile = async index => {
    if (opening[index]) return;
    // Opening the blank tab synchronously on the click avoids popup blockers while
    // ensuring a fresh 15-minute signed URL is requested at the moment of access.
    const popup = window.open("about:blank", "_blank");
    if (popup) popup.opener = null;
    setOpening(previous => ({ ...previous, [index]: true }));
    setResolveError(false);
    try {
      if (!Number.isSafeInteger(Number(contentId)) || Number(contentId) <= 0) {
        throw new Error("Resource is not available");
      }
      const response = await Api.get(`/api/v1/resource-files/${encodeURIComponent(contentId)}/materials/${index}/url`);
      const url = safeHttpsUrl(response?.data?.data?.url);
      if (!url) throw new Error("Resource file is unavailable");
      if (popup && !popup.closed) popup.location.replace(url);
      else window.location.assign(url);
    } catch {
      if (popup && !popup.closed) popup.close();
      setResolveError(true);
      messageApi.error("Resource file is unavailable. Contact your instructor.");
    } finally {
      setOpening(previous => ({ ...previous, [index]: false }));
    }
  };

  const onDelete = async () => {
    if (removing) return;
    setRemoving(true);
    try {
      await deleteLessonContent("RESOURCE", content, loginUser?.id);
      messageApi.success("Resource removed");
      refreshAllContent?.();
    } catch (error) {
      messageApi.error(error?.response?.data?.message || "Could not remove Resource");
    } finally {
      setRemoving(false);
    }
  };

  const notesHtml = data?.html_content ?? data?.htmlContent;
  const hasNotes = Boolean(data?.text || notesHtml);

  return (
    <article className={`lesson-content-detail ln-resource-viewer${inModal ? " ln-resource-viewer--modal" : ""}`} aria-label="Resource">
      {contextHolder}
      <header className="ln-resource-viewer__head">
        {inModal ? (
          // The modal header already shows the title -- repeating it here was the first thing
          // the eye hit. Keep only the type, scope and date context.
          <div className="ln-resource-viewer__meta">
            <span className="ln-resource-viewer__type"><PaperClipOutlined aria-hidden="true" /> Resource</span>
            {isLearner ? (
              <span className="ln-resource-viewer__scope">
                {content?.classId > 0 ? "For your class" : "Shared with your class"}
              </span>
            ) : null}
            <ContentAddedDate content={content} />
          </div>
        ) : (
          <ContentTitle content={content} contentType="Resource" />
        )}
        {isFaculty && (
          <div className="ln-resource-viewer__actions">
            <Button type="text" icon={<EditOutlined />} aria-label="Edit Resource" onClick={() => setEditOpen(true)} />
            <Popconfirm title="Remove this Resource?" description="The lesson entry will be hidden; stored files are retained."
              onConfirm={onDelete} okText="Remove" cancelText="Cancel">
              <Button danger type="text" loading={removing} icon={<DeleteOutlined />} aria-label="Remove Resource" />
            </Popconfirm>
          </div>
        )}
      </header>
      {hasNotes ? (
        <section className="ln-resource-viewer__notes" aria-label="About this resource">
          {data?.text ? <p className="ln-resource-viewer__text">{data.text}</p> : null}
          {notesHtml ? <div className="resource-notes"><Interweave content={notesHtml} /></div> : null}
        </section>
      ) : null}
      {resolveError && <Alert type="warning" showIcon message="Some Resource files are unavailable. Contact your instructor." />}
      {materials.length ? (
        <section className="ln-resource-viewer__materials" aria-label="Materials">
          <h4 className="ln-resource-viewer__section-title">
            Materials <span className="ln-resource-viewer__count">{materials.length}</span>
          </h4>
          <ul className="ln-resource-materials">
            {materials.map((material, index) => {
              const kind = String(material?.kind || "").toUpperCase();
              const title = material?.title || material?.file_dto?.original_name || material?.fileDTO?.originalName || `Material ${index + 1}`;
              const link = kind === "LINK" ? safeHttpsUrl(material?.url) : null;
              const isFile = kind === "FILE";
              const hasFile = Boolean(material?.file_dto?.cloud_storage_object ?? material?.fileDTO?.cloudStorageObject);
              const MaterialIcon = materialIcon(kind, title);
              const caption = materialCaption(kind, material);
              return (
                <li key={`${kind}-${index}`} className="ln-resource-materials__row">
                  <span className={`ln-resource-materials__icon ln-resource-materials__icon--${kind === "LINK" ? "link" : "file"}`} aria-hidden="true">
                    <MaterialIcon />
                  </span>
                  <span className="ln-resource-materials__info">
                    <span className="ln-resource-materials__title">{title}</span>
                    <small className="ln-resource-materials__caption">{caption}</small>
                  </span>
                  {isFile && hasFile ? (
                    <Button type="primary" ghost icon={<DownloadOutlined />} loading={Boolean(opening[index])}
                      aria-label={`Open file: ${title}`} onClick={() => openFile(index)}>Open</Button>
                  ) : link ? (
                    <Button type="primary" ghost icon={<LinkOutlined />} href={link} target="_blank" rel="noopener noreferrer"
                      aria-label={`Open link: ${title}`}>Open</Button>
                  ) : <span className="ln-resource-materials__unavailable">Unavailable</span>}
                </li>
              );
            })}
          </ul>
        </section>
      ) : !hasNotes ? <Empty description="No Resource materials" /> : null}
      {isFaculty && (
        <Drawer open={editOpen} title="Edit Resource" width={600} destroyOnClose maskClosable={false}
          onClose={() => setEditOpen(false)}>
          <ResourceComposer editing={content}
            back={saved => { setEditOpen(false); if (saved) refreshAllContent?.(); }} />
        </Drawer>
      )}
      {isLearner && (
        <footer className="ln-resource-viewer__footer">
          <span className="ln-resource-viewer__footer-hint">Finished with these materials?</span>
          <MarkCompleteButton lessonContentId={contentId} progress={progress} onProgressUpdate={onProgressUpdate} disabled={progressUnavailable} disabledReason="Completion status could not be verified. Retry lesson state before marking this item complete." />
        </footer>
      )}
    </article>
  );
};

export default Resource;
