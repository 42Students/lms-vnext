import { Alert, Button, Checkbox, DatePicker, Dropdown, Form, Input, Modal, Select, Upload, message } from "antd";
import Editor from "@/components/Global/Editor/editor";
import DrawerWidget from "../../RightDrawer/DrawerWidget";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  CloseCircleFilled,
  DeleteOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  LinkOutlined,
  PaperClipOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { createLessonContent, getAssignmentSubmissions, getFacultyProgram, getLessonList } from "@/api/Services/courseServices";
import { uploadFileViaPresign } from "@/utils/uploadToR2";
import UploadFromLinkButton from "@/components/Global/Upload/UploadFromLinkButton";
import dayjs from "dayjs";
import { wallClockToDayjs } from "@/utils/dateUtils";
const CONTENT_SCOPE_OPTIONS = [
  { label: "This class only", value: "CLASS" },
  { label: "Shared to all sections", value: "SHARED" },
];
import {
  ASSIGNMENT_RESOURCE_OPTIONS,
  ASSIGNMENT_RESOURCE_TYPES,
  ASSIGNMENT_SUBMISSION_OPTIONS,
  ASSIGNMENT_SUBMISSION_TYPES,
  createEmptyResource,
  hasMeaningfulHtmlContent,
  isSingleInstanceResourceType,
  normalizeAllowedSubmissionTypes,
  normalizeAssignmentResources,
} from "@/utils/assignmentSchema";

const RESOURCE_TYPE_ICONS = {
  [ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS]: FileTextOutlined,
  [ASSIGNMENT_RESOURCE_TYPES.PDF]: FilePdfOutlined,
  [ASSIGNMENT_RESOURCE_TYPES.FILE]: PaperClipOutlined,
  [ASSIGNMENT_RESOURCE_TYPES.LINK]: LinkOutlined,
};

function getCourseLabel(course) {
  return (
    course?.course?.courseName ||
    course?.course?.course_name ||
    course?.courseName ||
    course?.course_name ||
    course?.name ||
    course?.course?.name ||
    (course?.course_id || course?.courseId ? `Course ${course?.course_id ?? course?.courseId}` : "")
  );
}

function createEmptyFileDTO() {
  return {
    size: 0,
    encoding: "",
    mimetype: "",
    field_name: "",
    original_name: "",
    cloud_storage_object: "",
  };
}

function getResourceTitlePlaceholder(type) {
  switch (type) {
    case ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS:
      return "Instructions title";
    case ASSIGNMENT_RESOURCE_TYPES.PDF:
      return "PDF title";
    case ASSIGNMENT_RESOURCE_TYPES.FILE:
      return "File title";
    case ASSIGNMENT_RESOURCE_TYPES.LINK:
      return "Link title";
    default:
      return "Resource title";
  }
}

export default function DrawerAssignment({ open, onClose, onSaved, onDirtyChange, editSelectedAssignment, insideSyllabus, lesson }) {
  const loginUser = useSelector((state) => state.loginUser);
  const selectedCourse = useSelector((state) => state.course);
  const isTeacherRole = loginUser?.userType === "FACULTY";
  const isAdminFaculty = loginUser?.facultyType === "ADMIN";
  const isEditing = !!editSelectedAssignment;
  // Backend rules (AssignmentContentWriteService#save), not a UI preference: an assignment's
  // lesson/course is immutable for everyone once created ("Assignment identity cannot be
  // changed" -- 400), and a non-admin faculty member is flatly forbidden from changing its class
  // visibility (403). Offering editable controls the save will always reject for is the actual
  // bug here -- lock them instead of letting the request round-trip to find out.
  const courseLessonLocked = isEditing;
  const [assessmentDefinitionLocked, setAssessmentDefinitionLocked] = useState(false);
  const [assessmentLockState, setAssessmentLockState] = useState("idle");
  const visibilityLocked = (isEditing && !isAdminFaculty) || assessmentDefinitionLocked;
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [courseOptionList, setCourseOptionList] = useState([]);
  const [lessonOptionList, setLessonOptionList] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState(null);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonsError, setLessonsError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [formParams, setFormParams] = useState({});
  const [resources, setResources] = useState([createEmptyResource(ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS)]);
  const [allowedSubmissionTypes, setAllowedSubmissionTypes] = useState([ASSIGNMENT_SUBMISSION_TYPES.WRITTEN_RESPONSE]);
  const [uploadingResourceIds, setUploadingResourceIds] = useState([]);
  const [contentScope, setContentScope] = useState("CLASS");
  // The due-date validator below must reject a faculty member actively setting a past date, but
  // NOT block ordinary edits (fixing a typo, adding a resource) to an assignment whose due date
  // has simply already passed since it was created -- that's a normal, common thing to still need
  // to edit, not the "faculty sets a bad due date" case the policy is actually about.
  const originalDueDateRef = useRef(null);
  const submitAttemptRef = useRef(false);

  const submissionTypeOptions = useMemo(() => ASSIGNMENT_SUBMISSION_OPTIONS, []);
  const resourceTypeOptions = useMemo(() => ASSIGNMENT_RESOURCE_OPTIONS, []);

  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!open || !isEditing || !editSelectedAssignment?.id) {
      setAssessmentDefinitionLocked(false);
      setAssessmentLockState("idle");
      return undefined;
    }
    let cancelled = false;
    // Fail closed while the submission state is unknown: changing assessment rules is destructive.
    setAssessmentDefinitionLocked(true);
    setAssessmentLockState("loading");
    getAssignmentSubmissions({ lessonContentId: editSelectedAssignment.id, page: 0, size: 1 })
      .then((response) => {
        if (cancelled) return;
        const data = response?.data ?? response;
        const rows = Array.isArray(data) ? data
          : Array.isArray(data?.content) ? data.content
          : Array.isArray(data?.data?.content) ? data.data.content
          : Array.isArray(data?.data) ? data.data
          : [];
        const total = Number(data?.totalElements ?? data?.data?.totalElements ?? rows.length);
        setAssessmentDefinitionLocked(total > 0);
        setAssessmentLockState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setAssessmentDefinitionLocked(true);
        setAssessmentLockState("error");
      });
    return () => { cancelled = true; };
  }, [editSelectedAssignment?.id, isEditing, open]);

  const hydrateCourses = useCallback(() => {
    if (!isTeacherRole || insideSyllabus) {
      setCoursesError(null);
      setCoursesLoading(false);
      return;
    }
    setCoursesLoading(true);
    setCoursesError(null);
    getFacultyProgram({ facultyId: loginUser?.id })
      .then((res) => {
        const courses = res?.data?.data || [];
        setCourseOptionList(
          courses.map((course) => ({
            clsid: course?.class_id,
            value: course?.course_id,
            course_id: course?.course_id,
            course_slug: course?.course_slug ?? course?.courseSlug,
            label: getCourseLabel(course),
            key: course?.course_id,
          }))
        );
      })
      .catch((error) => {
        setCourseOptionList([]);
        setCoursesError(error?.response?.data?.message || "Could not load your assigned courses.");
      })
      .finally(() => setCoursesLoading(false));
  }, [isTeacherRole, insideSyllabus, loginUser?.id]);

  const fetchLessons = useCallback((classId, courseId, courseSlug) => {
    const params = courseSlug ? { courseSlug, classId } : { courseId, classId };
    setLessonOptionList([]);
    setLessonsLoading(true);
    setLessonsError(null);
    getLessonList(params)
      .then((res) => {
        const lessons = res?.data?.data || [];
        setLessonOptionList(
          lessons.map((lesson) => ({
            ...lesson?.lesson,
            label: lesson?.lesson?.lessonName,
            value: lesson?.lesson?.id,
            key: lesson?.lesson?.id,
          }))
        );
      })
      .catch((error) => {
        setLessonOptionList([]);
        setLessonsError(error?.response?.data?.message || "Could not load lessons for this course.");
      })
      .finally(() => setLessonsLoading(false));
  }, []);

  const hydrateEditor = useCallback(() => {
    const assignmentData = editSelectedAssignment?.contentDataDTO || editSelectedAssignment?.content_data_dto;
    if (editSelectedAssignment && Object.values(editSelectedAssignment).length > 0) {
      fetchLessons(
        editSelectedAssignment?.classId,
        editSelectedAssignment?.courseId,
        editSelectedAssignment?.courseSlug ?? editSelectedAssignment?.course_slug
      );
      const normalizedResources = normalizeAssignmentResources(assignmentData);
      const normalizedSubmissionTypes = normalizeAllowedSubmissionTypes(assignmentData);
      setResources(normalizedResources.length > 0 ? normalizedResources : [createEmptyResource(ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS)]);
      setAllowedSubmissionTypes(normalizedSubmissionTypes);
      // classId 0/absent means SHARED (see AssignmentContentWriteService#save) -- this used to
      // never be read back, so every edit silently defaulted contentScope to CLASS regardless of
      // the assignment's real scope, which alone was enough to trip the backend's "Faculty cannot
      // change assignment scope" 403 on save even when nobody touched Visibility.
      const existingScope = editSelectedAssignment?.classId ? "CLASS" : "SHARED";
      setContentScope(existingScope);
      // The deadline arrives as a Jackson array ([2026, 9, 24, 15, 50]); dayjs(array) is Invalid Date, so
      // editing an assignment that had a deadline opened with a broken date.
      const existingDueDate = wallClockToDayjs(assignmentData?.due_date || assignmentData?.dueDate || editSelectedAssignment?.deadline);
      originalDueDateRef.current = existingDueDate;
      form.setFieldsValue({
        contentTitle: editSelectedAssignment?.contentTitle,
        contentScope: existingScope,
        course: editSelectedAssignment?.courseId,
        lesson: editSelectedAssignment?.lessonId,
        points: editSelectedAssignment?.points,
        due_date: existingDueDate || undefined,
      });
      setFormParams({
        classId: editSelectedAssignment?.classId,
        course: {
          label: getCourseLabel(editSelectedAssignment),
          value: editSelectedAssignment?.courseId,
        },
        lesson: { value: editSelectedAssignment?.lessonId },
      });
      setDirty(false);
      return;
    }

    form.resetFields();
    setResources([createEmptyResource(ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS)]);
    setAllowedSubmissionTypes([ASSIGNMENT_SUBMISSION_TYPES.WRITTEN_RESPONSE]);
    setContentScope("CLASS");
    setFormParams({});
    originalDueDateRef.current = null;
    setDirty(false);
  }, [editSelectedAssignment, fetchLessons, form]);

  useEffect(() => {
    if (!open) return;
    hydrateCourses();
  }, [hydrateCourses, open]);

  useEffect(() => {
    if (!open) return;
    hydrateEditor();
  }, [hydrateEditor, open]);

  const isUploading = uploadingResourceIds.length > 0;

  function updateResource(resourceId, patch) {
    setDirty(true);
    setResources((current) => current.map((resource) => (resource.id === resourceId ? { ...resource, ...patch } : resource)));
  }

  function addResource(type) {
    if (!type) return;
    setDirty(true);
    setResources((current) => {
      if (isSingleInstanceResourceType(type) && current.some((resource) => resource.type === type)) {
        return current;
      }
      return [...current, createEmptyResource(type)];
    });
  }

  function removeResource(resourceId) {
    setDirty(true);
    setResources((current) => current.filter((resource) => resource.id !== resourceId));
  }

  const addedResourceTypes = useMemo(
    () => new Set(resources.map((resource) => resource.type)),
    [resources]
  );

  const availableResourceTypeOptions = useMemo(
    () => resourceTypeOptions.filter((option) => !isSingleInstanceResourceType(option.value) || !addedResourceTypes.has(option.value)),
    [addedResourceTypes, resourceTypeOptions]
  );

  function markUploading(resourceId, nextState) {
    setUploadingResourceIds((current) =>
      nextState ? Array.from(new Set([...current, resourceId])) : current.filter((value) => value !== resourceId)
    );
  }

  async function uploadResourceFile(resource, file, forcePdf = false) {
    markUploading(resource.id, true);
    try {
      const result = await uploadFileViaPresign(file, {
        folder: "assignments",
        type: forcePdf ? "pdf" : "generic",
      });
      updateResource(resource.id, {
        title: resource.title || result?.originalName || file?.name || "",
        file_dto: {
          size: result?.size || file?.size || 0,
          encoding: "",
          mimetype: file?.type || "",
          field_name: "",
          original_name: result?.originalName || file?.name || "",
          cloud_storage_object: result?.key || result?.publicUrl || "",
        },
      });
    } catch {
      messageApi.open({
        type: "error",
        content: "File upload failed. Try again.",
        duration: 2,
      });
    } finally {
      markUploading(resource.id, false);
    }
  }

  function buildLegacyFields(nextResources) {
    const firstInstruction = nextResources.find((resource) => resource.type === ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS && hasMeaningfulHtmlContent(resource.text));
    const firstFile = nextResources.find((resource) =>
      [ASSIGNMENT_RESOURCE_TYPES.PDF, ASSIGNMENT_RESOURCE_TYPES.FILE].includes(resource.type)
      && resource?.file_dto?.cloud_storage_object
    );
    const firstLink = nextResources.find((resource) => resource.type === ASSIGNMENT_RESOURCE_TYPES.LINK && resource.link?.trim());
    return {
      html_content: firstInstruction?.text || "",
      file_dto: firstFile?.file_dto || createEmptyFileDTO(),
      link: firstLink?.link || "",
    };
  }

  function validateResources(nextResources) {
    const validResources = nextResources.filter((resource) => {
      if (resource.type === ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS) {
        return hasMeaningfulHtmlContent(resource.text);
      }
      if (resource.type === ASSIGNMENT_RESOURCE_TYPES.LINK) {
        return !!resource.link?.trim();
      }
      return !!resource?.file_dto?.cloud_storage_object;
    });

    if (validResources.length === 0) {
      messageApi.open({ type: "warning", content: "Add at least one assignment resource.", duration: 2 });
      return false;
    }

    const invalidTitles = validResources.some((resource) => !resource.title?.trim());
    if (invalidTitles) {
      messageApi.open({ type: "warning", content: "Give each assignment resource a title.", duration: 2 });
      return false;
    }

    return true;
  }

  const requestClose = () => {
    if (saving) return;
    if (isUploading) {
      messageApi.open({ type: "warning", content: "Wait for resource uploads to finish before closing.", duration: 2 });
      return;
    }
    if (!dirty) {
      onClose?.();
      return;
    }
    Modal.confirm({
      title: isEditing ? "Discard assignment changes?" : "Discard this assignment draft?",
      content: "Your unsaved assignment details and resources will be lost.",
      okText: "Discard",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => {
        setDirty(false);
        onClose?.();
      },
    });
  };

  function handleSubmit() {
    if (saving || submitAttemptRef.current) return;
    submitAttemptRef.current = true;
    form.validateFields().then(() => {
      if (isUploading) {
        submitAttemptRef.current = false;
        messageApi.open({ type: "warning", content: "Wait for resource uploads to finish.", duration: 2 });
        return;
      }
      if (!allowedSubmissionTypes.length) {
        submitAttemptRef.current = false;
        messageApi.open({ type: "warning", content: "Choose at least one learner submission method.", duration: 2 });
        return;
      }
      if (!validateResources(resources)) {
        submitAttemptRef.current = false;
        return;
      }

      const selectedCourseOption = courseOptionList.find((course) => course.value === formParams?.course?.value);
      const normalizedResources = resources
        .map((resource) => ({
          ...resource,
          title: resource.title?.trim() || "",
          link: resource.link?.trim() || "",
        }))
        .filter((resource) => {
          if (resource.type === ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS) return hasMeaningfulHtmlContent(resource.text);
          if (resource.type === ASSIGNMENT_RESOURCE_TYPES.LINK) return !!resource.link;
          return !!resource?.file_dto?.cloud_storage_object;
        });

      const originalData = editSelectedAssignment?.contentDataDTO || editSelectedAssignment?.content_data_dto || {};
      const persistedResources = assessmentDefinitionLocked
        ? normalizeAssignmentResources(originalData)
        : normalizedResources;
      const persistedSubmissionTypes = assessmentDefinitionLocked
        ? normalizeAllowedSubmissionTypes(originalData)
        : allowedSubmissionTypes;
      const persistedDueDate = assessmentDefinitionLocked
        ? originalDueDateRef.current
        : form.getFieldValue("due_date");
      const persistedPoints = assessmentDefinitionLocked
        ? Number(editSelectedAssignment?.points ?? 0)
        : (() => {
            const raw = form.getFieldValue("points");
            return raw === undefined || raw === null || String(raw).trim() === "" ? 0 : Number(raw);
          })();
      const persistedClassId = assessmentDefinitionLocked
        ? Number(editSelectedAssignment?.classId || 0)
        : (contentScope === "SHARED"
            ? 0
            : (insideSyllabus ? (lesson?.classId || loginUser?.classId || 0) : (formParams?.classId || 0)));
      const legacyFields = buildLegacyFields(persistedResources);
      const payload = {
        ...(editSelectedAssignment?.id ? { lesson_content_id: editSelectedAssignment.id } : {}),
        faculty_id: loginUser?.id,
        sequence: 0,
        class_id: persistedClassId,
        course_id: insideSyllabus ? (lesson?.courseId || selectedCourse?.selectedCourseId || 0) : formParams?.course?.value,
        ...((insideSyllabus ? (lesson?.courseSlug || selectedCourse?.selectedCourseSlug) : selectedCourseOption?.course_slug)
          && { courseSlug: insideSyllabus ? (lesson?.courseSlug || selectedCourse?.selectedCourseSlug) : selectedCourseOption?.course_slug }),
        lesson_id: insideSyllabus ? (lesson?.lessonId || lesson?.id) : formParams?.lesson?.value,
        content_type: "ASSIGNMENT",
        content_title: form.getFieldValue("contentTitle"),
        // Authoritative submission cutoff consumed by AssignmentServiceImpl. Keep due_date below
        // for legacy/read compatibility, but never let the displayed due date drift from the
        // backend-enforced deadline again.
        deadline: persistedDueDate?.format?.("YYYY-MM-DDTHH:mm:ss") || null,
        content_data_dto: {
          ...legacyFields,
          assignment_resources: persistedResources,
          allowed_submission_types: persistedSubmissionTypes,
          allow_discussions: "",
          view_after_schedule: true,
          view_before_schedule: true,
          text: "",
          duration: 0,
          due_date: persistedDueDate?.toISOString?.() || "",
          end_time: "",
          start_time: "",
        },
        active: true,
        enabled: true,
        points: persistedPoints,
      };

      setSaving(true);
      createLessonContent(payload)
        .then(() => {
          messageApi.open({
            type: "success",
            content: editSelectedAssignment ? "Assignment updated successfully" : "Assignment created successfully",
            duration: 2,
          });
          setDirty(false);
          setTimeout(() => {
            form.resetFields();
            onSaved?.();
            onClose?.();
          }, 700);
        })
        .catch((error) => {
          const apiMessage =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            (editSelectedAssignment ? "Failed to update assignment" : "Failed to create assignment");
          messageApi.open({ type: "error", content: apiMessage, duration: 2 });
        })
        .finally(() => {
          submitAttemptRef.current = false;
          setSaving(false);
        });
    }).catch(() => {
      submitAttemptRef.current = false;
    });
  }

  const dummyRequest = ({ onSuccess }) => {
    setTimeout(() => onSuccess("ok"), 0);
  };

  return (
    <>
      <DrawerWidget
        className="ln-assignment-create-drawer"
        title={
          editSelectedAssignment
            ? "Edit Assignment"
            : insideSyllabus && lesson?.lessonName
              ? `Create Assignment · ${lesson.lessonName}`
              : "Create New Assignment"
        }
        drawerOpen={open}
        onClose={requestClose}
        primaryButtonTitle="Cancel"
        secondaryButtonTitle={saving ? (editSelectedAssignment ? "Updating…" : "Creating…") : (editSelectedAssignment ? "Update Assignment" : "Create Assignment")}
        onClickPrimary={requestClose}
        customWidth={640}
        onClickSecondary={handleSubmit}
        disablePrimary={saving}
        disableSecondary={isUploading || saving || (!insideSyllabus && Boolean(coursesError))}
        buttonJustification="justify-content-end"
        showFooter
        footerClass="ln-comn-foot ln-assignment-drawer-footer"
      >
        <div className="ln-drawer-body">
          {contextHolder}
          {isEditing && assessmentDefinitionLocked && (
            <Alert
              type={assessmentLockState === "error" ? "warning" : "info"}
              showIcon
              style={{ marginBottom: 16 }}
              message={assessmentLockState === "error"
                ? "Could not verify learner submissions"
                : assessmentLockState === "loading"
                  ? "Checking learner submissions…"
                  : "Learner submissions exist"}
              description={assessmentLockState === "error"
                ? "Assessment-defining fields are locked for safety. You can still correct the assignment title."
                : assessmentLockState === "loading"
                  ? "Deadline, points, audience, resources and submission methods stay locked until this check finishes."
                  : "Deadline, points, audience, resources and submission methods are locked so submitted work is graded against the rules learners actually received. You can still correct the title."}
            />
          )}
          <Form form={form} layout="vertical" autoComplete="off" onValuesChange={() => setDirty(true)}>
            <div className="ln-com-drw">
              <h4 className="ln-lb2 mb-3">Assignment Details</h4>
              <Form.Item
                name="contentTitle"
                label={<label className="ln-lb2">Assignment Title</label>}
                rules={[{ required: true, message: "Enter assignment title", whitespace: true }]}
              >
                <Input className="ln-in2" placeholder="Assignment title" />
              </Form.Item>

              <div className="mb-4 position-relative">
                <label className="ln-lb2">Visibility</label>
                <Form.Item name="contentScope" initialValue="CLASS">
                  <Select
                    options={CONTENT_SCOPE_OPTIONS}
                    value={contentScope}
                    disabled={visibilityLocked}
                    onChange={(value) => { setContentScope(value); setDirty(true); }}
                  />
                </Form.Item>
                {visibilityLocked && (
                  <div className="text-muted small mt-1">
                    Only a college admin can change an assignment&apos;s visibility after it&apos;s created.
                  </div>
                )}
              </div>

              {!insideSyllabus && (
                <>
                  {coursesError && (
                    <Alert
                      type="error"
                      showIcon
                      style={{ marginBottom: 16 }}
                      message="Could not load courses"
                      description={coursesError}
                      action={<Button size="small" onClick={hydrateCourses}>Retry</Button>}
                    />
                  )}
                  <Form.Item
                    name="course"
                    label={<label className="ln-lb2">Course</label>}
                    rules={[{ required: true, message: "Select course" }]}
                  >
                    <Select
                      getPopupContainer={(triggerNode) => triggerNode.parentElement}
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      className="border-0"
                      placeholder={coursesLoading ? "Loading courses…" : coursesError ? "Courses unavailable" : "Select course"}
                      loading={coursesLoading}
                      disabled={courseLessonLocked || coursesLoading || Boolean(coursesError)}
                      onSelect={(value, option) => {
                        setFormParams((current) => ({
                          ...current,
                          course: option,
                          lesson: null,
                          classId: option?.clsid,
                        }));
                        fetchLessons(option?.clsid, option?.course_id, option?.course_slug ?? option?.courseSlug);
                        form.setFieldsValue({ course: value, lesson: undefined });
                      }}
                      options={courseOptionList}
                    />
                  </Form.Item>

                  {lessonsError && (
                    <Alert
                      type="warning"
                      showIcon
                      style={{ marginBottom: 16 }}
                      message="Could not load lessons"
                      description={lessonsError}
                      action={formParams?.course?.value ? (
                        <Button size="small" onClick={() => fetchLessons(formParams?.classId, formParams?.course?.value, formParams?.course?.course_slug ?? formParams?.course?.courseSlug)}>Retry</Button>
                      ) : null}
                    />
                  )}
                  <Form.Item
                    name="lesson"
                    label={<label className="ln-lb2">Lesson</label>}
                    rules={[{ required: true, message: "Select lesson" }]}
                  >
                    <Select
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      getPopupContainer={(triggerNode) => triggerNode.parentElement}
                      className="border-0"
                      placeholder={lessonsLoading ? "Loading lessons…" : lessonsError ? "Lessons unavailable" : "Select lesson"}
                      loading={lessonsLoading}
                      disabled={courseLessonLocked || lessonsLoading || Boolean(lessonsError)}
                      onSelect={(value, option) => {
                        setFormParams((current) => ({ ...current, lesson: option }));
                        form.setFieldsValue({ lesson: value });
                      }}
                      options={lessonOptionList}
                    />
                  </Form.Item>
                  {courseLessonLocked && (
                    <div className="text-muted small mb-3">
                      Course and lesson can&apos;t be changed once an assignment exists — create a new one instead.
                    </div>
                  )}
                </>
              )}

              <div className="row">
                <div className="col-md-6">
                  <Form.Item
                    name="points"
                    label={<label className="ln-lb2">Points</label>}
                    rules={[{
                      // Was free text: "abc", "-5" or "8.5" saved, and grading caps a score at this.
                      validator: (_, value) => {
                        if (value === undefined || value === null || String(value).trim() === "") return Promise.resolve();
                        const n = Number(value);
                        return Number.isInteger(n) && n >= 1 && n <= 1000
                          ? Promise.resolve()
                          : Promise.reject(new Error("Enter a whole number from 1 to 1000"));
                      },
                    }]}
                  >
                    <Input className="ln-in2" placeholder="Enter points" inputMode="numeric" disabled={assessmentDefinitionLocked} />
                  </Form.Item>
                </div>
                <div className="col-md-6">
                  <Form.Item
                    label={<label className="ln-lb2">Due Date</label>}
                    name="due_date"
                    rules={[
                      { type: "object", required: true, message: "Select due date" },
                      {
                        // The calendar's disabledDate only blocks picking a past day through the
                        // grid -- antd's DatePicker also accepts a typed date in the input, which
                        // bypasses that. A faculty-set due date before today isn't valid (per
                        // policy), so it's enforced again here as a real validation rule, not just
                        // a UI affordance. Skipped when the value is unchanged from what the
                        // assignment already had on load -- an assignment whose due date has simply
                        // passed since it was created must stay editable for everything else
                        // (fixing a typo, adding a resource) without being forced to also push the
                        // due date forward.
                        validator: (_, value) => {
                          const original = originalDueDateRef.current;
                          if (original && value?.isSame(original, "day")) return Promise.resolve();
                          return !value || !value.isBefore(dayjs().startOf("day"))
                            ? Promise.resolve()
                            : Promise.reject(new Error("Due date can't be before today"));
                        },
                      },
                    ]}
                  >
                    {/* With time, like the admin builder: the deadline is a moment, and a date-only
                        picker saved whatever time the old value (or now) happened to carry. */}
                    <DatePicker
                      disabled={assessmentDefinitionLocked}
                      showTime={{ format: "h:mm A" }}
                      format="DD MMM YYYY, h:mm A"
                      style={{ width: "100%" }}
                      disabledDate={(current) => current && current < dayjs().startOf("day")}
                    />
                  </Form.Item>
                </div>
              </div>

              <div className="mt-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
                  <div>
                    <h4 className="ln-lb2 mb-1">Assignment Resources</h4>
                    <p className="text-muted mb-0">Add the instructions, files, or links learners need to complete this assignment.</p>
                    <p className="text-muted mb-0">Instructions can be added once. PDF, file, and link resources can be added multiple times.</p>
                  </div>
                  {/* Was a bare 200px Select with no icon and the same visual weight as any other
                      form field -- easy to miss as "the way to add a resource," and the type
                      names alone (PDF vs File) gave no visual cue at a glance. Matches the same
                      icon-dropdown pattern used for adding lesson content (syllabus.js). */}
                  <Dropdown
                    trigger={["click"]}
                    disabled={assessmentDefinitionLocked || availableResourceTypeOptions.length === 0}
                    menu={{
                      items: availableResourceTypeOptions.map((option) => {
                        const Icon = RESOURCE_TYPE_ICONS[option.value] || FileOutlined;
                        return { key: option.value, label: option.label, icon: <Icon aria-hidden /> };
                      }),
                      onClick: ({ key }) => addResource(key),
                    }}
                  >
                    <Button icon={<PlusOutlined aria-hidden />}>Add resource</Button>
                  </Dropdown>
                </div>

                {resources.map((resource) => {
                  const ResourceIcon = RESOURCE_TYPE_ICONS[resource.type] || FileOutlined;
                  return (
                  <div key={resource.id} className="border rounded-3 p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <strong className="d-flex align-items-center gap-2">
                        <ResourceIcon aria-hidden className="text-muted" />
                        {resourceTypeOptions.find((option) => option.value === resource.type)?.label || "Resource"}
                      </strong>
                      <Button type="text" danger icon={<DeleteOutlined />} disabled={assessmentDefinitionLocked} onClick={() => removeResource(resource.id)}>
                        Remove
                      </Button>
                    </div>

                    <Input
                      className="ln-in2 mb-3"
                      placeholder={getResourceTitlePlaceholder(resource.type)}
                      value={resource.title}
                      disabled={assessmentDefinitionLocked}
                      onChange={(event) => updateResource(resource.id, { title: event.target.value })}
                    />

                    {resource.type === ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS && (
                      <div className="ln-editor-wraper" style={assessmentDefinitionLocked ? { pointerEvents: "none", opacity: 0.7 } : undefined}>
                        <Editor
                          editorContent={resource.text || ""}
                          setEditorContent={(value) => updateResource(resource.id, { text: value })}
                        />
                      </div>
                    )}

                    {resource.type === ASSIGNMENT_RESOURCE_TYPES.LINK && (
                      <Input
                        className="ln-in2"
                        prefix={<LinkOutlined />}
                        placeholder="Paste the reference link"
                        value={resource.link}
                        disabled={assessmentDefinitionLocked}
                        onChange={(event) => updateResource(resource.id, { link: event.target.value })}
                      />
                    )}

                    {[ASSIGNMENT_RESOURCE_TYPES.PDF, ASSIGNMENT_RESOURCE_TYPES.FILE].includes(resource.type) && (
                      resource?.file_dto?.original_name ? (
                        // Previously the two upload buttons stayed visible even after a file was
                        // attached, with just a small text line below them -- replacing a file
                        // meant deleting this whole resource card and re-adding it from scratch.
                        <div className="ln-upload-attached">
                          <ResourceIcon aria-hidden />
                          <span className="ln-upload-attached__name">{resource.file_dto.original_name}</span>
                          <Button
                            type="text"
                            size="small"
                            icon={<CloseCircleFilled aria-hidden />}
                            aria-label="Remove attached file"
                            disabled={assessmentDefinitionLocked}
                            onClick={() => updateResource(resource.id, { file_dto: createEmptyFileDTO() })}
                          />
                        </div>
                      ) : (
                        <div className="ln-upload">
                          <Upload
                            disabled={assessmentDefinitionLocked}
                            customRequest={dummyRequest}
                            maxCount={1}
                            showUploadList={false}
                            accept={resource.type === ASSIGNMENT_RESOURCE_TYPES.PDF ? ".pdf,application/pdf" : undefined}
                            beforeUpload={(file) => {
                              if (resource.type === ASSIGNMENT_RESOURCE_TYPES.PDF && file.type !== "application/pdf") {
                                messageApi.open({ type: "error", content: "Only PDF files are allowed here.", duration: 2 });
                                return Upload.LIST_IGNORE;
                              }
                              return true;
                            }}
                            onChange={(info) => {
                              const file = info?.file?.originFileObj;
                              if (info?.file?.status === "done" && file) {
                                uploadResourceFile(resource, file, resource.type === ASSIGNMENT_RESOURCE_TYPES.PDF);
                              }
                            }}
                          >
                            <Button
                              type="primary"
                              className="w-100 ant-custom-upload"
                              icon={<UploadOutlined />}
                              loading={uploadingResourceIds.includes(resource.id)}
                              disabled={assessmentDefinitionLocked}
                            >
                              {resource.type === ASSIGNMENT_RESOURCE_TYPES.PDF ? "Upload PDF" : "Upload File"}
                            </Button>
                          </Upload>
                          {/* Two stacked full-width buttons with no visual distinction read as
                              "do both" rather than "pick one" -- an explicit divider plus a
                              visually lighter second button makes the either/or relationship
                              unambiguous. */}
                          <div className="ln-upload-or">or</div>
                          <UploadFromLinkButton
                            folder="assignments"
                            type={resource.type === ASSIGNMENT_RESOURCE_TYPES.PDF ? "pdf" : "generic"}
                            onImported={(result) => {
                              updateResource(resource.id, {
                                title: resource.title || result?.originalName || "",
                                file_dto: {
                                  size: result?.size || 0,
                                  encoding: "",
                                  mimetype: resource.type === ASSIGNMENT_RESOURCE_TYPES.PDF ? "application/pdf" : "",
                                  field_name: "",
                                  original_name: result?.originalName || "",
                                  cloud_storage_object: result?.key || result?.publicUrl || "",
                                },
                              });
                            }}
                            buttonProps={{ className: "w-100", type: "default", disabled: assessmentDefinitionLocked }}
                          >
                            {resource.type === ASSIGNMENT_RESOURCE_TYPES.PDF ? "Upload PDF from Drive" : "Upload File from Drive"}
                          </UploadFromLinkButton>
                        </div>
                      )
                    )}
                  </div>
                  );
                })}
              </div>

              <div className="mt-4">
                <h4 className="ln-lb2 mb-1">How Learners Can Submit</h4>
                <p className="text-muted mb-3">Choose how learners are allowed to submit their work.</p>
                <Checkbox.Group
                  disabled={assessmentDefinitionLocked}
                  value={allowedSubmissionTypes}
                  onChange={(values) => { setAllowedSubmissionTypes(values); setDirty(true); }}
                  style={{ width: "100%" }}
                >
                  <div className="row g-2">
                    {submissionTypeOptions.map((option) => (
                      <div key={option.value} className="col-md-6">
                        <label className="border rounded-3 p-3 d-flex align-items-start gap-2 w-100 cursor-pointer">
                          <Checkbox value={option.value} />
                          <span>{option.label}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </Checkbox.Group>
              </div>
            </div>
          </Form>
        </div>
      </DrawerWidget>
    </>
  );
}


