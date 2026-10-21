import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Form, Input, Button, Table, Card, Row, Col, message, Select, InputNumber, Switch, Alert, Upload, Progress, Modal, Space, Popconfirm, Tag, DatePicker, TimePicker, Radio } from "antd";
import { PlusOutlined, FileOutlined, VideoCameraOutlined, InboxOutlined, YoutubeOutlined, EditOutlined, DeleteOutlined, LinkOutlined, HolderOutlined } from "@ant-design/icons";
import AdminTableToolbar from "@/components/admin/AdminTableToolbar";
import { createLessonContent, getLessonContents, getLessonsByCourse, getCoursesByCollege, getFacultyByCollegeId, fetchWithErrorHandling, updateLessonContent, deleteLessonContent, deleteFileFromR2, importVideoFromUrl, validateVideoUrl, updateClassContentOrder, getFileUrl } from "@/api/Services/AdminService";
import { getLessonContent } from "@/api/Services/courseServices";
import { getClassesForCourseSyllabus } from "@/api/Services/adminServices/departmentService";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { uploadFileViaPresign, extractR2KeyFromUrl } from "@/utils/uploadToR2";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useRouter } from "next/router";

// The deadline DatePickers below use a non-default format ("YYYY-MM-DD HH:mm"); without this
// plugin AntD falls back to native Date parsing of that custom format, which fails and shows the
// input as literally "Invalid Date" the moment a deadline is picked.
dayjs.extend(customParseFormat);

const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

// Content types that require file upload
const FILE_UPLOAD_TYPES = ["VIDEO"];
// Content types that require URL input (external links)
const URL_INPUT_TYPES = ["YOUTUBE"];
// Content types that are a scheduled live class (manual meeting link).
const MEET_TYPES = ["LIVE_CLASS", "live class"];

const VALUE_GENERIC = 0;

// Sortable row for drag-and-drop when class is selected
const SortableTableRow = ({ children, ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props["data-row-key"],
  });
  const style = {
    ...props.style,
    transform: CSS.Transform.toString(
      transform && { ...transform, scaleY: 1 }
    ),
    transition,
    ...(isDragging ? { position: "relative", zIndex: 9999 } : {}),
  };
  return (
    <tr {...props} ref={setNodeRef} style={style}>
      {React.Children.map(children, (child) => {
        if (child?.key === "sort") {
          return React.cloneElement(child, {
            children: (
              // BE-0171: the handle is the keyboard target too: Tab to it, Space to pick up, arrows to move, Space to drop.
              <HolderOutlined
                ref={setActivatorNodeRef}
                style={{ touchAction: "none", cursor: "move", fontSize: 14 }}
                {...attributes}
                aria-label="Reorder: press Space to pick up, arrow keys to move, Space to drop"
                {...listeners}
              />
            ),
          });
        }
        return child;
      })}
    </tr>
  );
};

// ASSIGNMENT/QUIZ removed from this list entirely (2026-08) — they now have their own dedicated
// admin tabs (Assignments.js/Quizzes.js, reachable from the same "Courses & Content" group) that
// write through their proper backends (grading endpoints / quizzes table) instead of this page's
// generic lesson_contents form, which only ever had a "configure separately" placeholder for them.
const contentTypes = [
  { value: "VIDEO", label: "Video (Upload)", icon: <VideoCameraOutlined />, hint: "Upload MP4, WebM, MOV" },
  { value: "YOUTUBE", label: "YouTube Video", icon: <YoutubeOutlined />, hint: "Enter YouTube URL" },
  { value: "LIVE_CLASS", label: "Live Class", icon: <VideoCameraOutlined />, hint: "Schedule a live class with a meeting link" },
];

// This page serves the Video and Live Classes tabs of the "content" nav group (see
// navGroupDefinitions.js), each a ?type= filter over the same form. The Resources tab is
// AdminResources, rendered by pages/superadmin/lesson-content.js instead of this component.
const CONTENT_TYPE_TABS = {
  video: ["VIDEO", "YOUTUBE"],
  "live-classes": ["LIVE_CLASS"],
};
const DEFAULT_CONTENT_TAB = "video";

const TAB_COPY = {
  video: { title: "Videos", help: "Upload a video or link a YouTube video to a lesson." },
  "live-classes": { title: "Live classes", help: "Schedule a live class with a meeting link on a lesson." },
};

// showPlatformPolicy: the video policy is platform-wide, so only Superadmin sees it.
const LessonContent = ({ collegeId = null, showPlatformPolicy = true }) => {
  const isScoped = collegeId != null && Number.isFinite(Number(collegeId)) && Number(collegeId) > 0;
  const router = useRouter();
  const contentTab = CONTENT_TYPE_TABS[router.query?.type] ? router.query.type : DEFAULT_CONTENT_TAB;
  const allowedTypesForTab = CONTENT_TYPE_TABS[contentTab];
  // Only the create/edit dropdowns get scoped to the active tab's types — ASSIGNMENT/QUIZ are
  // already gone from `contentTypes` entirely (see its own comment above).
  const tabContentTypes = useMemo(
    () => contentTypes.filter((t) => allowedTypesForTab.includes(t.value)),
    [allowedTypesForTab]
  );
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [data, setData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonsError, setLessonsError] = useState(null);
  const [faculty, setFaculty] = useState([]);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [facultyError, setFacultyError] = useState(null);
  const [contentsError, setContentsError] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [selectedContentType, setSelectedContentType] = useState(null);
  const [selectedClassIdForView, setSelectedClassIdForView] = useState(VALUE_GENERIC);
  const [classesForCourse, setClassesForCourse] = useState({});
  const [reviewClassesForCourse, setReviewClassesForCourse] = useState({});
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState(null);
  
  // Edit modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [editDirty, setEditDirty] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState(null);
  
  // File upload states
  const [fileList, setFileList] = useState([]);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [uploadedFileInfo, setUploadedFileInfo] = useState(null);
  // BE-0169: which form an upload belongs to ("new", or the id of the item being edited). Create and Edit shared one upload,
  // so a file uploaded for a new item could be saved onto an unrelated item being edited (and replace its media).
  const [uploadTarget, setUploadTarget] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Import video from URL (VIDEO type only)
  const [videoImportUrl, setVideoImportUrl] = useState("");
  const [validatingFromUrl, setValidatingFromUrl] = useState(false);
  const [importingFromUrl, setImportingFromUrl] = useState(false);
  
  // Determine what input to show based on content type
  const needsFileUpload = FILE_UPLOAD_TYPES.includes(selectedContentType);
  const needsUrlInput = URL_INPUT_TYPES.includes(selectedContentType);
  const needsMeetCreation = MEET_TYPES.includes(selectedContentType);

  const fetchCourses = async () => {
    if (!collegeId) {
      setCourses([]);
      setCoursesError(null);
      setCoursesLoading(false);
      return;
    }
    setCoursesLoading(true);
    setCoursesError(null);
    const result = await fetchWithErrorHandling(getCoursesByCollege(collegeId));
    setCoursesLoading(false);
    if (result.success && Array.isArray(result.data)) {
      setCourses(result.data);
    } else {
      setCourses([]);
      setCoursesError(result?.message || result?.data?.message || "Could not load courses");
    }
  };

  const fetchFaculty = async () => {
    if (!collegeId) {
      setFaculty([]);
      setFacultyError(null);
      setFacultyLoading(false);
      return;
    }
    setFacultyLoading(true);
    setFacultyError(null);
    const result = await fetchWithErrorHandling(getFacultyByCollegeId(collegeId));
    setFacultyLoading(false);
    if (result.success && Array.isArray(result.data)) {
      setFaculty(result.data);
    } else {
      setFaculty([]);
      setFacultyError(result?.message || result?.data?.message || "Could not load faculty");
    }
  };

  // BE-0161/0162/0163/0167: each lookup is numbered; an answer for a course, lesson or section that is no longer the one
  // picked is dropped instead of replacing what is on screen.
  const lessonsSeq = useRef(0);
  const contentsSeq = useRef(0);
  const classesSeq = useRef(0);
  const viewRef = useRef({ lessonId: null, classId: null });
  viewRef.current = { lessonId: selectedLessonId, classId: selectedClassIdForView };

  const fetchLessons = async (courseId) => {
    const seq = ++lessonsSeq.current;
    ++contentsSeq.current;
    setLessons([]);
    setLessonsError(null);
    setSelectedLessonId(null);
    setData([]);
    setContentsError(null);
    if (!courseId) {
      setLessonsLoading(false);
      return;
    }
    setLessonsLoading(true);
    const result = await fetchWithErrorHandling(getLessonsByCourse(courseId));
    if (seq !== lessonsSeq.current) return;
    setLessonsLoading(false);
    if (result.success && Array.isArray(result.data)) {
      setLessons(result.data);
    } else {
      setLessonsError(result?.message || result?.data?.message || "Could not load lessons for this course");
    }
  };

  const fetchContents = async (lessonId, classId = VALUE_GENERIC) => {
    const seq = ++contentsSeq.current;
    if (!lessonId) {
      setData([]);
      setContentsError(null);
      return;
    }
    setTableLoading(true);
    setContentsError(null);
    try {
      let contents = [];
      if (classId > 0) {
        const res = await getLessonContent({ lessonId, classId });
        contents = res?.data?.data ?? res?.data;
        if (!Array.isArray(contents)) throw new Error("Unexpected content response");
      } else {
        const result = await fetchWithErrorHandling(getLessonContents(lessonId));
        if (!result.success || !Array.isArray(result.data)) {
          throw new Error(result?.message || result?.data?.message || "Could not load lesson content");
        }
        contents = result.data;
      }
      if (seq !== contentsSeq.current) return;
      setData(contents);
    } catch (err) {
      if (seq !== contentsSeq.current) return;
      setData([]);
      setContentsError(err?.response?.data?.message || err?.message || "Failed to load contents");
    } finally {
      if (seq === contentsSeq.current) setTableLoading(false);
    }
  };

  const fetchClassesForCourse = useCallback(async (courseId) => {
    const seq = ++classesSeq.current;
    if (!courseId) {
      setClassesForCourse({});
      setReviewClassesForCourse({});
      setClassesError(null);
      setClassesLoading(false);
      return;
    }
    setClassesLoading(true);
    setClassesError(null);
    const course = courses.find((c) => c.id === courseId);
    const params = course?.slug ? { courseSlug: course.slug } : { courseId };
    try {
      const [currentMap, reviewMap] = await Promise.all([
        getClassesForCourseSyllabus(params),
        getClassesForCourseSyllabus({ ...params, includeHistorical: true }),
      ]);
      if (seq !== classesSeq.current) return;
      if (typeof currentMap !== "object" || currentMap === null || typeof reviewMap !== "object" || reviewMap === null) {
        throw new Error("Unexpected section response");
      }
      setClassesForCourse(currentMap);
      setReviewClassesForCourse(reviewMap);
    } catch (error) {
      if (seq !== classesSeq.current) return;
      setClassesForCourse({});
      setReviewClassesForCourse({});
      setClassesError(error?.response?.data?.message || error?.message || "Could not load eligible sections");
    } finally {
      if (seq === classesSeq.current) setClassesLoading(false);
    }
  }, [courses]);

  useEffect(() => {
    if (!collegeId) {
      setCourses([]);
      setCoursesError(null);
      setLessons([]);
      setLessonsError(null);
      setFaculty([]);
      setFacultyError(null);
      setContentsError(null);
      setClassesError(null);
      setClassesForCourse({});
      setReviewClassesForCourse({});
      setSelectedCourseId(null);
      setSelectedLessonId(null);
      setSelectedClassIdForView(VALUE_GENERIC);
      setData([]);
      return;
    }
    fetchCourses();
    fetchFaculty();
  }, [collegeId]);

  useEffect(() => {
    if (selectedCourseId && courses.length > 0) {
      fetchClassesForCourse(selectedCourseId);
    } else {
      setClassesForCourse({});
      setReviewClassesForCourse({});
    }
  }, [selectedCourseId, courses, fetchClassesForCourse]);

  const handleCourseChange = (courseId) => {
    setSelectedCourseId(courseId);
    setSelectedLessonId(null);
    setSelectedClassIdForView(VALUE_GENERIC);
    setData([]);
    fetchLessons(courseId);
    form.setFieldsValue({ lessonId: undefined, audienceMode: "ALL", classId: undefined });
    setSelectedClassIdForView(VALUE_GENERIC);
    setData([]);
  };

  // Map content type to presign type
  const getPresignType = () => {
    const ct = selectedContentType;
    if (!ct) return "generic";
    const u = String(ct).toUpperCase();
    if (u === "VIDEO") return "video";
    return "generic";
  };

  // Audit 5.1: the real length of a video, captured here at authoring time.
  //
  // Completion used to be measured against a duration the *learner's* browser reported, so a
  // consistent {lastPosition: 100, duration: 100} pair certified its own completion. The server
  // now prefers the duration stored on the content, which only this faculty-authenticated path
  // can set. Reading it off the file means nobody has to type it.
  const [videoDurationSeconds, setVideoDurationSeconds] = useState(null);

  // Resolves to null rather than rejecting: a browser that cannot decode the file must not block
  // the upload. The field stays empty and the old client-reported behaviour applies.
  const readVideoDuration = (file) =>
    new Promise((resolve) => {
      if (!file || !String(file.type || "").startsWith("video/")) {
        resolve(null);
        return;
      }
      try {
        const url = URL.createObjectURL(file);
        const probe = document.createElement("video");
        probe.preload = "metadata";
        const done = (value) => {
          URL.revokeObjectURL(url);
          resolve(value);
        };
        probe.onloadedmetadata = () => {
          const d = Number(probe.duration);
          done(Number.isFinite(d) && d > 0 ? Math.round(d) : null);
        };
        probe.onerror = () => done(null);
        probe.src = url;
      } catch {
        resolve(null);
      }
    });

  // Handle file upload to R2 (direct via presigned URL)
  const handleFileUpload = async (file) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const probedDuration = await readVideoDuration(file);
      // BE-0165: this file's own duration, or none (the author types it) - never the previous video's.
      setVideoDurationSeconds(probedDuration || null);
      form.setFieldsValue({ durationSeconds: probedDuration || undefined });
      const progressInterval = setInterval(() => setUploadProgress(prev => Math.min(prev + 10, 90)), 200);
      const result = await uploadFileViaPresign(file, {
        folder: "lesson-content",
        type: getPresignType(),
        courseId: selectedCourseId || undefined,
        classId: selectedClassIdForView > 0 ? selectedClassIdForView : undefined,
      });
      clearInterval(progressInterval);
      setUploadProgress(100);
      // Video stores a plain public URL (no signed playback-url step exists anymore — the
      // player reads cloud_storage_object straight as its <video src>). PDF/PPT/other file
      // types still go through the authenticated /file/stream proxy, which needs the bare key.
      const isVideoUpload = selectedContentType === "VIDEO";
      const storageValue = isVideoUpload
        ? (result?.publicUrl || result?.key)
        : (result?.key || extractR2KeyFromUrl(result?.publicUrl));
      if (!storageValue) throw new Error("Upload succeeded but storage key missing");
      setUploadedFileUrl(storageValue);
      setUploadTarget(editModalVisible ? editingContent?.id ?? null : "new");
      if (editModalVisible) setEditDirty(true);
      setUploadedFileInfo({
        originalName: result.originalName,
        size: result.size,
        mimetype: result.mimetype,
        cloudStorageObject: storageValue,
      });
      message.success(`${file.name} uploaded successfully!`);
      return storageValue;
    } catch (error) {
      message.error(`Upload failed: ${error?.message || "Unknown error"}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Custom upload handler for Dragger
  const customUpload = async ({ file, onSuccess, onError }) => {
    const url = await handleFileUpload(file);
    if (url) {
      onSuccess(url, file);
    } else {
      onError(new Error("Upload failed"));
    }
  };

  // Reset file upload state
  const resetFileUpload = () => {
    setFileList([]);
    setVideoDurationSeconds(null); // BE-0165
    setUploadedFileUrl(null);
    setUploadedFileInfo(null);
    setUploadTarget(null);
    setUploadProgress(0);
    setVideoImportUrl("");
  };

  // Validate video URL before import (lightweight check)
  const handleValidateVideoUrl = async () => {
    const url = (videoImportUrl || "").trim();
    if (!url) {
      message.error("Please paste a video URL");
      return;
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      message.error("URL must start with http:// or https://");
      return;
    }
    setValidatingFromUrl(true);
    try {
      const result = await validateVideoUrl(url);
      if (result.valid) {
        const sizeStr = result.contentLength != null
          ? ` (${(result.contentLength / 1024 / 1024).toFixed(1)} MB)`
          : "";
        message.success(`Link is valid and can be imported${sizeStr}. Click Import to upload.`);
      } else {
        message.warning(result.message || "Link could not be validated.");
      }
    } catch (error) {
      const msg = error?.response?.data?.data?.message ?? error?.response?.data?.message ?? error?.message ?? "Validation failed";
      message.error(msg);
    } finally {
      setValidatingFromUrl(false);
    }
  };

  // Import video from pasted URL (VIDEO type)
  const handleImportVideoFromUrl = async () => {
    const url = (videoImportUrl || "").trim();
    if (!url) {
      message.error("Please paste a video URL");
      return;
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      message.error("URL must start with http:// or https://");
      return;
    }
    setImportingFromUrl(true);
    try {
      const d = await importVideoFromUrl(url);
      if (!d?.key) throw new Error("Invalid response");
      // Video stores a plain public URL, same as a direct upload — see handleFileUpload above.
      const storageValue = d.publicUrl || d.key;
      setUploadedFileUrl(storageValue);
      setUploadTarget(editModalVisible ? editingContent?.id ?? null : "new");
      if (editModalVisible) setEditDirty(true);
      setUploadedFileInfo({
        originalName: d.originalName || "imported-video.mp4",
        size: d.size || 0,
        mimetype: d.mimetype || "video/mp4",
        cloudStorageObject: storageValue,
      });
      setVideoImportUrl("");
      message.success("Video imported successfully! You can submit the form now.");
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || "Import failed";
      message.error(msg);
    } finally {
      setImportingFromUrl(false);
    }
  };

  const handleSubmit = async (values) => {
    if (!isScoped) {
      message.warning("Select a college first.");
      return;
    }
    setLoading(true);
    try {
      const contentTitle = (values.contentTitle ?? "").trim();
      if (!contentTitle) {
        message.error("Please enter a content title");
        setLoading(false);
        return;
      }
      let contentUrl = "";
      let fileDTO = null;
      
      // For file upload types, use the uploaded file URL
      if (FILE_UPLOAD_TYPES.includes(values.contentType)) {
        if (!uploadedFileUrl || uploadTarget !== "new") {
          message.error("Please upload a file first");
          setLoading(false);
          return;
        }
        contentUrl = uploadedFileUrl;
        fileDTO = uploadedFileInfo;
      }
      // For URL types (YouTube), use the entered URL
      else if (URL_INPUT_TYPES.includes(values.contentType)) {
        if (!values.youtubeUrl) {
          message.error("Please enter a YouTube URL");
          setLoading(false);
          return;
        }
        contentUrl = values.youtubeUrl;
      }
      // For live class, use the entered meeting link
      else if (MEET_TYPES.includes(values.contentType)) {
        if (!values.meetingLink) {
          message.error("Please enter a meeting link");
          setLoading(false);
          return;
        }
        contentUrl = values.meetingLink.trim();
      }
      // For Assignment/Quiz, no file needed
      
      // Prepare content data DTO
      // Sent as `duration` because that is the field the server already persists on
      // ContentDataDTO. Omitted rather than zeroed when unknown, so content whose length could
      // not be determined keeps the previous behaviour instead of recording a false "0 seconds".
      const authoredDuration = Number(values.durationSeconds ?? videoDurationSeconds) || 0;
      const contentDataDto = {
        link: contentUrl,
        html_content: (values.description ?? "").trim(),
        // Course audit C-3: what a learner is allowed to hand in. resolveAllowedAssignmentSubmissionTypes
        // enforces this list; with nothing set it infers from the content and otherwise falls back
        // to PDF only, so there was no way to accept a repository or external link.
        ...(Array.isArray(values.allowedSubmissionTypes) && values.allowedSubmissionTypes.length
          ? { allowed_submission_types: values.allowedSubmissionTypes }
          : {}),
        ...(authoredDuration > 0 ? { duration: authoredDuration } : {}),
        file_dto: fileDTO ? {
          original_name: fileDTO.originalName,
          size: fileDTO.size,
          mimetype: fileDTO.mimetype,
          cloud_storage_object: fileDTO.cloudStorageObject,
        } : null,
      };

      // Add start/end times for Meet types
      if (MEET_TYPES.includes(values.contentType)) {
        const startDateTime = dayjs(values.meetStartDate)
          .hour(values.meetStartTime.hour())
          .minute(values.meetStartTime.minute())
          .second(0)
          .format("YYYY-MM-DDTHH:mm:ss");
          
        const endDateTime = dayjs(values.meetEndDate)
          .hour(values.meetEndTime.hour())
          .minute(values.meetEndTime.minute())
          .second(0)
          .format("YYYY-MM-DDTHH:mm:ss");

        // The Edit path already rejects end <= start — Create never did, so a new Live Class
        // could be created with an end time before its start time with no client-side warning.
        if (dayjs(endDateTime).valueOf() <= dayjs(startDateTime).valueOf()) {
          message.error("End time must be after start time");
          setLoading(false);
          return;
        }

        contentDataDto.start_time = startDateTime;
        contentDataDto.end_time = endDateTime;
        contentDataDto.time_zone = values.meetTimeZone || "Asia/Kolkata";
      }
      
      const course = courses.find(c => c.id === values.courseId);
      const sequence = (values.sequence !== undefined && values.sequence !== "" && values.sequence !== null) ? Number(values.sequence) : 1;
      const points = (values.points !== undefined && values.points !== "" && values.points !== null) ? Number(values.points) : 0;
      if (!Number.isFinite(sequence) || sequence < 1) {
        message.error("Sequence must be 1 or more");
        setLoading(false);
        return;
      }
      if (!Number.isFinite(points) || points < 0) {
        message.error("Points must be 0 or more");
        setLoading(false);
        return;
      }
      const payload = {
        lesson_id: values.lessonId,
        course_id: values.courseId,
        ...(course?.slug && { courseSlug: course.slug }),
        faculty_id: values.facultyId,
        class_id: values.audienceMode === "SPECIFIC" ? Number(values.classId) : 0,
        content_type: values.contentType,
        content_title: contentTitle,
        sequence,
        active: values.active !== false,
        enabled: values.active !== false,
        points,
        // Course audit C-1: the submission cutoff. AssignmentServiceImpl rejects a late submission
        // with "Submission deadline has passed", but nothing could set the date -- so every
        // assignment created from this console had no cutoff and the enforcement never fired.
        ...(values.deadline ? { deadline: values.deadline.format("YYYY-MM-DDTHH:mm:ss") } : {}),
        content_data_dto: contentDataDto,
      };
      
      await createLessonContent(payload);
      message.success("Lesson content created. Add another item or review it in Existing Content.");
      form.resetFields(["contentTitle", "contentType", "youtubeUrl", "description", "sequence", "points", "meetingLink", "meetStartDate", "meetStartTime", "meetEndDate", "meetEndTime", "meetTimeZone"]);
      setSelectedContentType(null);
      resetFileUpload();
      if (values.lessonId === selectedLessonId) {
        fetchContents(selectedLessonId, selectedClassIdForView);
      }
    } catch (error) {
      message.error("Failed to create content: " + (error?.response?.data?.message || error.message));
      // The file was already PUT to R2 (uploadedFileUrl is set) but the create call failed —
      // without this, that object is a permanent orphan with zero record it happened. Best-effort
      // delete it, mirroring the cleanup handleEditSubmit does for replaced files.
      if (uploadedFileUrl) {
        const orphanedKey = extractR2KeyFromUrl(uploadedFileUrl);
        if (orphanedKey) {
          deleteFileFromR2(orphanedKey)
            .then(() => {})
            .catch((cleanupErr) => {
              if (process.env.NODE_ENV !== "production") {
                console.error(`[LessonContent] Failed to delete orphaned R2 object after failed create (key: ${orphanedKey}):`, cleanupErr?.response?.data ?? cleanupErr?.message ?? cleanupErr);
              }
            });
        }
        // BE-0164: that file is being deleted, so it is forgotten here too; Retry asks for the file again instead of
        // sending a reference to an object that no longer exists.
        resetFileUpload();
        message.info("Choose the file again before retrying.");
      }
    }
    setLoading(false);
  };

  // Handle edit
  const handleEdit = (record) => {
      if (lessonsError || coursesError || deleteBusyId != null) {
        message.warning("Reload course and lesson options before editing this content.");
        return;
      }
      setEditingContent(record);
      setEditDirty(false);
      const isMeetRecord = MEET_TYPES.includes(record?.contentType) || MEET_TYPES.includes(record?.contentType?.toUpperCase());
      editForm.setFieldsValue({
        contentTitle: record.contentTitle,
        contentType: record.contentType,
        sequence: record.sequence,
        points: record.points,
        active: record.active !== false && record.enabled !== false,
        youtubeUrl: record.contentDataDTO?.link || "",
        description: record.contentDataDTO?.htmlContent || "",
        // Without these the edit form renders the controls empty and the save writes the empty
        // value back, which is the same silent destruction the payload merge above fixes.
        lessonId: record.lessonId ?? record.lesson_id,
        deadline: record.deadline ? dayjs(record.deadline) : null,
        durationSeconds:
          record.contentDataDTO?.duration ?? record.contentDataDTO?.duration_seconds ?? undefined,
        allowedSubmissionTypes:
          record.contentDataDTO?.allowedSubmissionTypes ||
          record.contentDataDTO?.allowed_submission_types ||
          undefined,
        ...(isMeetRecord
          ? (() => {
              const dto = record?.contentDataDTO || {};
              const start = dto.startTime || dto.start_time || null;
              const end = dto.endTime || dto.end_time || null;
              const toDayjs = (s) => (s ? dayjs(s) : null);
              return {
                meetingLink: dto?.link || "",
                meetStartDate: toDayjs(start),
                meetEndDate: toDayjs(end),
                meetStartTime: toDayjs(start),
                meetEndTime: toDayjs(end),
                meetTimeZone: dto.timeZone || dto.time_zone || "Asia/Kolkata",
              };
            })()
          : {}),
      });
      setEditModalVisible(true);
    };

  const finishEditClose = () => {
    setEditModalVisible(false);
    setEditingContent(null);
    setEditDirty(false);
    editForm.resetFields();
    resetFileUpload();
  };

  const handleEditCancel = () => {
    if (loading || uploading) return;
    if (!editDirty) {
      finishEditClose();
      return;
    }
    Modal.confirm({
      title: "Discard lesson-content edits?",
      content: "Your unsaved changes or replacement file will be lost.",
      okText: "Discard edits",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: finishEditClose,
    });
  };

  // Handle edit submit with file replacement
  const handleEditSubmit = async (values) => {
    setLoading(true);
    try {
      const isMeet = MEET_TYPES.includes(editingContent?.contentType) || MEET_TYPES.includes(editingContent?.contentType?.toUpperCase());
      const editingType = (editingContent?.contentType || editingContent?.content_type || "").toString();
      const editingTypeUpper = editingType.toUpperCase();
      const isQuiz = editingTypeUpper === "QUIZ";
      const isAssignment = editingTypeUpper === "ASSIGNMENT";
      if (isMeet) {
        const startEpoch = dayjs(values.meetStartDate)
          .hour(values.meetStartTime?.hour?.() ?? 0)
          .minute(values.meetStartTime?.minute?.() ?? 0)
          .second(0)
          .valueOf();
        const endEpoch = dayjs(values.meetEndDate)
          .hour(values.meetEndTime?.hour?.() ?? 0)
          .minute(values.meetEndTime?.minute?.() ?? 0)
          .second(0)
          .valueOf();
        if (!Number.isFinite(startEpoch) || !Number.isFinite(endEpoch) || endEpoch <= startEpoch) {
          message.error("End time must be after start time");
          setLoading(false);
          return;
        }
      }
      // Get the old file URL for potential deletion
      const oldFileUrl = editingContent?.contentDataDTO?.link || 
                         editingContent?.contentDataDTO?.file_dto?.cloud_storage_object;
      
      // Determine the new content URL and file info
      let contentUrl = oldFileUrl || "";
      let fileDTO = editingContent?.contentDataDTO?.file_dto || null;
      
      // If user uploaded a new file for this item, use the new URL (never one uploaded for a new item or another item)
      if (uploadedFileUrl && uploadTarget != null && uploadTarget === editingContent?.id) {
        contentUrl = uploadedFileUrl;
        fileDTO = uploadedFileInfo ? {
          original_name: uploadedFileInfo.originalName,
          size: uploadedFileInfo.size,
          mimetype: uploadedFileInfo.mimetype,
          cloud_storage_object: uploadedFileUrl,
        } : null;
      }
      // For YouTube, use the entered URL
      else if (values.youtubeUrl) {
        contentUrl = values.youtubeUrl;
        fileDTO = null;
      }
      // For quiz/assignment we should not mutate link/file payload here
      if (isQuiz || isAssignment) {
        contentUrl = editingContent?.contentDataDTO?.link || editingContent?.contentDataDTO?.file_dto?.cloud_storage_object || "";
        fileDTO = null;
      }
      
      const sequence = (values.sequence !== undefined && values.sequence !== "" && values.sequence !== null) ? Number(values.sequence) : 1;
      const points = (values.points !== undefined && values.points !== "" && values.points !== null) ? Number(values.points) : 0;
      // One "Visible to students" switch drives both flags (see the form).
      const enabled = values.active !== undefined ? values.active !== false : (editingContent?.enabled !== false);
      const payload = {
        // Backend validation requires these even for update
        // Course audit pass 3: content created under the wrong lesson could not be moved. The
        // server has always supported and re-validated a lessonId change on update (see the
        // "Re-validate any attempted scope changes" block in LessonContentController) — only the
        // form never offered it, so the workaround was delete-and-recreate, which permanently
        // destroys the uploaded file.
        lesson_id: values.lessonId || editingContent?.lessonId || editingContent?.lesson_id,
        faculty_id: editingContent?.facultyId || editingContent?.faculty_id || 0,
        content_type: editingContent?.contentType || editingContent?.content_type,
        content_title: (values.contentTitle ?? "").trim() || editingContent?.contentTitle,
        sequence,
        points,
        active: values.active !== false,
        enabled,
        // Course audit C-1: settable on edit too, and clearable -- null explicitly removes the
        // cutoff, which is different from omitting the key.
        // Removal has to be said out loud: the server ignores a null deadline, because most
        // callers omit the field entirely and clearing on their behalf would remove a cutoff they
        // never mentioned.
        ...(isQuiz
          ? {}
          : values.deadline
            ? { deadline: values.deadline.format("YYYY-MM-DDTHH:mm:ss") }
            : editingContent?.deadline
              ? { clear_deadline: true }
              : {}),
        ...(isQuiz
          ? {}
          : {
              content_data_dto: {
                // Merge onto what is stored rather than rebuilding from scratch. This object was
                // being replaced with just these three keys on every edit, so any field the edit
                // form does not render was silently destroyed by saving an unrelated change --
                // the video duration that completion is measured against, and the allowed
                // submission types. The meet branch below already had a hand-written guard against
                // exactly this for its own fields; the general case needed the same care.
                ...(editingContent?.contentDataDTO || {}),
                link: contentUrl,
                html_content: (values.description ?? "").trim(),
                file_dto: fileDTO,
                ...(values.durationSeconds ? { duration: Number(values.durationSeconds) } : {}),
                ...(Array.isArray(values.allowedSubmissionTypes)
                  ? { allowed_submission_types: values.allowedSubmissionTypes }
                  : {}),
              },
            }),
      };

      // Brutal safety: never drop the schedule metadata on edit (time_zone/start/end).
      if (isMeet) {
        const existing = editingContent?.contentDataDTO || {};
        const startDateTime = dayjs(values.meetStartDate)
          .hour(values.meetStartTime.hour())
          .minute(values.meetStartTime.minute())
          .second(0)
          .format("YYYY-MM-DDTHH:mm:ss");
        const endDateTime = dayjs(values.meetEndDate)
          .hour(values.meetEndTime.hour())
          .minute(values.meetEndTime.minute())
          .second(0)
          .format("YYYY-MM-DDTHH:mm:ss");
        payload.content_data_dto = {
          link: values.meetingLink?.trim() || existing.link || contentUrl || "",
          html_content: values.description || existing.htmlContent || existing.html_content || "",
          time_zone: values.meetTimeZone || existing.timeZone || existing.time_zone || "Asia/Kolkata",
          start_time: startDateTime,
          end_time: endDateTime,
          file_dto: null,
        };
      }
      
      // Update the database with new URL. The backend (updateLessonContent's
      // deleteReplacedR2FileBestEffort / its video-specific delete block) already deletes the
      // replaced old R2 object as part of this same call — no need to also fire a redundant
      // client-side delete against the same key afterward.
      await updateLessonContent(editingContent.id, payload);

      message.success("Lesson content updated successfully!");
      setEditDirty(false);
      finishEditClose();
      fetchContents(selectedLessonId, selectedClassIdForView);
    } catch (error) {
      message.error("Failed to update content: " + (error?.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (deleteBusyId != null || loading) return;
    setDeleteBusyId(id);
    try {
      await deleteLessonContent(id);
      message.success("Lesson content deleted successfully!");
      fetchContents(selectedLessonId, selectedClassIdForView);
    } catch (error) {
      message.error("Failed to delete content: " + (error?.response?.data?.message || error.message));
    } finally {
      setDeleteBusyId(null);
    }
  };

  const classOptions = useMemo(() => {
    const opts = [{ value: VALUE_GENERIC, label: "All content in this lesson" }];
    Object.entries(reviewClassesForCourse)
      .filter(([k]) => k !== "undefined" && Number(k) > 0)
      .forEach(([id, name]) => opts.push({ value: Number(id), label: `${name || `Section ${id}`}: what its students see` }));
    return opts;
  }, [reviewClassesForCourse]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    async ({ active, over }) => {
      if (active.id === over?.id || !over || selectedClassIdForView <= 0) return;
      const oldIndex = data.findIndex((r) => String(r.id) === String(active.id));
      const newIndex = data.findIndex((r) => String(r.id) === String(over.id));
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
      const reordered = arrayMove(data, oldIndex, newIndex);
      const orderedContentIds = reordered.map((r) => r.id).filter((id) => id != null && id > 0);
      if (orderedContentIds.length === 0) return;
      const lessonAtStart = selectedLessonId;
      const classAtStart = selectedClassIdForView;
      try {
        await updateClassContentOrder({
          lessonId: lessonAtStart,
          classId: classAtStart,
          orderedContentIds,
        });
        message.success("Order updated for this class.");
        // A late confirmation for a lesson or section that is no longer on screen leaves the current table alone.
        if (viewRef.current.lessonId === lessonAtStart && viewRef.current.classId === classAtStart) setData(reordered);
      } catch (err) {
        message.error(err?.response?.data?.message || err?.message || "Failed to save order");
      }
    },
    [data, selectedLessonId, selectedClassIdForView]
  );

  const baseColumns = [
    {
      title: "Title",
      key: "contentTitle",
      render: (_, record) => record.contentTitle || record.content_title || "—",
    },
    { title: "Type", dataIndex: "contentType", key: "contentType", width: 100,
      render: (v) => ({ video: "Video", youtube: "YouTube", "live class": "Live class", live_class: "Live class",
        resource: "Resource", assignment: "Assignment" }[String(v || "").toLowerCase()] || v || "—") },
    // Position as listed: the stored sequence is 0 for most content, so it said nothing.
    { title: "Order", key: "position", width: 70, render: (_, row, index) => index + 1 },
    { title: "Students", key: "visible", width: 90,
      render: (_, r) => r.active !== false && r.enabled !== false ? <Tag color="green">Visible</Tag> : <Tag>Hidden</Tag> },
    { 
      title: "Content", 
      key: "content", 
      width: 100,
      render: (_, record) => {
        const url = record.contentDataDTO?.link || record.contentDataDTO?.file_dto?.cloud_storage_object;
        const isSafeUrl = url && /^https:\/\//i.test(String(url));
        const contentType = record.contentType?.toUpperCase();

        // Handle Meet/Live Class types
        if (contentType === "LIVE_CLASS" || contentType === "LIVE CLASS") {
          if (isSafeUrl) {
            return (
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Button size="small" icon={<VideoCameraOutlined />} type="primary">Join</Button>
              </a>
            );
          }
          return <span style={{ color: "#999" }}>{url ? "Invalid link" : "No link"}</span>;
        }

        if (isSafeUrl) {
          return (
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Button size="small" icon={<FileOutlined />}>View</Button>
            </a>
          );
        }
        // PDF/PPT/LECTURE store a bare R2 key (not a URL) — they're meant to be resolved
        // through the authenticated /file/stream proxy, not linked to directly. This used to
        // always show "-" for these types because it only ever tested the raw stored value
        // against /^https:\/\//, which a bare key never matches.
        if (url) {
          return (
            <Button
              size="small"
              icon={<FileOutlined />}
              onClick={async () => {
                try {
                  const resolvedUrl = await getFileUrl(url, {
                    courseId: selectedCourseId,
                    classId: selectedClassIdForView > 0 ? selectedClassIdForView : undefined,
                  });
                  window.open(resolvedUrl, "_blank", "noopener,noreferrer");
                } catch {
                  message.error("Could not open file");
                }
              }}
            >
              View
            </Button>
          );
        }
        return "-";
      }
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, record) => {
        // While drag-reordering, the table intentionally shows every content type so the class's
        // full syllabus order can be managed in one place — but Edit/Delete are still meant to be
        // this tab's actions. Disable them for rows outside the current tab's types so an admin
        // reordering "Video" can't accidentally trash/edit a Quiz or PDF from here.
        const rowType = (record.contentType || record.content_type || "").toString().toUpperCase();
        const outsideTab = isSortable && !allowedTypesForTab.includes(rowType);
        return (
          <Space size="small">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
              title={outsideTab ? "Switch to this content's tab to edit it" : "Edit"}
              disabled={outsideTab || deleteBusyId != null || Boolean(lessonsError) || Boolean(coursesError)}
              aria-label={`Edit content ${record.contentTitle || record.content_title || ""}`.trim()}
            />
            <Popconfirm
              title="Are you sure to delete this content?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
              disabled={outsideTab || deleteBusyId != null}
            >
              <Button
                icon={<DeleteOutlined />}
                danger
                size="small"
                loading={deleteBusyId === record.id}
                title={outsideTab ? "Switch to this content's tab to delete it" : "Delete"}
                disabled={outsideTab || deleteBusyId != null}
                aria-label={`Delete content ${record.contentTitle || record.content_title || ""}`.trim()}
              />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const columns = selectedClassIdForView > 0 && data.length > 0
    ? [{ title: " ", key: "sort", width: 44, align: "center" }, ...baseColumns]
    : baseColumns;

  const isSortable = selectedClassIdForView > 0 && data.length > 0;

  // Scope the visible list to the active tab's types — EXCEPT while drag-reordering, where the
  // persisted sequence covers the whole class's content regardless of type (see handleDragEnd's
  // orderedContentIds, built from the full `data` array). Filtering the sortable view would let a
  // reorder silently drop every hidden-type row from the class's saved order, so that view stays
  // unfiltered on purpose — a class's full syllabus order is a different, more holistic surface
  // than "manage my video library" and should show everything while you're actively reordering it.
  const visibleData = isSortable
    ? data
    : data.filter((r) => {
        const t = (r.contentType || r.content_type || "").toString().toUpperCase();
        return allowedTypesForTab.includes(t);
      });

  // Assignment/Quiz rows never appear in any Lesson Content tab (they're managed on the
  // Assignments/Quizzes admin pages instead) — surface a discovery hint when this lesson has any,
  // so an admin isn't left with no way to even learn they exist from here.
  const hiddenLegacyCount = !isSortable
    ? data.filter((r) => {
        const t = (r.contentType || r.content_type || "").toString().toUpperCase();
        return t === "ASSIGNMENT" || t === "QUIZ";
      }).length
    : 0;

  // BE-0168: switching between the Videos and Live classes tabs drops a create-form type the new tab doesn't offer
  // (and its picked file), so a live-class form can't keep a video type selected from the other tab.
  useEffect(() => {
    if (selectedContentType && !allowedTypesForTab.includes(selectedContentType)) {
      setSelectedContentType(null);
      form.setFieldsValue({ contentType: undefined });
      resetFileUpload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentTab]);

  return (
    <>
      {!isScoped && (
        <Alert
          type="warning"
          showIcon
          message="Select a College to manage Lesson Content"
          description="Lesson content is always college-scoped in Superadmin. Use the header Organization/College selector."
          style={{ marginBottom: 16 }}
        />
      )}
      <h1 className="admin-list-page__title">{TAB_COPY[contentTab].title}</h1>
      {/* BE-0170: the "watched" threshold is platform-wide; the server only reads or saves it with no college selected,
          and that is where this page now shows it (superadmin/lesson-content.js). Here we only say where it is. */}
      {showPlatformPolicy && contentTab === "video" && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="The video &quot;watched&quot; threshold is platform-wide"
          description="Clear the college selection in the header and open Videos to see or change it."
          data-testid="video-policy-where"
        />
      )}
      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card title={contentTab === "video" ? "Add a video" : "Schedule a live class"} size="small">
          <div style={{ marginBottom: 16, color: "#666" }}>{TAB_COPY[contentTab].help}</div>
          {coursesError && <Alert type="error" showIcon message="Courses unavailable" description={coursesError}
            action={<Button size="small" onClick={fetchCourses}>Retry courses</Button>} style={{ marginBottom: 12 }} />}
          {facultyError && <Alert type="error" showIcon message="Faculty unavailable" description={facultyError}
            action={<Button size="small" onClick={fetchFaculty}>Retry faculty</Button>} style={{ marginBottom: 12 }} />}
          {lessonsError && selectedCourseId && <Alert type="warning" showIcon message="Lessons unavailable" description={lessonsError}
            action={<Button size="small" onClick={() => fetchLessons(selectedCourseId)}>Retry lessons</Button>} style={{ marginBottom: 12 }} />}
          {classesError && selectedCourseId && <Alert type="warning" showIcon message="Eligible sections unavailable" description={classesError}
            action={<Button size="small" onClick={() => fetchClassesForCourse(selectedCourseId)}>Retry sections</Button>} style={{ marginBottom: 12 }} />}
          
          <Form 
            form={form} 
            layout="vertical" 
            onFinish={handleSubmit}
            initialValues={{
              audienceMode: "ALL",
              meetTimeZone: "Asia/Kolkata",
              meetStartDate: dayjs().add(1, "day"),
              meetEndDate: dayjs().add(1, "day"),
              meetStartTime: dayjs().add(1, "hour").startOf("hour"),
              meetEndTime: dayjs().add(2, "hour").startOf("hour"),
            }}
          >
            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="courseId"
                  label="Course"
                  rules={[{ required: true, message: "Select a course" }]}
                >
                  <Select 
                    placeholder={coursesError ? "Courses unavailable" : "Select course"}
                    loading={coursesLoading}
                    disabled={coursesLoading || Boolean(coursesError)}
                    onChange={handleCourseChange}
                    showSearch
                    optionFilterProp="children"
                  >
                    {courses.map((course) => (
                      <Option key={course.id} value={course.id}>
                        {course.courseName || course.course_name || course.shortTitle || course.short_title || `Course #${course.id}`}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="lessonId"
                  label="Lesson"
                  rules={[{ required: true, message: "Select a lesson" }]}
                >
                  <Select 
                    placeholder={lessonsError ? "Lessons unavailable" : lessonsLoading ? "Loading lessons…" : "Select lesson"}
                    loading={lessonsLoading}
                    disabled={!selectedCourseId || lessonsLoading || Boolean(lessonsError)}
                    showSearch
                    optionFilterProp="children"
                  >
                    {lessons.map((lesson) => (
                      <Option key={lesson.id} value={lesson.id}>
                        {lesson.lessonName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="facultyId"
                  label="Faculty"
                  rules={[{ required: true, message: "Select a faculty member" }]}
                >
                  <Select placeholder={facultyError ? "Faculty unavailable" : "Select faculty"}
                    loading={facultyLoading} disabled={facultyLoading || Boolean(facultyError)} showSearch optionFilterProp="children">
                    {faculty.map((f) => (
                      <Option key={f.id} value={f.id}>
                        {`${f.firstName || ""} ${f.lastName || ""}`.trim()}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="audienceMode"
                  label="Audience"
                  rules={[{ required: true, message: "Choose who receives this content" }]}
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
                      extra={Object.keys(classesForCourse).length
                        ? `${Object.keys(classesForCourse).length} current section${Object.keys(classesForCourse).length === 1 ? "" : "s"} available for this course.`
                        : classesError ? "Section eligibility could not be verified." : "No current section is eligible for this course."}
                    >
                      <Select placeholder={classesError ? "Sections unavailable" : "Select an eligible section"}
                        loading={classesLoading} disabled={classesLoading || Boolean(classesError)}
                        showSearch optionFilterProp="children">
                        {Object.entries(classesForCourse)
                          .filter(([id]) => Number(id) > 0)
                          .map(([id, name]) => (
                            <Option key={id} value={Number(id)}>
                              {name || `Class ${id}`}
                            </Option>
                          ))}
                      </Select>
                    </Form.Item>
                  ) : (
                    <div style={{ marginTop: -8, marginBottom: 16, color: "#8c8c8c" }}>
                      Shared content is visible only to sections currently entitled to this course.
                    </div>
                  )}
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="contentTitle"
              label="Content Title"
              rules={[{ required: true, message: "Enter a content title" }]}
            >
              <Input placeholder="e.g., Introduction Video" />
            </Form.Item>

            <Form.Item
              name="contentType"
              label="Content Type"
              rules={[{ required: true, message: "Select a content type" }]}
            >
              <Select 
                placeholder="Select content type"
                onChange={(value) => {
                  setSelectedContentType(value);
                  resetFileUpload();
                }}
              >
                {tabContentTypes.map((type) => (
                  <Option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* Course audit C-1 and C-3. Assignment-only: a deadline on a video means nothing, and
                submission types only exist for something a learner hands in. */}
            {selectedContentType === "ASSIGNMENT" && (
              <>
                <Form.Item
                  name="deadline"
                  label="Submission deadline (optional)"
                  tooltip="After this moment the server refuses new submissions. Leave blank to accept submissions indefinitely — which is what every assignment did before this field existed."
                >
                  <DatePicker
                    showTime={{ format: "HH:mm" }}
                    format="YYYY-MM-DD HH:mm"
                    style={{ width: "100%" }}
                    placeholder="No deadline"
                  />
                </Form.Item>

                <Form.Item
                  name="allowedSubmissionTypes"
                  label="Allowed submission types"
                  tooltip="What a learner may hand in. Leave empty to keep the existing behaviour: the server infers from the content and otherwise accepts a PDF only."
                >
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="Inferred from the content when empty"
                    options={[
                      { value: "PDF_UPLOAD", label: "PDF upload" },
                      { value: "FILE_UPLOAD", label: "File upload (any type)" },
                      { value: "WRITTEN_RESPONSE", label: "Written response" },
                      { value: "REPOSITORY_LINK", label: "Repository link" },
                      { value: "EXTERNAL_LINK", label: "External link" },
                    ]}
                  />
                </Form.Item>
              </>
            )}

            {/* Audit 5.1. Auto-filled from an uploaded file; shown so it can be set by hand for
                YouTube and imported URLs, where the browser has nothing local to measure. The
                server trusts this over whatever a learner's player reports, which is what stops a
                learner certifying their own completion. */}
            {["VIDEO", "YOUTUBE"].includes(selectedContentType) && (
              <Form.Item
                name="durationSeconds"
                label="Video length (seconds)"
                tooltip="Filled in automatically when you upload a file. Set it for YouTube or imported links: completion is measured against this, and if it is blank the learner's own player decides when the video counts as watched."
                rules={[{ type: "number", min: 1, max: 86400, message: "Must be between 1 and 86400 seconds" }]}
              >
                <InputNumber
                  min={1}
                  max={86400}
                  style={{ width: "100%" }}
                  placeholder="Leave blank if unknown"
                />
              </Form.Item>
            )}

            {/* Show file upload for VIDEO, PDF, PPT, LECTURE */}
            {needsFileUpload && (
              <Form.Item 
                label="Upload File" 
                required
                tooltip={contentTypes.find(t => t.value === selectedContentType)?.hint}
              >
                <Dragger
                  fileList={fileList}
                  customRequest={customUpload}
                  onChange={({ fileList: newFileList }) => setFileList(newFileList)}
                  onRemove={() => resetFileUpload()}
                  maxCount={1}
                  disabled={uploading}
                  accept={
                    selectedContentType === "VIDEO" ? ".mp4,.webm,.mov,.avi" :
                    ".mp4,.webm,.mov"
                  }
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag file to upload</p>
                  <p className="ant-upload-hint">
                    {contentTypes.find(t => t.value === selectedContentType)?.hint}
                  </p>
                </Dragger>
                
                {uploading && (
                  <Progress percent={uploadProgress} size="small" style={{ marginTop: 8 }} />
                )}
                
                {uploadedFileUrl && uploadTarget === "new" && !uploading && (
                  <Alert
                    message="File uploaded successfully!"
                    type="success"
                    showIcon
                    style={{ marginTop: 8 }}
                  />
                )}

                {/* Import video from URL (VIDEO type only) */}
                {needsFileUpload && selectedContentType === "VIDEO" && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ marginBottom: 8, fontSize: "12px", color: "#666" }}>Or paste a direct video URL (validate first, then import)</div>
                    <Space.Compact style={{ width: "100%" }}>
                      <Input
                        placeholder="https://example.com/video.mp4"
                        value={videoImportUrl}
                        onChange={(e) => setVideoImportUrl(e.target.value)}
                        onPressEnter={handleValidateVideoUrl}
                        disabled={!!uploadedFileUrl}
                      />
                      <Button
                        type="default"
                        loading={validatingFromUrl}
                        onClick={handleValidateVideoUrl}
                        disabled={!!uploadedFileUrl}
                        title="Check that the link is a video and within size limit"
                      >
                        Validate
                      </Button>
                      <Button
                        type="primary"
                        loading={importingFromUrl}
                        onClick={handleImportVideoFromUrl}
                        disabled={!!uploadedFileUrl}
                      >
                        Import
                      </Button>
                    </Space.Compact>
                  </div>
                )}
              </Form.Item>
            )}

            {/* Show URL input for YouTube */}
            {needsUrlInput && (
              <Form.Item
                name="youtubeUrl"
                label="YouTube URL"
                rules={[{ required: true, message: "Please enter YouTube URL" }]}
                tooltip="Paste the full YouTube video URL"
              >
                <Input 
                  placeholder="https://www.youtube.com/watch?v=..." 
                  prefix={<YoutubeOutlined style={{ color: "#FF0000" }} />}
                />
              </Form.Item>
            )}

            {/* Meeting link + schedule for live class types */}
            {needsMeetCreation && (
              <>
                <Form.Item
                  name="meetingLink"
                  label="Meeting Link"
                  rules={[
                    { required: true, message: "Please enter a meeting link" },
                    { type: "url", message: "Please enter a valid URL" },
                  ]}
                >
                  <Input
                    placeholder="e.g., https://zoom.us/j/... or https://meet.google.com/..."
                    prefix={<LinkOutlined />}
                  />
                </Form.Item>

                <Row gutter={12}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="meetStartDate"
                      label="Start Date"
                      rules={[{ required: true, message: "Select a start date" }]}
                    >
                      <DatePicker 
                        style={{ width: "100%" }}
                        disabledDate={(current) => current && current < dayjs().startOf("day")}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="meetStartTime"
                      label="Start Time"
                      rules={[{ required: true, message: "Select a start time" }]}
                    >
                      <TimePicker 
                        style={{ width: "100%" }}
                        format="HH:mm"
                        minuteStep={15}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="meetEndDate"
                      label="End Date"
                      rules={[{ required: true, message: "Select an end date" }]}
                    >
                      <DatePicker 
                        style={{ width: "100%" }}
                        disabledDate={(current) => current && current < dayjs().startOf("day")}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="meetEndTime"
                      label="End Time"
                      rules={[{ required: true, message: "Select an end time" }]}
                    >
                      <TimePicker 
                        style={{ width: "100%" }}
                        format="HH:mm"
                        minuteStep={15}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="meetTimeZone"
                  label="Time Zone"
                  initialValue="Asia/Kolkata"
                >
                  <Select>
                    <Option value="Asia/Kolkata">Asia/Kolkata (IST)</Option>
                    <Option value="UTC">UTC</Option>
                    <Option value="America/New_York">America/New_York (EST)</Option>
                    <Option value="America/Los_Angeles">America/Los_Angeles (PST)</Option>
                    <Option value="Europe/London">Europe/London (GMT)</Option>
                  </Select>
                </Form.Item>
              </>
            )}

            <Form.Item name="description" label="Description">
              <TextArea rows={2} placeholder="Brief description of the content" />
            </Form.Item>

            <Row gutter={12}>
              <Col xs={24} sm={8}>
                <Form.Item name="sequence" label="Sequence" initialValue={1}>
                  <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              {/* Points on a video or live class are never credited or shown to students. */}
              <Form.Item name="points" initialValue={0} hidden><InputNumber /></Form.Item>
              <Col xs={24} sm={8}>
                <Form.Item name="active" label="Visible to students" valuePropName="checked" initialValue={true}>
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}
                disabled={Boolean(coursesError) || Boolean(facultyError) || Boolean(lessonsError) || Boolean(classesError) || coursesLoading || facultyLoading || lessonsLoading || classesLoading}
                icon={<PlusOutlined />}>
                Add Content
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card
          title="Existing Content"
          size="small"
          extra={
            <AdminTableToolbar
              onRefresh={() => fetchContents(selectedLessonId, selectedClassIdForView)}
              loading={tableLoading}
              exportFileName="lesson-content.csv"
              exportRows={() =>
                (Array.isArray(data) ? data : []).map((r) => ({
                  id: r.id,
                  title: r.contentTitle ?? "",
                  type: r.contentType ?? "",
                  sequence: r.sequence ?? "",
                  points: r.points ?? "",
                  deadline: r.deadline ?? "",
                  durationSeconds: r.contentDataDTO?.duration ?? "",
                  active: r.active === false ? "no" : "yes",
                  enabled: r.enabled === false ? "no" : "yes",
                }))
              }
            />
          }
        >
          {contentsError && selectedLessonId && (
            <Alert type="error" showIcon message="Lesson content could not be loaded" description={contentsError}
              action={<Button size="small" onClick={() => fetchContents(selectedLessonId, selectedClassIdForView)}>Retry content</Button>}
              style={{ marginBottom: 12 }} />
          )}
          <Row gutter={12} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8}>
              <Select 
                placeholder={coursesError ? "Courses unavailable" : "Select course"}
                loading={coursesLoading}
                disabled={coursesLoading || Boolean(coursesError)}
                allowClear
                showSearch
                optionFilterProp="children"
                onChange={(value) => {
                  setSelectedCourseId(value);
                  fetchLessons(value);
                  setSelectedLessonId(null);
                  setSelectedClassIdForView(VALUE_GENERIC);
                  setData([]);
                }}
                style={{ width: "100%" }}
              >
                {courses.map((course) => (
                  <Option key={course.id} value={course.id}>
                    {course.courseName || course.course_name || course.shortTitle || course.short_title || `Course #${course.id}`}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={8}>
              <Select 
                placeholder={lessonsError ? "Lessons unavailable" : lessonsLoading ? "Loading lessons…" : "Select lesson"}
                loading={lessonsLoading}
                allowClear
                showSearch
                optionFilterProp="children"
                onChange={(value) => {
                  setSelectedLessonId(value);
                  fetchContents(value, selectedClassIdForView);
                }}
                disabled={!selectedCourseId || lessonsLoading || Boolean(lessonsError)}
                style={{ width: "100%" }}
              >
                {lessons.map((lesson) => (
                  <Option key={lesson.id} value={lesson.id}>
                    {lesson.lessonName}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={8}>
              <Select
                placeholder="Section"
                showSearch
                optionFilterProp="label"
                options={classOptions}
                value={selectedClassIdForView}
                onChange={(value) => {
                  const classId = value ?? VALUE_GENERIC;
                  setSelectedClassIdForView(classId);
                  if (selectedLessonId) {
                    fetchContents(selectedLessonId, classId);
                  }
                }}
                disabled={!selectedLessonId || classesLoading || Boolean(classesError)}
                style={{ width: "100%" }}
              />
            </Col>
          </Row>
          {isSortable && (
            <p style={{ marginBottom: 12, fontSize: 12, color: "#8c8c8c" }}>
              Drag the grip handle to change the order this section&apos;s students see. Every content type is listed here so the whole order can be set.
            </p>
          )}
          {hiddenLegacyCount > 0 && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message={`This lesson also has ${hiddenLegacyCount} Assignment/Quiz item${hiddenLegacyCount === 1 ? "" : "s"} not shown here`}
              description="Assignments and Quizzes are managed on the Assignments and Quizzes admin pages, not Lesson Content."
            />
          )}
          
          {isSortable ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={data.map((r) => String(r.id))}
                strategy={verticalListSortingStrategy}
              >
                <Table
                  dataSource={data}
                  columns={columns}
                  rowKey="id"
                  loading={tableLoading}
                  size="small"
                  pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}` }}
                  scroll={{ x: "max-content" }}
                  components={{ body: { row: SortableTableRow } }}
                  locale={{ emptyText: contentsError ? "Could not load content; use Retry above." : selectedLessonId ? "No content found." : "Select a course and lesson to view content." }}
                />
              </SortableContext>
            </DndContext>
          ) : (
            <Table
              dataSource={visibleData}
              columns={columns}
              rowKey="id"
              loading={tableLoading}
              size="small"
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}` }}
              scroll={{ x: "max-content" }}
              locale={{ emptyText: contentsError ? "Could not load content; use Retry above." : selectedLessonId ? "No content found." : "Select a course and lesson to view content." }}
            />
          )}
        </Card>
      </Col>
      </Row>

      {/* Edit Modal */}
      <Modal
        title={`Edit Content: ${editingContent?.contentTitle || ""}`}
        open={editModalVisible}
        onCancel={handleEditCancel}
        maskClosable={false}
        footer={null}
        width={600}
        className="admin-list-page-modal"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit} onValuesChange={() => setEditDirty(true)}>
          <Form.Item
            name="contentTitle"
            label="Content Title"
            rules={[{ required: true, message: "Enter a content title" }]}
          >
            <Input placeholder="e.g., Introduction Video" />
          </Form.Item>

          <Form.Item
            name="contentType"
            label="Content Type"
          >
            <Select disabled>
              {contentTypes.map((type) => (
                <Option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Show current file info for file-based content types */}
          {FILE_UPLOAD_TYPES.includes(editingContent?.contentType?.toUpperCase()) && (
            <>
              {/* Current file info */}
              {editingContent?.contentDataDTO?.link && !(uploadedFileUrl && uploadTarget === editingContent?.id) && (
                <Alert
                  message="Current File"
                  description={
                    <div>
                      <div><strong>Name:</strong> {editingContent?.contentDataDTO?.file_dto?.original_name || "Unknown"}</div>
                      <div style={{ marginTop: 4 }}>
                        {/^https:\/\//i.test(String(editingContent.contentDataDTO.link)) ? (
                          <a href={editingContent.contentDataDTO.link} target="_blank" rel="noopener noreferrer">
                            <Button size="small" icon={<FileOutlined />}>View Current File</Button>
                          </a>
                        ) : editingContent.contentDataDTO.link ? (
                          // Bare R2 key (PDF/PPT/LECTURE) — resolve through the authenticated
                          // stream proxy on click rather than treating it as a dead link.
                          <Button
                            size="small"
                            icon={<FileOutlined />}
                            onClick={async () => {
                              try {
                                const resolvedUrl = await getFileUrl(editingContent.contentDataDTO.link, {
                                  courseId: selectedCourseId,
                                  classId: selectedClassIdForView > 0 ? selectedClassIdForView : undefined,
                                });
                                window.open(resolvedUrl, "_blank", "noopener,noreferrer");
                              } catch {
                                message.error("Could not open file");
                              }
                            }}
                          >
                            View Current File
                          </Button>
                        ) : (
                          <span style={{ color: "#999" }}>Invalid file link</span>
                        )}
                      </div>
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              
              {/* File upload for replacement */}
              <Form.Item 
                label="Replace File (Optional)"
                tooltip="Upload a new file to replace the existing one. The old file will be deleted."
              >
                <Dragger
                  fileList={fileList}
                  customRequest={customUpload}
                  onChange={({ fileList: newFileList }) => setFileList(newFileList)}
                  onRemove={() => resetFileUpload()}
                  maxCount={1}
                  disabled={uploading}
                  accept={
                    editingContent?.contentType?.toUpperCase() === "VIDEO" ? ".mp4,.webm,.mov,.avi" :
                    ".mp4,.webm,.mov"
                  }
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag new file to replace</p>
                  <p className="ant-upload-hint">
                    Leave empty to keep current file
                  </p>
                </Dragger>
                
                {uploading && (
                  <Progress percent={uploadProgress} size="small" style={{ marginTop: 8 }} />
                )}
                
                {uploadedFileUrl && uploadTarget === editingContent?.id && !uploading && (
                  <Alert
                    message="New file uploaded! Old file will be deleted on save."
                    type="success"
                    showIcon
                    style={{ marginTop: 8 }}
                  />
                )}
              </Form.Item>
            </>
          )}

          {/* Show URL input for YouTube type */}
          {editingContent?.contentType?.toUpperCase() === "YOUTUBE" && (
            <Form.Item
              name="youtubeUrl"
              label="YouTube URL"
            >
              <Input 
                placeholder="https://www.youtube.com/watch?v=..." 
                prefix={<YoutubeOutlined style={{ color: "#FF0000" }} />}
              />
            </Form.Item>
          )}

          {/* Meeting link + schedule editor for live classes */}
          {MEET_TYPES.includes(editingContent?.contentType) || MEET_TYPES.includes(editingContent?.contentType?.toUpperCase()) ? (
            <>
              <Form.Item
                name="meetingLink"
                label="Meeting Link"
                rules={[
                  { required: true, message: "Please enter a meeting link" },
                  { type: "url", message: "Please enter a valid URL" },
                ]}
              >
                <Input
                  placeholder="e.g., https://zoom.us/j/... or https://meet.google.com/..."
                  prefix={<LinkOutlined />}
                />
              </Form.Item>
              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <Form.Item name="meetStartDate" label="Start Date" rules={[{ required: true, message: "Select a start date" }]}>
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="meetStartTime" label="Start Time" rules={[{ required: true, message: "Select a start time" }]}>
                    <TimePicker style={{ width: "100%" }} format="HH:mm" minuteStep={15} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <Form.Item name="meetEndDate" label="End Date" rules={[{ required: true, message: "Select an end date" }]}>
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="meetEndTime" label="End Time" rules={[{ required: true, message: "Select an end time" }]}>
                    <TimePicker style={{ width: "100%" }} format="HH:mm" minuteStep={15} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="meetTimeZone" label="Time Zone" initialValue="Asia/Kolkata">
                <Select>
                  <Option value="Asia/Kolkata">Asia/Kolkata (IST)</Option>
                  <Option value="UTC">UTC</Option>
                  <Option value="America/New_York">America/New_York (EST)</Option>
                  <Option value="America/Los_Angeles">America/Los_Angeles (PST)</Option>
                  <Option value="Europe/London">Europe/London (GMT)</Option>
                </Select>
              </Form.Item>
            </>
          ) : null}

          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="Brief description of the content" />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} sm={8}>
              <Form.Item
            name="lessonId"
            label="Lesson"
            tooltip="Moving content to another lesson keeps the file and its learner progress. The alternative was deleting and recreating it, which destroys the uploaded file permanently."
          >
            <Select
              showSearch
              optionFilterProp="children"
              placeholder={lessonsError ? "Lessons unavailable" : "Select lesson"}
              disabled={Boolean(lessonsError)}
            >
              {lessons.map((lesson) => (
                <Option key={lesson.id} value={lesson.id}>
                  {lesson.lessonName || lesson.lesson_name || `Lesson ${lesson.id}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Course audit C-1/C-3 and 5.1: the edit form renders these so a value can be changed or
              cleared. Their absence is what made the payload merge above necessary — an edit used
              to write back an empty content_data_dto and destroy them. */}
          {String(editingContent?.contentType || "").toUpperCase() === "ASSIGNMENT" && (
            <>
              <Form.Item
                name="deadline"
                label="Submission deadline"
                tooltip="After this moment the server refuses new submissions. Clear it to accept submissions indefinitely."
              >
                <DatePicker showTime={{ format: "HH:mm" }} format="YYYY-MM-DD HH:mm" style={{ width: "100%" }} placeholder="No deadline" />
              </Form.Item>
              <Form.Item name="allowedSubmissionTypes" label="Allowed submission types">
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Inferred from the content when empty"
                  options={[
                    { value: "PDF_UPLOAD", label: "PDF upload" },
                    { value: "FILE_UPLOAD", label: "File upload (any type)" },
                    { value: "WRITTEN_RESPONSE", label: "Written response" },
                    { value: "REPOSITORY_LINK", label: "Repository link" },
                    { value: "EXTERNAL_LINK", label: "External link" },
                  ]}
                />
              </Form.Item>
            </>
          )}

          {["VIDEO", "YOUTUBE"].includes(String(editingContent?.contentType || "").toUpperCase()) && (
            <Form.Item
              name="durationSeconds"
              label="Video length (seconds)"
              tooltip="Completion is measured against this. Blank means the learner's own player decides when the video counts as watched."
            >
              <InputNumber min={1} max={86400} style={{ width: "100%" }} placeholder="Leave blank if unknown" />
            </Form.Item>
          )}

          <Form.Item name="sequence" label="Sequence">
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Form.Item name="points" hidden><InputNumber /></Form.Item>
            <Col xs={24} sm={8}>
              {/* Students see an item only when it is both active and enabled (the learner content
                  queries test them together), so one switch sets both. */}
              <Form.Item name="active" label="Visible to students" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading || uploading}
              disabled={Boolean(lessonsError) || Boolean(coursesError)}>
              {uploading ? "Uploading..." : "Update Content"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default LessonContent;
