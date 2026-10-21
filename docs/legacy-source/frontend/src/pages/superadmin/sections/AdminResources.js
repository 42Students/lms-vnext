import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Alert, Button, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import {
  createLessonContent,
  deleteLessonContent,
  getCoursesByCollege,
  getLessonContents,
  getLessonsByCourse,
  updateLessonContent,
} from "@/api/Services/AdminService";
import { getLessonContent } from "@/api/Services/courseServices";
import { getClassesForCourseSyllabus } from "@/api/Services/adminServices/departmentService";
import { getContentTypeFromFile, uploadResourceFile } from "@/utils/resourceUploadToR2";
import { isAllowedResourceFile, isValidResourceLink } from "@/components/Global/Offcanvas/Syallabus/ResourceComposer";
import { RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";

const MAX_MATERIALS = 20;
const FORMATS = ["pdf", "doc", "docx", "txt", "ppt", "pptx", "xls", "xlsx", "csv", "png", "jpg", "jpeg", "webp"];
const unwrap = response => response?.data?.data ?? response?.data ?? [];
const resourceType = row => String(row?.contentType ?? row?.content_type ?? "").toUpperCase().trim();
const resourceData = row => row?.contentDataDTO ?? row?.content_data_dto ?? {};
const contentId = row => row?.id ?? row?.lessonContentId ?? row?.lesson_content_id;
const classIdOf = row => Number(row?.classId ?? row?.class_id ?? 0);

function normaliseMaterials(data) {
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
      },
    };
  });
}

/** Admin-only Resources authoring: mixed FILE / LINK materials plus notes. */
export default function AdminResources({ collegeId }) {
  const [api, contextHolder] = message.useMessage();
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [courseId, setCourseId] = useState(null);
  const [lessonId, setLessonId] = useState(null);
  const [classId, setClassId] = useState(0);
  const [classNames, setClassNames] = useState({});
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadedScopeKey, setLoadedScopeKey] = useState(null);
  // Read through a ref inside the fetch callback: as a dependency it rebuilt the callback after every load and
  // re-ran the effects that call it (a duplicate request, plus their resets).
  const loadedScopeKeyRef = useRef(loadedScopeKey);
  loadedScopeKeyRef.current = loadedScopeKey;
  const [loadError, setLoadError] = useState(null);
  const [errorScopeKey, setErrorScopeKey] = useState(null);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState(null);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonsError, setLessonsError] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [html, setHtml] = useState("");
  const [materials, setMaterials] = useState([]);
  const [link, setLink] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(true);
  const resourceScopeKey = collegeId && courseId && lessonId
    ? JSON.stringify([Number(collegeId), Number(courseId), Number(lessonId), Number(classId || 0)])
    : null;
  const hasCurrentRows = resourceScopeKey != null && loadedScopeKey === resourceScopeKey;
  const currentLoadError = errorScopeKey === resourceScopeKey ? loadError : null;
  const initialLoading = Boolean(resourceScopeKey && loading && !hasCurrentRows && !currentLoadError);
  const refreshing = Boolean(resourceScopeKey && loading && hasCurrentRows);

  useEffect(() => {
    let cancelled = false;
    setCourseId(null); setLessonId(null); setClassId(0); setLessons([]); setRows([]);
    setLoadedScopeKey(null); setLoadError(null); setErrorScopeKey(null);
    setCoursesError(null); setLessonsError(null);
    if (!collegeId) { setCourses([]); setCoursesLoading(false); return undefined; }
    setCoursesLoading(true);
    getCoursesByCollege(collegeId).then(res => {
      if (cancelled) return;
      const list = unwrap(res);
      if (!Array.isArray(list)) throw new Error("Unexpected courses response.");
      setCourses(list);
      setCoursesError(null);
    }).catch(() => {
      if (!cancelled) {
        setCourses([]);
        setCoursesError("Courses could not be loaded. Retry before selecting a lesson.");
      }
    }).finally(() => { if (!cancelled) setCoursesLoading(false); });
    return () => { cancelled = true; };
  }, [collegeId]);

  useEffect(() => {
    let cancelled = false;
    setLessonId(null); setClassId(0); setRows([]); setLessons([]); setClassNames({});
    setLoadedScopeKey(null); setLoadError(null); setErrorScopeKey(null); setLessonsError(null);
    if (!courseId) { setLessonsLoading(false); return undefined; }
    const course = courses.find(item => Number(item?.id) === Number(courseId));
    const params = course?.slug ? { courseSlug: course.slug } : { courseId };
    setLessonsLoading(true);
    getLessonsByCourse(courseId).then(res => {
      if (cancelled) return;
      const list = unwrap(res);
      if (!Array.isArray(list)) throw new Error("Unexpected lessons response.");
      setLessons(list);
      setLessonsError(null);
    }).catch(() => {
      if (!cancelled) {
        setLessons([]);
        setLessonsError("Lessons could not be loaded for this course.");
      }
    }).finally(() => { if (!cancelled) setLessonsLoading(false); });
    getClassesForCourseSyllabus(params).then(map => {
      if (!cancelled) setClassNames(map && typeof map === "object" && !Array.isArray(map) ? map : {});
    }).catch(() => { if (!cancelled) setClassNames({}); });
    return () => { cancelled = true; };
  }, [courseId, courses]);

  // BE-0133: only the newest load (for the lesson and section picked now) may fill the table.
  const contentsSeq = useRef(0);
  const loadContents = useCallback(async () => {
    const seq = ++contentsSeq.current;
    const requestScopeKey = resourceScopeKey;
    if (!lessonId || !requestScopeKey) {
      setRows([]);
      setLoadedScopeKey(null);
      setLoadError(null);
      setErrorScopeKey(null);
      return;
    }
    const scopeChanged = loadedScopeKeyRef.current !== requestScopeKey;
    if (scopeChanged) setRows([]);
    setLoading(true);
    setLoadError(null);
    setErrorScopeKey(null);
    try {
      const result = classId > 0
        ? await getLessonContent({ lessonId, classId })
        : await getLessonContents(lessonId);
      if (seq !== contentsSeq.current) return;
      const list = unwrap(result);
      if (!Array.isArray(list)) throw new Error("Unexpected Resources response.");
      setRows(list.filter(row => resourceType(row) === "RESOURCE"));
      setLoadedScopeKey(requestScopeKey);
    } catch (err) {
      if (seq !== contentsSeq.current) return;
      setLoadError(err?.response?.data?.message || err?.message || "Could not load Resources");
      setErrorScopeKey(requestScopeKey);
      if (scopeChanged) setRows([]);
    } finally { if (seq === contentsSeq.current) setLoading(false); }
  }, [lessonId, classId, resourceScopeKey]);

  useEffect(() => { loadContents(); }, [loadContents]);

  const classOptions = useMemo(() => [
    { value: 0, label: "All content in this lesson (new resources go to every section)" },
    ...Object.entries(classNames).filter(([id]) => Number(id) > 0)
      .map(([id, label]) => ({ value: Number(id), label: `${label || `Section ${id}`}: what its students see` })),
  ], [classNames]);

  // BE-0134: what the editor opened with, so closing it with changes asks first instead of silently dropping them.
  const editorBaseline = useRef("");
  const editorSnapshot = (v) => JSON.stringify([v.title, v.notes, v.html, v.materials, v.visible, v.link, v.linkTitle]);
  const openEditor = (record = null) => {
    const data = resourceData(record);
    const start = {
      title: record?.contentTitle ?? record?.content_title ?? "",
      notes: data?.text ?? "",
      html: data?.html_content ?? data?.htmlContent ?? "",
      materials: normaliseMaterials(data),
      visible: record ? record.active !== false && record.enabled !== false : true,
      link: "",
      linkTitle: "",
    };
    editorBaseline.current = editorSnapshot(start);
    setEditing(record);
    setTitle(start.title);
    setNotes(start.notes);
    setHtml(start.html);
    setMaterials(start.materials);
    setVisible(start.visible);
    setLink(""); setLinkTitle(""); setError("");
    setEditorOpen(true);
  };
  const closeEditor = () => {
    if (saving || uploading) return;
    const changed = editorSnapshot({ title, notes, html, materials, visible, link, linkTitle }) !== editorBaseline.current;
    if (changed && !window.confirm("Discard the changes to this resource?")) return;
    setEditorOpen(false);
  };

  const addFiles = async event => {
    const selected = Array.from(event?.target?.files ?? []);
    event.target.value = "";
    if (saving || uploading || !selected.length) return;
    if (materials.length + selected.length > MAX_MATERIALS) {
      setError(`A Resource can contain at most ${MAX_MATERIALS} materials.`); return;
    }
    if (!selected.every(isAllowedResourceFile)) {
      setError("Only PDF, Word, text, PowerPoint, Excel, CSV and images up to 50 MB each are supported."); return;
    }
    setUploading(true); setError("");
    try {
      const targetClassId = editing ? classIdOf(editing) : classId;
      const targetCourseId = editing?.courseId ?? editing?.course_id ?? courseId;
      for (const file of selected) {
        const uploaded = await uploadResourceFile(file, {
          folder: "lesson-content", courseId: targetCourseId,
          ...(targetClassId > 0 ? { classId: targetClassId } : {}),
        });
        if (!uploaded?.key) throw new Error("Upload completed without a storage key");
        setMaterials(previous => [...previous, {
          kind: "FILE", title: file.name,
          file_dto: {
            cloud_storage_object: uploaded.key,
            original_name: uploaded.originalName || file.name,
            mimetype: uploaded.mimetype || getContentTypeFromFile(file),
            size: uploaded.size || file.size,
          },
        }]);
      }
      api.success("Resource files uploaded");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Could not upload file");
    } finally { setUploading(false); }
  };

  const addLink = () => {
    const url = link.trim();
    if (!isValidResourceLink(url)) { setError("Enter a valid HTTPS link without credentials or spaces."); return; }
    if (materials.length >= MAX_MATERIALS) { setError(`Maximum ${MAX_MATERIALS} materials.`); return; }
    if (materials.some(item => item.kind === "LINK" && item.url === url)) { setError("Link already added."); return; }
    setMaterials(previous => [...previous, { kind: "LINK", url, title: linkTitle.trim().slice(0, 255) || url.slice(0, 255) }]);
    setLink(""); setLinkTitle(""); setError("");
  };

  const save = async () => {
    if (uploading || saving) return;
    if (!lessonId || !courseId || title.trim().length < 1 || title.trim().length > 255) {
      setError("Choose a course/lesson and enter a Resource title (1–255 characters)."); return;
    }
    if (!materials.length && !notes.trim() && !html.trim()) {
      setError("Add a file, HTTPS link, or notes before saving."); return;
    }
    setSaving(true); setError("");
    try {
      const oldData = resourceData(editing);
      const payload = {
        lesson_id: editing?.lessonId ?? editing?.lesson_id ?? lessonId,
        course_id: editing?.courseId ?? editing?.course_id ?? courseId,
        class_id: editing ? classIdOf(editing) : classId,
        ...(editing ? { faculty_id: editing?.facultyId ?? editing?.faculty_id } : {}),
        content_type: "RESOURCE",
        content_title: title.trim(),
        sequence: editing?.sequence ?? 1,
        active: visible,
        enabled: visible,
        points: editing?.points ?? 0,
        content_data_dto: {
          resource_materials: materials,
          text: notes.trim(),
          html_content: html,
          allow_discussions: oldData?.allow_discussions ?? oldData?.allowDiscussions ?? false,
          view_after_schedule: oldData?.view_after_schedule ?? oldData?.viewAfterSchedule ?? true,
          view_before_schedule: oldData?.view_before_schedule ?? oldData?.viewBeforeSchedule ?? true,
        },
      };
      if (editing) await updateLessonContent(contentId(editing), payload);
      else await createLessonContent(payload);
      api.success(editing ? "Resource updated" : "Resource created");
      setEditorOpen(false);
      await loadContents();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Could not save Resource");
    } finally { setSaving(false); }
  };

  // There was no way to remove a resource from this page; this is the same delete the Video tab uses.
  const remove = async item => {
    try {
      await deleteLessonContent(contentId(item));
      api.success("Resource deleted");
      await loadContents();
    } catch (err) {
      api.error(err?.response?.data?.message || "Could not delete resource");
    }
  };

  const columns = [
    { title: "Title", key: "title", render: (_, item) => item?.contentTitle ?? item?.content_title ?? "Untitled" },
    { title: "Visibility", key: "class", render: (_, item) => classIdOf(item) > 0
      ? (classNames[classIdOf(item)] || `Section ${classIdOf(item)}`) : "All sections" },
    { title: "Students", key: "visible", render: (_, item) => item?.active !== false && item?.enabled !== false
      ? <Tag color="green">Visible</Tag> : <Tag>Hidden</Tag> },
    { title: "Materials", key: "materials", render: (_, item) => normaliseMaterials(resourceData(item)).length },
    { title: "Action", key: "action", render: (_, item) => (
      <Space>
        <Button icon={<EditOutlined />} onClick={() => openEditor(item)}>Edit</Button>
        <Popconfirm title="Delete this resource?" description="Students will no longer see it." okText="Delete"
          okButtonProps={{ danger: true }} onConfirm={() => remove(item)}>
          <Button icon={<DeleteOutlined />} danger aria-label={`Delete ${item?.contentTitle ?? item?.content_title ?? "resource"}`} />
        </Popconfirm>
      </Space>) },
  ];

  return (
    <div className="ln-module admin-list-page" aria-label="Canonical Resources management">
      {contextHolder}
      <h2>Resources</h2>
      <p className="text-muted">Give a lesson reading material: files, links and notes, together in one resource.</p>
      {coursesError ? (
        <Alert type="error" showIcon message="Could not load courses" description={coursesError} style={{ marginBottom: 12 }} />
      ) : null}
      {lessonsError ? (
        <Alert type="error" showIcon message="Could not load lessons" description={lessonsError} style={{ marginBottom: 12 }} />
      ) : null}
      <Space wrap size="middle" style={{ marginBottom: 16 }}>
        <Select aria-label="Course" placeholder="Select course" style={{ width: 260 }} showSearch optionFilterProp="label"
          value={courseId} onChange={setCourseId} loading={coursesLoading}
          disabled={editorOpen || uploading || coursesLoading || Boolean(coursesError)}
          options={courses.map(item => ({ value: item.id, label: item.courseName ?? item.course_name ?? `Course ${item.id}` }))} />
        <Select aria-label="Lesson" placeholder="Select lesson" style={{ width: 260 }} showSearch optionFilterProp="label"
          value={lessonId} loading={lessonsLoading}
          disabled={!courseId || editorOpen || uploading || lessonsLoading || Boolean(lessonsError)}
          onChange={(value) => {
            setLessonId(value);
            setRows([]);
            setLoadedScopeKey(null);
            setLoadError(null);
            setErrorScopeKey(null);
          }}
          options={lessons.map(item => ({ value: item.id, label: item.lessonName ?? item.lesson_name ?? `Lesson ${item.id}` }))} />
        <Select aria-label="Class" style={{ width: 300 }} value={classId}
          onChange={(value) => {
            setClassId(value);
            setRows([]);
            setLoadedScopeKey(null);
            setLoadError(null);
            setErrorScopeKey(null);
          }}
          disabled={!courseId || editorOpen || uploading} options={classOptions} />
        <Button disabled={!lessonId || !courseId} icon={<PlusOutlined />} type="primary" onClick={() => openEditor()}>Add Resource</Button>
        <Button disabled={!lessonId} loading={loading} onClick={loadContents}>Refresh</Button>
      </Space>
      {refreshing ? <RefreshStatus label="Refreshing resources…" /> : null}
      {currentLoadError ? (
        <Alert
          type={hasCurrentRows ? "warning" : "error"}
          showIcon
          message={hasCurrentRows ? "Couldn't refresh resources" : "Resources could not be loaded"}
          description={hasCurrentRows ? "Showing the last resources loaded for this lesson and class." : currentLoadError}
          action={<Button size="small" onClick={loadContents}>Retry</Button>}
          style={{ marginBottom: 12 }}
        />
      ) : null}
      {initialLoading ? (
        <TableSkeleton rows={6} columns={5} label="Loading resources" />
      ) : currentLoadError && !hasCurrentRows ? null : (
        <Table rowKey={item => contentId(item)} dataSource={rows} columns={columns} pagination={{ pageSize: 15 }} />
      )}
      <Modal open={editorOpen} onCancel={closeEditor} maskClosable={false}
        title={editing ? "Edit Resource" : "Add Resource"} footer={null} width={700} destroyOnClose>
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
        <div className="d-flex flex-column gap-2">
          <label htmlFor="admin-resource-title">Title</label>
          <Input id="admin-resource-title" maxLength={255} value={title} onChange={event => setTitle(event.target.value)} />
          <label htmlFor="admin-resource-notes">Notes</label>
          <Input.TextArea id="admin-resource-notes" rows={3} value={notes} onChange={event => setNotes(event.target.value)} />
          {!!html && <Alert type="info" showIcon message="Existing rich-text content is preserved when this Resource is saved." />}
          <label htmlFor="admin-resource-files">Add files</label>
          <input id="admin-resource-files" type="file" multiple accept={FORMATS.map(ext => `.${ext}`).join(",")}
            disabled={saving || uploading || materials.length >= MAX_MATERIALS} onChange={addFiles} />
          <label htmlFor="admin-resource-link">Add an HTTPS link</label>
          <Input id="admin-resource-link" placeholder="https://example.org/reading" value={link} onChange={event => setLink(event.target.value)} />
          <Input aria-label="Link title" placeholder="Link title (optional)" value={linkTitle} onChange={event => setLinkTitle(event.target.value)} />
          <Button onClick={addLink} disabled={saving || uploading || materials.length >= MAX_MATERIALS}>Add link</Button>
          <ul className="list-unstyled">
            {materials.map((item, index) => (
              <li key={`${item.kind}-${index}`} className="d-flex justify-content-between align-items-center gap-2 mb-2">
                <span style={{ overflowWrap: "anywhere" }}>{item.kind === "FILE" ? "File" : "Link"}: {item.title}</span>
                <Button icon={<DeleteOutlined />} danger type="text" aria-label={`Remove ${item.title}`}
                  disabled={saving || uploading} onClick={() => setMaterials(previous => previous.filter((_, i) => i !== index))} />
              </li>
            ))}
          </ul>
          <label htmlFor="admin-resource-visible" className="d-flex align-items-center gap-2">
            <Switch id="admin-resource-visible" checked={visible} onChange={setVisible} /> Visible to students
          </label>
          <Space style={{ justifyContent: "flex-end" }}>
            <Button disabled={saving || uploading} onClick={closeEditor}>Cancel</Button>
            <Button type="primary" loading={saving || uploading} disabled={saving || uploading}
              icon={<UploadOutlined />} onClick={save}>{editing ? "Save changes" : "Create Resource"}</Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
}
