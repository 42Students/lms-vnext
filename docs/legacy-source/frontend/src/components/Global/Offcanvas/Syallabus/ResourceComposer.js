import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, Input, Select, message } from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { getContentTypeFromFile, uploadResourceFile } from "@/utils/resourceUploadToR2";
import { createLessonContent } from "@/api/Services/courseServices";
import { updateLessonContent } from "@/api/Services/AdminService";

const FORMATS = ["pdf", "doc", "docx", "txt", "ppt", "pptx", "xls", "xlsx", "csv", "png", "jpg", "jpeg", "webp"];
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_MATERIALS = 20;

export function isValidResourceLink(value) {
  if (!value || value.length > 2048 || /[\x00-\x20\x7f]/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function isAllowedResourceFile(file) {
  const name = String(file?.name || "").toLowerCase();
  const extension = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : "";
  return FORMATS.includes(extension) && Number.isFinite(file?.size)
    && file.size > 0 && file.size <= MAX_FILE_SIZE;
}

function existingMaterials(data) {
  const source = data?.resource_materials ?? data?.resourceMaterials;
  if (!Array.isArray(source)) return [];
  return source.map(item => {
    if (String(item?.kind || "").toUpperCase() === "LINK") {
      return { kind: "LINK", title: item?.title || item?.url || "Link", url: item?.url || "" };
    }
    const file = item?.file_dto ?? item?.fileDTO ?? {};
    return {
      kind: "FILE",
      title: item?.title || file?.original_name || file?.originalName || "File",
      file_dto: {
        cloud_storage_object: file?.cloud_storage_object ?? file?.cloudStorageObject,
        original_name: file?.original_name ?? file?.originalName,
        mimetype: file?.mimetype,
        size: file?.size,
        encoding: "", field_name: "",
      },
    };
  });
}

/** Creates a Resource, or edits `editing` (an existing Resource row) when one is passed. */
const ResourceComposer = ({ back, editing = null, onDirtyChange }) => {
  const loginUser = useSelector(state => state.loginUser);
  const course = useSelector(state => state.course);
  const fileInput = useRef(null);
  const uploadingRef = useRef(false);
  const savingRef = useRef(false);
  const editData = editing?.contentDataDTO ?? editing?.content_data_dto ?? {};
  const existingHtml = editData?.html_content ?? editData?.htmlContent ?? "";
  const [title, setTitle] = useState(editing?.contentTitle ?? editing?.content_title ?? "");
  const [notes, setNotes] = useState(editData?.text ?? "");
  const [scope, setScope] = useState("CLASS");
  const [materials, setMaterials] = useState(() => existingMaterials(editData));
  const [link, setLink] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const lessonId = Number(editing ? (editing?.lessonId ?? editing?.lesson_id) : loginUser?.LessonId);
  const classId = Number(editing ? (editing?.classId ?? editing?.class_id ?? 0) : loginUser?.classId);
  const selectedCourseId = Number(editing
    ? (editing?.courseId ?? editing?.course_id)
    : (course?.selectedCourseId ?? course?.selectedCourse?.id ?? course?.selectedCourse?.courseId));
  const isAdmin = String(loginUser?.facultyType || "").toUpperCase() === "ADMIN"
    || String(loginUser?.userType || "").toUpperCase() === "ADMIN";
  const hasCourse = Number.isInteger(selectedCourseId) && selectedCourseId > 0;
  const hasClass = Number.isInteger(classId) && classId > 0;
  const isShared = editing ? !hasClass : isAdmin && scope === "SHARED";
  const containsFiles = materials.some(material => material.kind === "FILE");

  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);

  const markDirty = () => setDirty(true);

  const addFiles = async (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (uploadingRef.current || savingRef.current || !selected.length) return;
    if (!hasCourse && (!hasClass || isShared)) {
      setError("Select a course or class before uploading a Resource.");
      return;
    }
    if (!selected.every(isAllowedResourceFile)) {
      setError("Supported files: PDF, Word, text, PowerPoint, Excel, CSV and images, up to 50 MB each.");
      return;
    }
    if (materials.length + selected.length > MAX_MATERIALS) {
      setError(`A Resource can contain at most ${MAX_MATERIALS} materials.`);
      return;
    }
    markDirty();
    uploadingRef.current = true;
    setUploading(true);
    setError("");
    try {
      for (const file of selected) {
        const uploaded = await uploadResourceFile(file, {
          folder: "lesson-content",
          ...(hasCourse ? { courseId: selectedCourseId } : {}),
          ...(!isShared && hasClass ? { classId } : {}),
        });
        if (!uploaded?.key) throw new Error("Upload completed without a storage key");
        setMaterials(previous => [...previous, {
          kind: "FILE", title: file.name,
          file_dto: {
            cloud_storage_object: uploaded.key,
            original_name: uploaded.originalName || file.name,
            mimetype: uploaded.mimetype || getContentTypeFromFile(file),
            size: uploaded.size || file.size,
            encoding: "", field_name: "",
          },
        }]);
      }
      messageApi.success("Resource files uploaded");
    } catch (uploadError) {
      setError(uploadError?.response?.data?.message || uploadError?.message || "Resource upload failed");
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  };

  const addLink = () => {
    const url = link.trim();
    if (!isValidResourceLink(url)) {
      setError("Enter a valid HTTPS URL without credentials or spaces.");
      return;
    }
    if (materials.length >= MAX_MATERIALS) {
      setError(`A Resource can contain at most ${MAX_MATERIALS} materials.`);
      return;
    }
    if (materials.some(material => material.kind === "LINK" && material.url === url)) {
      setError("This link has already been added.");
      return;
    }
    markDirty();
    setMaterials(previous => [...previous, { kind: "LINK", title: linkTitle.trim().slice(0, 255) || url.slice(0, 255), url }]);
    setLink(""); setLinkTitle(""); setError("");
  };

  const save = async () => {
    if (uploadingRef.current || savingRef.current) return;
    if (!title.trim() || title.trim().length > 255) {
      setError("Enter a Resource title (up to 255 characters)."); return;
    }
    if (!Number.isInteger(lessonId) || lessonId <= 0) {
      setError("Select a lesson before adding a Resource."); return;
    }
    if (!editing && !isAdmin && !hasClass) {
      setError("A class assignment is required to add Resources."); return;
    }
    if (!materials.length && !notes.trim() && !existingHtml.trim()) {
      setError("Add a file, HTTPS link, or notes before saving."); return;
    }
    savingRef.current = true;
    setSaving(true); setError("");
    try {
      if (editing) {
        await updateLessonContent(editing?.id ?? editing?.lessonContentId ?? editing?.lesson_content_id, {
          lesson_id: lessonId,
          course_id: selectedCourseId,
          class_id: hasClass ? classId : 0,
          faculty_id: editing?.facultyId ?? editing?.faculty_id,
          content_type: "RESOURCE",
          content_title: title.trim(),
          sequence: editing?.sequence ?? 1,
          active: editing?.active !== false,
          enabled: editing?.enabled !== false,
          points: editing?.points ?? 0,
          content_data_dto: {
            resource_materials: materials, text: notes.trim(), html_content: existingHtml,
            allow_discussions: editData?.allow_discussions ?? false,
            view_after_schedule: editData?.view_after_schedule ?? true,
            view_before_schedule: editData?.view_before_schedule ?? true,
          },
        });
        // Static call for the same reason as "Resource saved" below: back() unmounts this component.
        message.success("Resource updated");
        setDirty(false);
        back?.(true);
        return;
      }
      await createLessonContent({
        lesson_id: lessonId,
        ...(hasCourse ? { course_id: selectedCourseId } : {}),
        class_id: isShared ? 0 : (hasClass ? classId : 0),
        sequence: 0, content_type: "RESOURCE", content_title: title.trim(),
        content_data_dto: {
          resource_materials: materials, text: notes.trim(), html_content: "",
          allow_discussions: false, view_after_schedule: true, view_before_schedule: true,
        },
        active: true, enabled: true, points: 0,
      });
      // Static call, not the messageApi/contextHolder pair below: `back?.(true)` unmounts this
      // component synchronously in the same batch, which would tear down a locally-hook-bound
      // message's portal before it ever paints. The static API's container is independent of any
      // component's lifecycle, so it survives.
      message.success("Resource saved");
      setDirty(false);
      back?.(true);
    } catch (saveError) {
      setError(saveError?.response?.data?.message || saveError?.message || "Could not save Resource");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-3" aria-label="Resource composer">
      {contextHolder}
      {error && <Alert type="error" message={error} showIcon />}
      <label htmlFor="canonical-resource-title">Resource title</label>
      <Input id="canonical-resource-title" value={title} maxLength={255} onChange={event => { setTitle(event.target.value); markDirty(); }} placeholder="e.g. Week 2 reading pack" />
      {/* Only administrators choose visibility; faculty always add to their own class and see no control for it. */}
      {!editing && isAdmin && (
        <>
          <label htmlFor="canonical-resource-scope">Visibility</label>
          <Select id="canonical-resource-scope" value={scope} disabled={!isAdmin || uploading || saving || containsFiles} onChange={(value) => { setScope(value); markDirty(); }} options={[
            { label: "This class only", value: "CLASS" },
            ...(isAdmin ? [{ label: "Shared across sections", value: "SHARED" }] : []),
          ]} />
          {containsFiles && <small className="text-muted">Remove uploaded files before changing visibility.</small>}
        </>
      )}
      <label htmlFor="canonical-resource-notes">Notes (optional)</label>
      <Input.TextArea id="canonical-resource-notes" rows={3} value={notes} onChange={event => { setNotes(event.target.value); markDirty(); }} placeholder="Context for learners" />
      {existingHtml.trim() && <small className="text-muted">This Resource also has formatted text, which is kept when you save.</small>}
      <strong>Files</strong>
      <input ref={fileInput} type="file" multiple accept={FORMATS.map(ext => `.${ext}`).join(",")}
        aria-label="Upload Resource files" disabled={uploading || saving || materials.length >= MAX_MATERIALS}
        onChange={addFiles} style={{ display: "none" }} />
      <Button icon={<UploadOutlined />} disabled={uploading || saving || materials.length >= MAX_MATERIALS}
        loading={uploading} onClick={() => fileInput.current?.click()}>Add files</Button>
      <strong>External links</strong>
      <Input placeholder="Link title (optional)" aria-label="Resource link title" value={linkTitle} onChange={event => { setLinkTitle(event.target.value); markDirty(); }} />
      <Input placeholder="https://example.org/reading" aria-label="Resource link URL" value={link} onChange={event => { setLink(event.target.value); markDirty(); }} />
      <Button disabled={uploading || saving || materials.length >= MAX_MATERIALS} onClick={addLink}>Add link</Button>
      {materials.length > 0 && (
        <ul className="list-unstyled" aria-label="Resource materials">
          {materials.map((material, index) => (
            <li key={`${material.kind}-${index}`} className="d-flex justify-content-between align-items-center gap-2 mb-2">
              <span style={{ overflowWrap: "anywhere" }}>{material.kind === "FILE" ? "File" : "Link"}: {material.title}</span>
              <Button type="text" danger icon={<DeleteOutlined />} aria-label={`Remove ${material.title}`}
                disabled={uploading || saving} onClick={() => { markDirty(); setMaterials(previous => previous.filter((_, position) => position !== index)); }} />
            </li>
          ))}
        </ul>
      )}
      <div className="d-flex justify-content-end gap-2">
        <Button disabled={saving || uploading} onClick={() => back?.(false)}>Cancel</Button>
        <Button type="primary" loading={saving} disabled={uploading || saving} onClick={save}>{editing ? "Save changes" : "Save Resource"}</Button>
      </div>
    </div>
  );
};

export default ResourceComposer;
