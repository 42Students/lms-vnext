import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Alert, Form, Input, Button, Table, Card, Row, Col, message, Select, Switch, Tag, Space, Popconfirm, Modal, Upload, Image, Typography } from "antd";
import dayjs from "dayjs";
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, PictureOutlined, CopyOutlined } from "@ant-design/icons";
import AdminTableToolbar from "@/components/admin/AdminTableToolbar";
import useDependencyCounts from "@/components/admin/useDependencyCounts";
import CourseTakeawaysEditor from "@/components/admin/CourseTakeawaysEditor";
import { normalizeCourseTakeaways } from "@/utils/adminCourseTakeaways";
import { createCourse, getCoursesByCollege, getDepartmentsByCollege, getLessonsByCourse, updateCourse, deleteCourse, fetchWithErrorHandling, deleteFileFromR2, bulkUpdateCourseStatus } from "@/api/Services/AdminService";
import { uploadFileViaPresign, extractR2KeyFromUrl } from "@/utils/uploadToR2";
import PolicySettingField from "@/components/admin/PolicySettingField";
import { RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";
import { applyServerFieldErrors, getServerFormError } from "@/utils/formErrors";

const { Option } = Select;
const PAGE_SIZE_KEY = "admin-courses-page-size";
const PAGE_SIZES = [10, 25, 50, 100];
const metadataOf = (record) => record?.metaData ?? record?.meta_data ?? {};
const imageOf = (record) => {
  const md = metadataOf(record);
  return md.imageUrl || md.image_url || null;
};
const courseNameOf = (record) => record?.courseName || record?.course_name || "Untitled course";
const fieldSnapshot = (values, imageUrl) => JSON.stringify({
  ...values,
  takeaways: normalizeCourseTakeaways(values?.takeaways),
  courseStartDate: values?.courseStartDate ? dayjs(values.courseStartDate).format("YYYY-MM-DD") : null,
  courseEndDate: values?.courseEndDate ? dayjs(values.courseEndDate).format("YYYY-MM-DD") : null,
  imageUrl: imageUrl || null,
});

function CourseFormFields({ form, departments, courses, editingRecord, imageUrl, imageUploading, onUpload, onRemoveImage }) {
  const visible = Form.useWatch("active", form);
  return <>
    {/* Stored but not read by anything students see or by any server rule (parent course, dates,
        price, type, category, "listed"), or folded into "Visible to students" (enabled), are not
        rendered; saving merges the form store (which keeps them from the loaded record), so
        editing a course never wipes what is already saved. */}
    <Form.Item name="deptId" label="Department" rules={[{ required: true, message: "Select a department" }]}>
      <Select placeholder="Select department" showSearch optionFilterProp="children">
        {departments.map((department) => <Option key={department.id} value={department.id}>{department.name}</Option>)}
      </Select>
    </Form.Item>
    <Form.Item name="courseName" label="Course Name"
      rules={[{ required: true, whitespace: true, message: "Enter a course name" }, { max: 255, message: "Maximum 255 characters" }]}>
      <Input placeholder="e.g., Data Structures and Algorithms" />
    </Form.Item>
    <Row gutter={12}>
      <Col xs={24} sm={12}>
        <Form.Item name="shortTitle" label="Short display name" extra="A concise course title, such as DSA. The official course code is separate."
          rules={[{ required: true, whitespace: true, message: "Enter the short display name" }, { max: 64, message: "Maximum 64 characters" }]}>
          <Input placeholder="e.g., DSA" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item name="courseCode" label="Official course code"
          extra="Shown to learners as the course code; if blank, the short display name is used.">
          <Input placeholder="e.g., CS101" maxLength={40} />
        </Form.Item>
      </Col>
    </Row>
    <Form.Item name="introductionContent" label="In this Course – Heading"
      rules={[{ required: true, whitespace: true, message: "Enter the heading" }, { max: 255, message: "Maximum 255 characters" }]}>
      <Input placeholder="e.g., What you'll learn" />
    </Form.Item>
    <Form.Item name="description" label="In this Course – Description"
      rules={[{ required: true, whitespace: true, message: "Enter the course description" }]}>
      <Input.TextArea rows={3} placeholder="Introduction shown on the course home page" />
    </Form.Item>
    <Form.Item name="takeaways" label="In this Course – Takeaways"
      tooltip="Ordered points displayed as a bullet list on the course home page.">
      <CourseTakeawaysEditor />
    </Form.Item>
    <Form.Item label="Course Image">
      <Space align="start" wrap>
        {imageUrl && <Image src={imageUrl} alt="Course preview" width={100}
          style={{ borderRadius: 8, objectFit: "cover" }} />}
        <Upload accept="image/*" showUploadList={false} beforeUpload={onUpload} disabled={imageUploading}>
          <Button icon={<UploadOutlined />} loading={imageUploading}>{imageUrl ? "Change Image" : "Upload Image"}</Button>
        </Upload>
        {imageUrl && <Button type="text" danger size="small" onClick={onRemoveImage}>Remove image</Button>}
      </Space>
    </Form.Item>
    <Form.Item name="courseColor" label="Card colour" extra="Used for this course on calendars."
      rules={[{ pattern: /^$|^#[0-9a-fA-F]{6}$/, message: "Use a colour like #0a7c88" }]}>
      <Input type="color" style={{ width: 80, padding: 2 }} />
    </Form.Item>
    <Form.Item name="active" label="Visible to students" valuePropName="checked"
      extra="Off hides the course and its lessons, quizzes and content from students; nothing is deleted.">
      <Switch aria-label="Course visible to students" />
    </Form.Item>
    {visible === false ? <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="Hidden from students" description="Students won't see this course until it is made visible again." /> : null}
  </>;
}

const Courses = ({ collegeId }) => {
  const router = useRouter();
  const basePath = router.pathname.startsWith("/superadmin") ? "/superadmin" : "/college-admin";
  const isScoped = collegeId != null && Number.isFinite(Number(collegeId)) && Number(collegeId) > 0;
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const createSubmitRef = useRef(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [data, setData] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loadedScopeKey, setLoadedScopeKey] = useState(null);
  // Read through a ref inside the fetch callback: as a dependency it rebuilt the callback after every load and
  // re-ran the effects that call it (a duplicate request, plus their resets).
  const loadedScopeKeyRef = useRef(loadedScopeKey);
  loadedScopeKeyRef.current = loadedScopeKey;
  const [errorScopeKey, setErrorScopeKey] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [departmentError, setDepartmentError] = useState("");
  const [departmentLoading, setDepartmentLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const editSubmitRef = useRef(false);
  const [courseImageUrl, setCourseImageUrl] = useState(null);
  const [editCourseImageUrl, setEditCourseImageUrl] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [search, setSearch] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState(null);
  const bulkRef = useRef(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const deleteRef = useRef(null);
  const [duplicating, setDuplicating] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const createFormRef = useRef(null);
  const editSnapshotRef = useRef(null);
  const fetchSeq = useRef(0);
  const departmentsSeq = useRef(0);
  const courseScopeKey = isScoped ? String(Number(collegeId)) : null;
  const hasCurrentCourses = courseScopeKey != null && loadedScopeKey === courseScopeKey;
  const currentLoadError = errorScopeKey === courseScopeKey ? loadError : "";
  const initialTableLoading = Boolean(courseScopeKey && tableLoading && !hasCurrentCourses && !currentLoadError);
  const tableRefreshing = Boolean(courseScopeKey && tableLoading && hasCurrentCourses);

  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(PAGE_SIZE_KEY));
      if (PAGE_SIZES.includes(saved)) setPageSize(saved);
    } catch (_) { /* Optional preference */ }
  }, []);

  const fetchData = useCallback(async () => {
    const request = ++fetchSeq.current;
    const requestScopeKey = courseScopeKey;
    if (!isScoped || !requestScopeKey) {
      setData([]); setLoadedScopeKey(null); setErrorScopeKey(null); setLoadError(""); setTableLoading(false); return;
    }
    const scopeChanged = loadedScopeKeyRef.current !== requestScopeKey;
    if (scopeChanged) {
      setData([]);
      setSelectedCourseIds([]);
    }
    setTableLoading(true);
    setLoadError("");
    setErrorScopeKey(null);
    try {
      const result = await fetchWithErrorHandling(getCoursesByCollege(collegeId));
      if (request !== fetchSeq.current) return;
      if (!result.success) throw new Error(result.message || "Could not load courses");
      setData(Array.isArray(result.data) ? result.data : []);
      setLoadedScopeKey(requestScopeKey);
    } catch (error) {
      if (request !== fetchSeq.current) return;
      setLoadError(error?.message || "Could not load courses");
      setErrorScopeKey(requestScopeKey);
      if (scopeChanged) setData([]);
    } finally { if (request === fetchSeq.current) setTableLoading(false); }
  }, [collegeId, isScoped, courseScopeKey]);

  const fetchDepartments = useCallback(async () => {
    const request = ++departmentsSeq.current;
    if (!isScoped) { setDepartments([]); setDepartmentError(""); setDepartmentLoading(false); return; }
    setDepartmentLoading(true);
    setDepartmentError("");
    try {
      const result = await fetchWithErrorHandling(getDepartmentsByCollege(collegeId));
      if (request !== departmentsSeq.current) return;
      if (!result.success) throw new Error(result.message || "Could not load departments");
      setDepartments(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      if (request !== departmentsSeq.current) return;
      setDepartments([]);
      setDepartmentError(error?.message || "Could not load departments");
    } finally { if (request === departmentsSeq.current) setDepartmentLoading(false); }
  }, [collegeId, isScoped]);

  const imageUploadSeq = useRef(0);
  useEffect(() => {
    setData([]); setDepartments([]); setSearch(""); setSelectedCourseIds([]); setPage(1);
    setDuplicating(null); form.resetFields();
    setCreateError(null); setEditError(null);
    // BE-0125: the last college's course image and edit dialog don't carry over; a running upload is ignored.
    ++imageUploadSeq.current;
    setCourseImageUrl(null); setEditCourseImageUrl(null);
    setEditModalVisible(false); setEditingRecord(null); editForm.resetFields();
    createSubmitRef.current = false; editSubmitRef.current = false;
    fetchData(); fetchDepartments();
    return () => { ++fetchSeq.current; ++departmentsSeq.current; };
  }, [collegeId, fetchData, fetchDepartments, form, editForm]);

  const handleImageUpload = async (file, isEdit = false) => {
    const upload = ++imageUploadSeq.current;
    setImageUploading(true);
    try {
      const result = await uploadFileViaPresign(file, { folder: "course-images", type: "image" });
      if (upload !== imageUploadSeq.current) return false; // the college changed (or a newer image was picked)
      if (isEdit) setEditCourseImageUrl(result.publicUrl);
      else setCourseImageUrl(result.publicUrl);
      message.success("Image uploaded successfully");
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to upload image");
    } finally { setImageUploading(false); }
    return false;
  };

  const buildPayload = (values, imageUrl) => ({
    course_name: String(values.courseName ?? "").trim(),
    short_title: String(values.shortTitle ?? "").trim(),
    dept_id: values.deptId,
    parent_course_id: values.parentCourseId ?? 0,
    // active and enabled are always checked together by every learner query, so one switch sets both.
    active: values.active !== false,
    enabled: values.active !== false,
    allowedForDisplay: values.allowedForDisplay === false ? 0 : 1,
    meta_data: {
      image_url: imageUrl || "",
      image_url_lp: imageUrl || "",
      introduction_content: String(values.introductionContent ?? "").trim(),
      html_content: String(values.description ?? "").trim(),
      takeaways: normalizeCourseTakeaways(values.takeaways),
      course_type: String(values.courseType ?? "").trim(),
      course_category: String(values.courseCategory ?? "").trim(),
      course_code: String(values.courseCode ?? "").trim(),
      course_color: String(values.courseColor ?? "").trim(),
      course_start_date: values.courseStartDate ? dayjs(values.courseStartDate).format("YYYY-MM-DD") : "",
      course_end_date: values.courseEndDate ? dayjs(values.courseEndDate).format("YYYY-MM-DD") : "",
      // Backend's integer merge treats undefined as "preserve". Clearing is rejected inline on edit.
      amount: values.amount ?? undefined,
    },
  });

  const handleSubmit = async (values) => {
    if (createSubmitRef.current || loading) return;
    if (!isScoped) { message.warning("Select a college first."); return; }
    createSubmitRef.current = true;
    setCreateError(null);
    setLoading(true);
    try {
      await createCourse(buildPayload({ ...form.getFieldsValue(true), ...values }, courseImageUrl));
      message.success(`Created course “${values.courseName.trim()}”. Next, add lessons and map it to the right semester.`);
      const department = values.deptId;
      form.resetFields();
      form.setFieldsValue({ deptId: department, takeaways: [], active: true, enabled: true, allowedForDisplay: true });
      setCourseImageUrl(null); setDuplicating(null);
      fetchData();
    } catch (error) {
      const fieldError = applyServerFieldErrors(form, error, {
        course_name: "courseName", short_title: "shortTitle", dept_id: "deptId",
        parent_course_id: "parentCourseId",
      });
      const errorMessage = getServerFormError(error, "Failed to create course.");
      setCreateError(errorMessage);
      if (!fieldError) message.error(errorMessage);
    } finally {
      createSubmitRef.current = false;
      setLoading(false);
    }
  };

  const valuesFromRecord = (record, duplicate = false) => {
    const md = metadataOf(record);
    return {
      courseName: duplicate ? `${courseNameOf(record)} (Copy)` : courseNameOf(record),
      shortTitle: record.shortTitle || record.short_title,
      deptId: record.deptId ?? record.dept_id,
      parentCourseId: record.parentCourseId ?? record.parent_course_id ?? undefined,
      active: record.active !== false,
      enabled: record.enabled !== false,
      allowedForDisplay: (record.allowedForDisplay ?? record.allowed_for_display) !== 0,
      introductionContent: md.introduction_content ?? md.introductionContent ?? "",
      description: md.htmlContent ?? md.html_content ?? "",
      takeaways: normalizeCourseTakeaways(md.takeaways),
      courseType: md.courseType ?? md.course_type ?? "",
      courseCategory: md.courseCategory ?? md.course_category ?? "",
      courseCode: md.courseCode ?? md.course_code ?? "",
      courseColor: md.courseColor ?? md.course_color ?? "",
      courseStartDate: duplicate ? null : (md.courseStartDate || md.course_start_date) ? dayjs(md.courseStartDate || md.course_start_date) : null,
      courseEndDate: duplicate ? null : (md.courseEndDate || md.course_end_date) ? dayjs(md.courseEndDate || md.course_end_date) : null,
      amount: md.amount ?? undefined,
    };
  };

  const handleDuplicate = (record) => {
    if (!isScoped) return;
    form.resetFields();
    form.setFieldsValue(valuesFromRecord(record, true));
    setCourseImageUrl(imageOf(record));
    setDuplicating(record);
    message.info(`Duplicating “${courseNameOf(record)}” — review the copy before creating it.`);
    requestAnimationFrame(() => {
      createFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      createFormRef.current?.querySelector("input")?.focus({ preventScroll: true });
    });
  };

  const cancelDuplicate = () => {
    setDuplicating(null); setCourseImageUrl(null);
    form.resetFields(); form.setFieldsValue({ takeaways: [], active: true, enabled: true, allowedForDisplay: true });
  };

  const handleEdit = (record) => {
    if (!isScoped) return;
    setEditError(null);
    editSubmitRef.current = false;
    setEditingRecord(record);
    const values = valuesFromRecord(record);
    editForm.resetFields(); editForm.setFieldsValue(values);
    const imageUrl = imageOf(record);
    setEditCourseImageUrl(imageUrl);
    editSnapshotRef.current = fieldSnapshot(values, imageUrl);
    setEditModalVisible(true);
  };

  const finishEditClose = () => {
    setEditModalVisible(false); setEditingRecord(null); setEditCourseImageUrl(null);
    editSnapshotRef.current = null; editForm.resetFields();
  };

  const handleEditCancel = () => {
    if (editSubmitRef.current || editLoading || imageUploading) {
      message.info("Wait for the course save or image upload to finish.");
      return;
    }
    if (!editingRecord || fieldSnapshot(editForm.getFieldsValue(true), editCourseImageUrl) === editSnapshotRef.current) {
      finishEditClose(); return;
    }
    Modal.confirm({ title: "Discard unsaved course changes?",
      content: `Your edits to “${courseNameOf(editingRecord)}” will be lost.`,
      okText: "Discard changes", okButtonProps: { danger: true }, onOk: finishEditClose });
  };

  const handleEditSubmit = async () => {
    if (editSubmitRef.current || editLoading) return;
    editSubmitRef.current = true;
    setEditError(null);
    try {
      const values = await editForm.validateFields();
      if (!editingRecord) return;
      setEditLoading(true);
      const oldImageUrl = imageOf(editingRecord);
      await updateCourse(editingRecord.id, buildPayload({ ...editForm.getFieldsValue(true), ...values }, editCourseImageUrl));
      message.success(`Updated course “${values.courseName.trim()}”.`);
      if (oldImageUrl && editCourseImageUrl && oldImageUrl !== editCourseImageUrl) {
        const key = extractR2KeyFromUrl(oldImageUrl);
        if (key) deleteFileFromR2(key).catch(() => {});
      }
      finishEditClose(); fetchData();
    } catch (error) {
      if (!error?.errorFields) {
        const fieldError = applyServerFieldErrors(editForm, error, {
          course_name: "courseName", short_title: "shortTitle", dept_id: "deptId",
          parent_course_id: "parentCourseId",
        });
        const errorMessage = getServerFormError(error, "Failed to update course.");
        setEditError(errorMessage);
        if (!fieldError) message.error(errorMessage);
      }
    } finally {
      editSubmitRef.current = false;
      setEditLoading(false);
    }
  };

  const handleDelete = async (record, rejectOnFailure = true) => {
    if (!isScoped || deleteRef.current != null) return false;
    deleteRef.current = record.id;
    setDeletingId(record.id);
    setDeleteError(null);
    try {
      await deleteCourse(record.id);
      message.success(`Deleted course “${courseNameOf(record)}”.`);
      fetchData();
      return true;
    } catch (error) {
      const errorMessage = "Failed to delete course: " + (error?.response?.data?.message || error?.message || "Unknown error");
      setDeleteError({ record, message: errorMessage });
      if (rejectOnFailure) throw error;
      return false;
    } finally {
      deleteRef.current = null;
      setDeletingId(null);
    }
  };

  const filteredData = data.filter((record) => {
    const query = search.trim().toLowerCase();
    return !query || [record.courseName, record.course_name, record.shortTitle, record.short_title, metadataOf(record).course_code]
      .some((value) => String(value ?? "").toLowerCase().includes(query));
  });

  const runBulk = async (changes, label, rejectOnFailure = false) => {
    if (selectedCourseIds.length === 0 || bulkRef.current) return false;
    const ids = [...selectedCourseIds];
    bulkRef.current = true;
    setBulkBusy(true);
    setBulkError(null);
    try {
      const res = await bulkUpdateCourseStatus({ courseIds: ids, ...changes });
      const result = res?.data?.data ?? res?.data ?? {};
      const failed = Array.isArray(result.failed) ? result.failed : [];
      if (failed.length) {
        const failedIds = failed.map((failure) => failure.courseId).filter((id) => id != null);
        setSelectedCourseIds(failedIds);
        setBulkError({
          changes,
          label,
          failed,
          message: `${result.updatedCount ?? 0} of ${result.requested ?? ids.length} updated. Retry will target only the failed courses.`,
        });
      } else {
        setSelectedCourseIds([]);
        message.success(`${label}: ${result.updatedCount ?? ids.length} course(s) updated`);
      }
      fetchData();
      return failed.length === 0;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || `Failed to ${label.toLowerCase()}`;
      setBulkError({ changes, label, failed: [], message: errorMessage });
      if (rejectOnFailure) throw error;
      return false;
    } finally {
      bulkRef.current = false;
      setBulkBusy(false);
    }
  };

  // BE-0128: lesson counts only for the courses on screen, a few at a time.
  const visibleCourses = filteredData.slice((page - 1) * pageSize, page * pageSize);
  const dependencyCounts = useDependencyCounts(visibleCourses, {
    lessons: (record) => getLessonsByCourse(record.id),
  }, { resetKey: collegeId });

  const confirmBulk = (changes, label, danger = false) => {
    const targets = data.filter((record) => selectedCourseIds.includes(record.id));
    Modal.confirm({
      title: `${label} ${selectedCourseIds.length} selected course(s)?`,
      content: <div>
        <p>Applies to selected courses across the current college, including selected rows on other pages.</p>
        <p>{targets.slice(0, 5).map(courseNameOf).join(", ")}{targets.length > 5 ? ` and ${targets.length - 5} more` : ""}</p>
      </div>,
      okText: label, okButtonProps: { danger }, onOk: () => runBulk(changes, label, true),
    });
  };

  const columns = [
    { title: "Image", key: "image", width: 70, render: (_, record) => imageOf(record)
      ? <Image src={imageOf(record)} alt={`${courseNameOf(record)} cover`} width={50} height={35} style={{ objectFit: "cover", borderRadius: 4 }} />
      : <div style={{ width: 50, height: 35, background: "#f0f0f0", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <PictureOutlined style={{ color: "#999" }} />
      </div> },
    // The course page (home + syllabus) was reachable only through the header search box.
    // Superadmin has no course page, so only the college-admin list links.
    { title: "Course Name", key: "courseName", render: (_, record) => basePath === "/college-admin"
      ? <Link href={`/college-admin/courses/${encodeURIComponent(record.slug || record.id)}`}>{courseNameOf(record)}</Link>
      : courseNameOf(record) },
    { title: "Short Title", key: "shortTitle", render: (_, record) => record.shortTitle || record.short_title || "—" },
    { title: "Department", key: "deptId", render: (_, record) => {
      const id = record.deptId ?? record.dept_id;
      return departments.find((department) => Number(department.id) === Number(id))?.name || `Department name unavailable (ID ${id ?? "unknown"})`;
    } },
    { title: "Students see it", key: "status", width: 120, render: (_, record) =>
      record.active !== false && record.enabled !== false ? <Tag color="green">Visible</Tag> : <Tag>Hidden</Tag> },
    { title: "Dependencies", key: "dependencies", width: 150, render: (_, record) => {
      const count = dependencyCounts[record.id]?.lessons;
      if (count == null) return <Tag>Lessons: unavailable</Tag>;
      return <Tag color={count > 0 ? "blue" : "default"}>{count} {count === 1 ? "lesson" : "lessons"}</Tag>;
    } },
    { title: "Actions", key: "actions", width: 220, render: (_, record) => {
      const lessonCount = dependencyCounts[record.id]?.lessons;
      const blocked = typeof lessonCount === "number" && lessonCount > 0;
      const blockerText = blocked
        ? `Remove ${lessonCount} linked lesson${lessonCount === 1 ? "" : "s"} before deleting.`
        : lessonCount == null
          ? "Linked lessons could not be verified. The server will perform the final dependency check."
          : "";
      return <Space size="small" wrap>
        <Button size="small" icon={<EditOutlined />} aria-label={`Edit course ${courseNameOf(record)}`}
          onClick={() => handleEdit(record)} disabled={deletingId != null}>Edit</Button>
        <Button size="small" icon={<CopyOutlined />} aria-label={`Duplicate course ${courseNameOf(record)}`}
          onClick={() => handleDuplicate(record)} disabled={deletingId != null}>Duplicate</Button>
        <span title={blockerText}>
          <Popconfirm title={`Delete “${courseNameOf(record)}”?`}
            description="Deletion is blocked while lessons or lesson content are linked. The server performs the final dependency check."
            onConfirm={() => handleDelete(record)} okText="Delete" cancelText="Cancel"
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
            disabled={blocked || (deletingId != null && deletingId !== record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} loading={deletingId === record.id}
              disabled={blocked || (deletingId != null && deletingId !== record.id)}
              aria-label={`Delete course ${courseNameOf(record)}`}>Delete</Button>
          </Popconfirm>
        </span>
      </Space>;
    } },
  ];

  const departmentNotice = departmentError ? <Alert type="error" showIcon message="Departments could not be loaded"
    description={departmentError} action={<Button size="small" onClick={fetchDepartments}>Retry</Button>}
    style={{ marginBottom: 12 }} /> : isScoped && !departmentLoading && departments.length === 0
    ? <Alert type="info" showIcon message="No departments in this college yet"
      description={<span>Create a department before creating a course. <Link href={`${basePath}/departments`}>Go to Departments</Link>.</span>}
      style={{ marginBottom: 12 }} /> : null;

  return <>
    {!isScoped && <Alert type="warning" showIcon message="Select a college to manage Courses"
      description="Courses are college-scoped. Choose a college in the header." style={{ marginBottom: 16 }} />}
    <h1 className="admin-list-page__title">Courses</h1>
    {!isScoped && basePath === "/superadmin" && <Card size="small" title="Progress policy" style={{ marginBottom: 16 }}>
      <Typography.Paragraph type="secondary">Platform-wide setting, available in unscoped Super Admin mode.</Typography.Paragraph>
      <PolicySettingField scopeType="GLOBAL" settingKey="course.minInProgressPercent"
        label="In progress lower bound" help="Below this percentage a video counts as not started."
        defaultValue={5} min={0} max={99} suffix="%" />
    </Card>}
    {isScoped && <Row gutter={24}>
      <Col xs={24} lg={10}>
        <div ref={createFormRef}>
          <Card title="Create New Course" size="small">
            {duplicating && <Alert type="info" showIcon style={{ marginBottom: 12 }}
              message={`Duplicating “${courseNameOf(duplicating)}”`}
              description="Review the copied fields and create a new course. The original course will not be changed."
              action={<Button size="small" onClick={cancelDuplicate}>Cancel copy</Button>} />}
            {departmentNotice}
            {createError ? (
              <Alert type="error" showIcon closable message="Course was not created" description={createError}
                onClose={() => setCreateError(null)} style={{ marginBottom: 12 }} />
            ) : null}
            <Form form={form} layout="vertical" onFinish={handleSubmit} disabled={loading}
              initialValues={{ takeaways: [], active: true, enabled: true, allowedForDisplay: true }}>
              <CourseFormFields form={form} departments={departments} courses={data} editingRecord={null}
                imageUrl={courseImageUrl} imageUploading={imageUploading}
                onUpload={(file) => handleImageUpload(file, false)} onRemoveImage={() => setCourseImageUrl(null)} />
              <Form.Item><Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}
                disabled={departmentLoading || Boolean(departmentError) || departments.length === 0 || imageUploading}>Create Course</Button></Form.Item>
            </Form>
          </Card>
        </div>
      </Col>
      <Col xs={24} lg={14}>
        <Card title="Existing Courses" size="small" extra={<AdminTableToolbar searchValue={search}
          onSearch={(value) => { setSearch(value); setPage(1); setSelectedCourseIds([]); }}
          resultCount={filteredData.length} totalCount={data.length} searchPlaceholder="Search courses"
          onRefresh={fetchData} loading={tableLoading} exportFileName="courses.csv"
          exportRows={() => filteredData.map((record) => ({
            id: record.id, courseName: courseNameOf(record), shortTitle: record.shortTitle ?? record.short_title ?? "",
            departmentId: record.deptId ?? record.dept_id ?? "", active: record.active === false ? "no" : "yes",
            enabled: record.enabled === false ? "no" : "yes",
            visibleToLearners: (record.allowedForDisplay ?? record.allowed_for_display) === 0 ? "no" : "yes",
          }))} />}>
          {deleteError ? (
            <Alert type="error" showIcon closable message="Course was not deleted" description={deleteError.message}
              action={<Button size="small" onClick={() => handleDelete(deleteError.record, false)} disabled={deletingId != null}>Retry delete</Button>}
              onClose={() => setDeleteError(null)} style={{ marginBottom: 12 }} />
          ) : null}
          {bulkError ? (
            <Alert
              type="warning"
              showIcon
              closable
              message={`${bulkError.label} was only partially completed`}
              description={<div>
                <div>{bulkError.message}</div>
                {bulkError.failed.slice(0, 5).map((failure) => (
                  <div key={failure.courseId}>
                    {courseNameOf(data.find((item) => item.id === failure.courseId) || { courseName: `Course #${failure.courseId}` })}: {failure.reason || "Update failed"}
                  </div>
                ))}
              </div>}
              action={<Button size="small" onClick={() => runBulk(bulkError.changes, bulkError.label, false)} disabled={bulkBusy || selectedCourseIds.length === 0}>Retry failed</Button>}
              onClose={() => setBulkError(null)}
              style={{ marginBottom: 12 }}
            />
          ) : null}
          {selectedCourseIds.length > 0 && <div style={{ marginBottom: 12 }}>
            <Typography.Text strong>{selectedCourseIds.length} selected across the current college and loaded pages</Typography.Text>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 6 }}>Selection is cleared when search or college changes.</Typography.Paragraph>
            <Space wrap>
              {/* "Show/Hide to learners" used to set allowedForDisplay, which nothing reads: a hidden
                  course stayed visible. Visibility is active + enabled, always checked together. */}
              <Button size="small" loading={bulkBusy} onClick={() => confirmBulk({ active: true, enabled: true }, "Show to students")}>Show to students</Button>
              <Button size="small" loading={bulkBusy} onClick={() => confirmBulk({ active: false, enabled: false }, "Hide from students", true)}>Hide from students</Button>
              <Button size="small" type="link" disabled={bulkBusy} onClick={() => setSelectedCourseIds([])}>Clear selection</Button>
            </Space>
          </div>}
          {tableRefreshing ? <RefreshStatus label="Refreshing courses…" /> : null}
          {currentLoadError && <Alert type={hasCurrentCourses ? "warning" : "error"} showIcon
            message={hasCurrentCourses ? "Couldn't refresh courses" : "Could not load courses"}
            description={hasCurrentCourses ? "Showing the last courses loaded for this college." : currentLoadError}
            action={<Button size="small" onClick={fetchData}>Retry</Button>} style={{ marginBottom: 12 }} />}
          {initialTableLoading ? (
            <TableSkeleton rows={8} columns={7} label="Loading courses" />
          ) : currentLoadError && !hasCurrentCourses ? null : (
          <Table dataSource={filteredData} columns={columns} rowKey="id"
            rowSelection={{
              selectedRowKeys: selectedCourseIds, onChange: setSelectedCourseIds,
              // Without this, selecting courses on one page, then filtering/paging away and
              // back, silently drops the earlier selection — inconsistent with Students.js,
              // which already opts in to preserving selection across paging.
              preserveSelectedRowKeys: true,
            }}
            size="small" scroll={{ x: "max-content" }}
            pagination={{ current: page, pageSize, pageSizeOptions: PAGE_SIZES, showSizeChanger: true,
              onChange: (nextPage, nextSize) => {
                setPage(nextSize !== pageSize ? 1 : nextPage); setPageSize(nextSize);
                try { window.localStorage.setItem(PAGE_SIZE_KEY, String(nextSize)); } catch (_) { /* Optional */ }
              }, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}` }}
            locale={{ emptyText: loadError ? "Could not load courses. Use Retry above." : search.trim()
              ? "No matching courses. Clear search to see all." : departments.length === 0
              ? "No courses yet. Create a department first." : "No courses yet. Use Create New Course to begin." }} />
          )}
        </Card>
      </Col>
    </Row>}
    <Modal title={editingRecord ? `Edit “${courseNameOf(editingRecord)}”` : "Edit Course"}
      open={editModalVisible} onOk={handleEditSubmit} onCancel={handleEditCancel}
      confirmLoading={editLoading} okButtonProps={{ disabled: imageUploading || Boolean(departmentError) || editLoading }}
      cancelButtonProps={{ disabled: editLoading || imageUploading }}
      okText="Save Changes" cancelText="Cancel" width={660}
      maskClosable={false} closable={!editLoading && !imageUploading} keyboard={!editLoading && !imageUploading}
      className="admin-list-page-modal">
      {departmentNotice}
      {editError ? (
        <Alert type="error" showIcon closable message="Course changes were not saved" description={editError}
          onClose={() => setEditError(null)} style={{ marginBottom: 12 }} />
      ) : null}
      <Form form={editForm} layout="vertical" onFinish={handleEditSubmit} disabled={editLoading}>
        <CourseFormFields form={editForm} departments={departments} courses={data} editingRecord={editingRecord}
          imageUrl={editCourseImageUrl} imageUploading={imageUploading}
          onUpload={(file) => handleImageUpload(file, true)} onRemoveImage={() => setEditCourseImageUrl(null)} />
      </Form>
    </Modal>
  </>;
};

export default Courses;
