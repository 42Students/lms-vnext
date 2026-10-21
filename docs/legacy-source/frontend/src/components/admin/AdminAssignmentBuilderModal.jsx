import { useEffect, useRef, useState } from "react";
import { Alert, Button, Checkbox, DatePicker, Form, Input, InputNumber, message, Modal, Radio, Select, Spin } from "antd";
import dayjs from "dayjs";
import { DeleteOutlined } from "@ant-design/icons";
import { getLessonsByCourse, getLessonContentById } from "@/api/Services/AdminService";
import { getClassesForCourseSyllabus } from "@/api/Services/adminServices/departmentService";
import { saveAdminAssignmentContent } from "@/api/Services/AdminAssignmentContentService";
import { uploadFileViaPresign } from "@/utils/uploadToR2";
import UploadFromLinkButton from "@/components/Global/Upload/UploadFromLinkButton";
import { applyServerFieldErrors, getServerFormError } from "@/utils/formErrors";
import {
  ASSIGNMENT_RESOURCE_OPTIONS,
  ASSIGNMENT_RESOURCE_TYPES,
  ASSIGNMENT_SUBMISSION_OPTIONS,
  ASSIGNMENT_SUBMISSION_TYPES,
  createEmptyResource,
} from "@/utils/assignmentSchema";
import {
  buildAdminAssignmentContentData,
  prepareAdminAssignmentEditor,
} from "@/utils/adminAssignmentResources";
import { buildAdminAssignmentUpdatePayload } from "@/utils/adminAssignmentEdit";
import { wallClockToDayjs } from "@/utils/dateUtils";

const { TextArea } = Input;
const ATTACHMENT_TYPES = ASSIGNMENT_RESOURCE_OPTIONS.filter((r) => r.value !== ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS);

export default function AdminAssignmentBuilderModal({ open, onClose, onSaved, courseOptions = [], assignment, collegeId }) {
  const [form] = Form.useForm();
  const [lessonOptions, setLessonOptions] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [editVersion, setEditVersion] = useState(null);
  const [resources, setResources] = useState([]);
  const [submissionTypes, setSubmissionTypes] = useState([ASSIGNMENT_SUBMISSION_TYPES.WRITTEN_RESPONSE]);
  const [uploadingIds, setUploadingIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [dirty, setDirty] = useState(false);
  const savingRef = useRef(false);
  const requestId = useRef(0);

  const loadLessons = (courseId, request) => {
    if (!courseId) { setLessonOptions([]); return; }
    setLessonsLoading(true);
    getLessonsByCourse(courseId)
      .then((res) => {
        if (request !== requestId.current) return;
        const lessons = res?.data?.data ?? res?.data ?? [];
        setLessonOptions((Array.isArray(lessons) ? lessons : []).map((l) => ({
          value: l.id, label: l.lesson_name || l.lessonName || `Lesson ${l.id}`,
        })));
      })
      .catch(() => { if (request === requestId.current) setLessonOptions([]); })
      .finally(() => { if (request === requestId.current) setLessonsLoading(false); });
  };

  const loadClasses = (courseId, request, includeHistoricalClassId = null) => {
    if (!courseId) { setClassOptions([]); return; }
    setClassesLoading(true);
    getClassesForCourseSyllabus({
      courseId,
      ...(includeHistoricalClassId > 0 ? { includeHistoricalClassId } : {}),
    })
      .then((classes) => {
        if (request !== requestId.current) return;
        const options = Object.entries(classes && typeof classes === "object" ? classes : {})
          .filter(([id]) => id !== "undefined" && Number(id) > 0)
          .map(([id, name]) => ({ value: Number(id), label: name || `Class ${id}` }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setClassOptions(options);
      })
      .catch(() => { if (request === requestId.current) setClassOptions([]); })
      .finally(() => { if (request === requestId.current) setClassesLoading(false); });
  };

  useEffect(() => {
    const request = ++requestId.current;
    if (!open) return;
    form.resetFields();
    setDirty(false);
    setDetailsError(null);
    setEditVersion(null);
    setResources([]);
    setUploadingIds([]);
    setSubmissionTypes([ASSIGNMENT_SUBMISSION_TYPES.WRITTEN_RESPONSE]);
    if (assignment) {
      form.setFieldsValue({
        courseId: assignment.courseId,
        lessonId: assignment.lessonId,
        audienceMode: assignment.classId && assignment.classId > 0 ? "SPECIFIC" : "ALL",
        classId: assignment.classId && assignment.classId > 0 ? assignment.classId : undefined,
        contentTitle: assignment.title,
        description: assignment.description || "",
        points: assignment.points,
        deadline: wallClockToDayjs(assignment.deadline),
      });
      loadLessons(assignment.courseId, request);
      setDetailsLoading(true);
      getLessonContentById(assignment.id)
        .then((res) => {
          if (request !== requestId.current) return;
          const current = res?.data?.data ?? res?.data;
          if (!current || Number(current.id) !== Number(assignment.id)) {
            throw new Error("Assignment details could not be loaded. Refresh and retry.");
          }
          const data = current.contentDataDTO ?? current.content_data_dto ?? {};
          const prepared = prepareAdminAssignmentEditor(data, assignment.description);
          const resolvedCourseId = Number(current.courseId ?? current.course_id ?? assignment.courseId);
          const resolvedLessonId = Number(current.lessonId ?? current.lesson_id ?? assignment.lessonId);
          const resolvedClassId = Number(current.classId ?? current.class_id ?? 0);
          setResources(prepared.otherResources);
          setSubmissionTypes(prepared.submissionTypes);
          setEditVersion(current.version ?? null);
          form.setFieldsValue({
            courseId: resolvedCourseId,
            lessonId: resolvedLessonId,
            audienceMode: resolvedClassId > 0 ? "SPECIFIC" : "ALL",
            classId: resolvedClassId > 0 ? resolvedClassId : undefined,
            description: prepared.description,
          });
          loadClasses(resolvedCourseId, request, resolvedClassId);
        })
        .catch((error) => { if (request === requestId.current) setDetailsError(error); })
        .finally(() => { if (request === requestId.current) setDetailsLoading(false); });
    } else {
      form.setFieldsValue({ points: 0, audienceMode: "ALL", classId: undefined });
      setLessonOptions([]);
      setClassOptions([]);
    }
    return () => { ++requestId.current; };
  }, [open, assignment, form]);

  const updateResource = (id, patch) => {
    setDirty(true);
    setResources((current) =>
      current.map((resource) => resource.id === id ? { ...resource, ...patch } : resource));
  };

  const addResource = (type) => {
    if (!ATTACHMENT_TYPES.some((option) => option.value === type)) return;
    setDirty(true);
    setResources((current) => [...current, createEmptyResource(type)]);
  };

  const attachResult = (id, file, result, type) => {
    updateResource(id, {
      title: result?.originalName || file?.name || "",
      file_dto: {
        size: result?.size ?? file?.size ?? 0,
        encoding: "",
        mimetype: result?.mimetype || file?.type || (type === ASSIGNMENT_RESOURCE_TYPES.PDF ? "application/pdf" : ""),
        field_name: "",
        original_name: result?.originalName || file?.name || "",
        cloud_storage_object: result?.key || result?.publicUrl || "",
      },
    });
  };

  const uploadFile = async (resource, file) => {
    if (!file) return;
    if (resource.type === ASSIGNMENT_RESOURCE_TYPES.PDF &&
        (!/\.pdf$/i.test(file.name || "") || (file.type && file.type !== "application/pdf"))) {
      message.error("Select a PDF file.");
      return;
    }
    setUploadingIds((current) => [...current, resource.id]);
    try {
      const result = await uploadFileViaPresign(file, {
        folder: "assignments",
        type: resource.type === ASSIGNMENT_RESOURCE_TYPES.PDF ? "pdf" : "generic",
        collegeId,
      });
      attachResult(resource.id, file, result, resource.type);
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || "Attachment upload failed");
    } finally {
      setUploadingIds((current) => current.filter((id) => id !== resource.id));
    }
  };

  const handleSave = async () => {
    if (savingRef.current || saving || detailsLoading || uploadingIds.length) {
      if (uploadingIds.length) message.warning("Wait for attachment uploads to finish.");
      return;
    }
    try {
      if (detailsError) throw detailsError;
      const values = await form.validateFields();
      savingRef.current = true;
      setSaving(true);
      setSaveError(null);
      const deadline = values.deadline;
      const targetClassId = values.audienceMode === "SPECIFIC" ? Number(values.classId) : 0;
      let payload;
      if (assignment?.id) {
        // Refresh the full record before editing; the list intentionally excludes resource data.
        const response = await getLessonContentById(assignment.id);
        const current = response?.data?.data ?? response?.data;
        if (!current || Number(current.id) !== Number(assignment.id)) {
          throw new Error("Assignment details could not be loaded. Refresh and retry.");
        }
        if (editVersion != null && current.version !== editVersion) {
          throw new Error("This assignment changed while you were editing. Reopen it to avoid overwriting someone else's changes.");
        }
        payload = buildAdminAssignmentUpdatePayload(current, { ...values, classId: targetClassId });
        payload.content_data_dto = buildAdminAssignmentContentData({
          description: values.description,
          resources,
          submissionTypes,
          deadline,
          previousData: payload.content_data_dto,
        });
        payload.lesson_content_id = assignment.id;
      } else {
        payload = {
          lesson_id: values.lessonId,
          course_id: values.courseId,
          class_id: targetClassId,
          content_type: "ASSIGNMENT",
          content_title: values.contentTitle,
          points: values.points ?? 0,
          deadline: deadline ? deadline.format("YYYY-MM-DDTHH:mm:ss") : null,
          content_data_dto: buildAdminAssignmentContentData({
            description: values.description, resources, submissionTypes, deadline,
          }),
          enabled: true,
          active: true,
        };
      }
      await saveAdminAssignmentContent(payload);
      message.success(assignment?.id ? "Assignment updated" : "Assignment created");
      setDirty(false);
      onSaved?.();
    } catch (error) {
      if (!error?.errorFields) {
        const fieldError = applyServerFieldErrors(form, error, {
          course_id: "courseId", lesson_id: "lessonId", class_id: "classId",
          content_title: "contentTitle", points: "points", deadline: "deadline",
        });
        const errorMessage = getServerFormError(error, "Failed to save assignment");
        setSaveError(errorMessage);
        if (!fieldError) message.error(errorMessage);
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const requestClose = () => {
    if (savingRef.current || saving) { message.info("Wait for the assignment save to finish."); return; }
    if (uploadingIds.length) { message.warning("Wait for attachment uploads to finish."); return; }
    if (!dirty) {
      onClose?.();
      return;
    }
    Modal.confirm({
      title: "Discard unsaved assignment changes?",
      content: "Your assignment fields, resources and submission settings will be lost.",
      okText: "Discard changes",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => {
        setDirty(false);
        onClose?.();
      },
    });
  };

  const busy = saving || detailsLoading || uploadingIds.length > 0;
  return (
    <Modal
      open={open}
      title={assignment ? "Edit Assignment" : "Create Assignment"}
      onCancel={requestClose}
      onOk={handleSave}
      confirmLoading={saving}
      maskClosable={!busy}
      closable={!busy}
      keyboard={!busy}
      okButtonProps={{ disabled: busy || Boolean(detailsError) }}
      okText={assignment ? "Save" : "Create"}
      width={720}
      destroyOnClose
    >
      {detailsLoading ? <Spin tip="Loading assignment details" /> : null}
      {detailsError ? <div role="alert">Cannot load assignment details. Close and retry.</div> : null}
      {saveError ? (
        <Alert
          type="error"
          showIcon
          message={assignment?.id ? "Assignment changes were not saved" : "Assignment was not created"}
          description={saveError}
          closable
          onClose={() => setSaveError(null)}
          style={{ marginBottom: 12 }}
        />
      ) : null}
      <Form form={form} layout="vertical" onFinish={handleSave} onValuesChange={() => setDirty(true)} disabled={saving}>
        <Form.Item name="courseId" label="Course" rules={[{ required: true, message: "Select a course" }]}>
          <Select
            options={courseOptions}
            showSearch
            filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
            onChange={(courseId) => {
              const request = requestId.current;
              form.setFieldsValue({ lessonId: undefined, audienceMode: "ALL", classId: undefined });
              loadLessons(courseId, request);
              loadClasses(courseId, request);
            }}
            disabled={Boolean(assignment)}
          />
        </Form.Item>
        <Form.Item name="lessonId" label="Lesson" rules={[{ required: true, message: "Select a lesson" }]}>
          <Select options={lessonOptions} loading={lessonsLoading} disabled={Boolean(assignment)} />
        </Form.Item>
        <Form.Item
          name="audienceMode"
          label="Audience"
          rules={[{ required: true, message: "Choose who receives this assignment" }]}
        >
          <Radio.Group>
            <Radio value="ALL">All currently eligible sections for this course</Radio>
            <Radio value="SPECIFIC">One specific section</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(prev, cur) => prev.audienceMode !== cur.audienceMode}>
          {({ getFieldValue }) => getFieldValue("audienceMode") === "SPECIFIC" ? (
            <Form.Item
              name="classId"
              label="Specific section"
              rules={[{ required: true, message: "Select a section" }]}
              extra={classOptions.length
                ? `${classOptions.length} current section${classOptions.length === 1 ? "" : "s"} available for this course.`
                : "No current section is eligible for this course."}
            >
              <Select
                loading={classesLoading}
                options={classOptions}
                placeholder="Select an eligible section"
                showSearch
                filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>
          ) : (
            <p style={{ marginTop: -8, color: "#8c8c8c" }}>
              Shared content is visible only to sections currently entitled to this course, not every section in the college.
            </p>
          )}
        </Form.Item>
        <Form.Item name="contentTitle" label="Title" rules={[{ required: true, whitespace: true, message: "Enter a title" }, { max: 255 }]}>
          <Input placeholder="e.g., Module 1 Project" />
        </Form.Item>
        <Form.Item name="description" label="Instructions">
          <TextArea rows={4} placeholder="What the student needs to submit" />
        </Form.Item>
        <Form.Item name="points" label="Points" rules={[{ required: true, message: "Enter points" }]}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="deadline" label="Deadline">
          <DatePicker showTime style={{ width: "100%" }} />
        </Form.Item>
        <section aria-label="Assignment resources">
          <h3>Assignment Resources</h3>
          <p>Attach PDFs, files and HTTPS links students need for this assignment.</p>
          <Select
            placeholder="Add attachment or link"
            aria-label="Add resource"
            value={undefined}
            options={ATTACHMENT_TYPES}
            onSelect={addResource}
            style={{ width: 250, marginBottom: 12 }}
          />
          {resources.map((resource) => (
            <div key={resource.id} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12, borderRadius: 8 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <strong>{ATTACHMENT_TYPES.find((option) => option.value === resource.type)?.label}</strong>
                <Button type="text" danger icon={<DeleteOutlined />}
                  aria-label={`Remove ${resource.title || resource.type}`}
                  onClick={() => { setDirty(true); setResources((current) => current.filter((r) => r.id !== resource.id)); }}>
                  Remove
                </Button>
              </div>
              <Input
                aria-label="Resource title"
                placeholder="Resource title"
                value={resource.title}
                onChange={(event) => updateResource(resource.id, { title: event.target.value })}
                style={{ marginBottom: 8 }}
              />
              {resource.type === ASSIGNMENT_RESOURCE_TYPES.LINK ? (
                <Input
                  aria-label="Resource HTTPS link"
                  placeholder="https://example.com/resource"
                  value={resource.link}
                  onChange={(event) => updateResource(resource.id, { link: event.target.value })}
                />
              ) : (
                <>
                  <label>
                    <span>{resource.type === ASSIGNMENT_RESOURCE_TYPES.PDF ? "Upload PDF" : "Upload file"}</span>
                    <input
                      type="file"
                      aria-label={`Upload ${resource.type === ASSIGNMENT_RESOURCE_TYPES.PDF ? "PDF" : "file"}`}
                      accept={resource.type === ASSIGNMENT_RESOURCE_TYPES.PDF ? ".pdf,application/pdf" : undefined}
                      disabled={uploadingIds.includes(resource.id)}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        uploadFile(resource, file);
                      }}
                    />
                  </label>
                  <UploadFromLinkButton
                    folder="assignments"
                    type={resource.type === ASSIGNMENT_RESOURCE_TYPES.PDF ? "pdf" : "generic"}
                    onImported={(result) => attachResult(resource.id, null, result, resource.type)}
                  >Upload from Drive</UploadFromLinkButton>
                  {resource.file_dto?.original_name ? <p>Attached: {resource.file_dto.original_name}</p> : null}
                </>
              )}
            </div>
          ))}
        </section>
        <section aria-label="Learner submission methods">
          <h3>How students can submit</h3>
          <Checkbox.Group
            value={submissionTypes}
            options={ASSIGNMENT_SUBMISSION_OPTIONS}
            onChange={(value) => { setDirty(true); setSubmissionTypes(value); }}
          />
        </section>
      </Form>
    </Modal>
  );
}
