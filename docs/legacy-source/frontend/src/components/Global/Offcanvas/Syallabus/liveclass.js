import React, { useEffect, useRef, useState } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  TimePicker,
  Select,
  Alert,
  message,
  notification,
} from "antd";
import {
  VideoCameraOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { scheduleClass } from "@/api/Services/attendanceServices";
import { createLessonContent } from "@/api/Services/courseServices";
import { useSelector } from "react-redux";
import dayjs from "dayjs";

const { TextArea } = Input;

const CONTENT_SCOPE_OPTIONS = [
  { label: "This class only", value: "CLASS" },
  { label: "Shared to all sections", value: "SHARED" },
];

const ALLOWED_MEETING_DOMAINS = ['zoom.us', 'teams.microsoft.com', 'meet.google.com', 'webex.com', 'whereby.com'];
const isValidMeetingLink = (url) => {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    return ALLOWED_MEETING_DOMAINS.some(d => u.hostname === d || u.hostname.endsWith('.' + d));
  } catch { return false; }
};

const LiveClass = ({ back, PreviewShow, onDirtyChange }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const [dirty, setDirty] = useState(false);
  const [contentScope, setContentScope] = useState("CLASS");
  const [submitError, setSubmitError] = useState("");

  const loginUser = useSelector((state) => state.loginUser);
  // Only an administrator (college admin / super admin) may share content across all sections; the server refuses it
  // for faculty. Faculty see no Visibility control and always add to their own class.
  const canShareAcrossSections = String(loginUser?.facultyType || "").toUpperCase() === "ADMIN"
    || String(loginUser?.userType || "").toUpperCase() === "ADMIN";
  const course = useSelector((state) => state.course);

  const lessonId = loginUser?.LessonId;
  const facultyId = loginUser?.id;
  const classId = contentScope === "SHARED" && canShareAcrossSections ? 0 : (loginUser?.classId || 0);

  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);

  const combineWallClock = (dateVal, timeVal) => dayjs(dateVal)
    .hour(timeVal.hour())
    .minute(timeVal.minute())
    .second(0)
    .millisecond(0);

  const indiaNowWallClock = () => {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }).formatToParts(new Date()).filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
    );
    return dayjs(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`);
  };

  const buildDateTimeString = (dateVal, timeVal) =>
    combineWallClock(dateVal, timeVal).format("YYYY-MM-DD HH:mm:ss");

  const createCalendarSchedule = async (startDT, endDT) => {
    const selectedCourseId = course?.selectedCourseId;
    const selectedCourseSlug = course?.selectedCourseSlug;

    const contentTitle = form.getFieldValue("title") || "";
    const scheduleData = {
      class_id: classId,
      faculty_id: facultyId,
      start_time: startDT,
      end_time: endDT,
      lecture_hall_id: 0,
      title: contentTitle,
    };

    if (selectedCourseSlug) {
      scheduleData.course_slug = selectedCourseSlug;
      scheduleData.course_id = 0;
    } else if (selectedCourseId && !isNaN(Number(selectedCourseId))) {
      scheduleData.course_id = Number(selectedCourseId);
    } else if (selectedCourseId) {
      scheduleData.course_slug = selectedCourseId;
      scheduleData.course_id = 0;
    }

    try {
      await scheduleClass(scheduleData);
    } catch (err) {
      // The live class itself is saved; say why it is missing from the calendar (for example a clash
      // with another class at the same time) instead of failing silently.
      const reason = err?.response?.data?.message;
      message.warning(`Live class saved, but it was not added to the calendar${reason ? `: ${reason}` : "."}`, 6);
    }
  };

  const handleSubmit = async (values) => {
    setSubmitError("");
    if (submittingRef.current) return;
    const link = values.meetingLink?.trim();

    if (!link) {
      message.warning("Please enter a meeting link!");
      return;
    }

    if (!isValidMeetingLink(link)) {
      message.error('Please use a valid meeting link (Zoom, Teams, Meet, Webex, or Whereby). Only HTTPS links are allowed.');
      return;
    }

    if (!lessonId) {
      message.error("Lesson not found. Please select a lesson first.");
      return;
    }

    const start = combineWallClock(values.startDate, values.startTime);
    const end = combineWallClock(values.endDate, values.endTime);
    const now = indiaNowWallClock();
    if (!start.isAfter(now)) {
      const detail = "The selected start time has already passed in India Standard Time. Pick a future time before saving.";
      form.setFields([{ name: "startTime", errors: [detail] }]);
      setSubmitError(detail);
      return;
    }
    if (!end.isAfter(start)) {
      const detail = "The end time must be after the start time.";
      form.setFields([{ name: "endTime", errors: [detail] }]);
      setSubmitError(detail);
      return;
    }
    if (end.diff(start, "minute") > 12 * 60) {
      const detail = "A live class can be at most 12 hours. Check the end date and AM/PM.";
      form.setFields([{ name: "endTime", errors: [detail] }]);
      setSubmitError(detail);
      return;
    }

    setLoading(true);

    const startDateTime = start.format("YYYY-MM-DDTHH:mm:ss");
    const endDateTime = end.format("YYYY-MM-DDTHH:mm:ss");

    submittingRef.current = true;
    setLoading(true);

    const contentData = {
      lesson_id: lessonId,
      class_id: classId,
      faculty_id: facultyId,
      content_type: "live class",
      content_title: values.title,
      content_data_dto: {
        link: link,
        html_content: values.description || "",
        start_time: startDateTime,
        end_time: endDateTime,
        time_zone: values.timeZone || "Asia/Kolkata",
      },
      active: true,
      enabled: true,
      points: parseInt(values.points) || 0,
    };

    const placement = "bottomLeft";
    createLessonContent(contentData)
      .then(async () => {
        const scheduleDT = buildDateTimeString(
          values.startDate,
          values.startTime
        );
        const scheduleEndDT = buildDateTimeString(
          values.endDate,
          values.endTime
        );
        if (classId && facultyId) {
          await createCalendarSchedule(scheduleDT, scheduleEndDT);
        }

        // Static call, not the hook-bound `api`/`contextHolder` pair below: `back(true)` unmounts
        // this component synchronously in the same batch, which would tear down a locally-mounted
        // notification's portal before it ever paints. The static API's container is independent
        // of any component's lifecycle, so it survives.
        notification.info({
          message: "Server Notification",
          description: "Live class created successfully",
          icon: <CheckCircleOutlined style={{ color: "green" }} />,
          placement,
          duration: 5,
        });
        form.resetFields();
        setContentScope("CLASS");
        setSubmitError("");
        onDirtyChange?.(false);
        setDirty(false);
        back(true);
      })
      .catch((error) => {
        const detail = error?.response?.data?.message || error?.message || "The live class could not be saved. Your draft is still here.";
        setSubmitError(detail);
      })
      .finally(() => {
        submittingRef.current = false;
        setLoading(false);
      });
  };

  return (
    <div style={{ padding: "0 10px" }}>
      {submitError ? (
        <Alert
          type="error"
          showIcon
          message="Live class was not saved"
          description={submitError}
          action={<Button size="small" onClick={() => form.submit()} disabled={loading}>Retry</Button>}
          style={{ marginBottom: 12 }}
        />
      ) : null}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={() => {
          setSubmitError("");
          setDirty(true);
        }}
        initialValues={{
          timeZone: "Asia/Kolkata",
          startDate: dayjs(),
          endDate: dayjs(),
          startTime: dayjs().add(1, "hour"),
          endTime: dayjs().add(2, "hour"),
          points: 0,
        }}
      >
        <Form.Item
          name="title"
          label="Live Class Title"
          rules={[{ required: true, message: "Please enter a title" }]}
        >
          <Input
            placeholder="e.g., Introduction to Data Structures"
            prefix={<VideoCameraOutlined />}
          />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea rows={2} placeholder="Brief description of the live class" />
        </Form.Item>

        {canShareAcrossSections ? (
        <>
        <Form.Item name="contentScope" label="Visibility" initialValue="CLASS">
          <Select
            options={CONTENT_SCOPE_OPTIONS}
            value={contentScope}
            onChange={(value) => { setContentScope(value); setDirty(true); }}
          />
        </Form.Item>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
          Choose whether this live session is only for the current class or shared across all sections.
        </div>
        </>
        ) : null}

        <Form.Item
          name="meetingLink"
          label="Meeting Link"
          rules={[
            { required: true, message: "Please enter a meeting link" },
            { type: "url", message: "Please enter a valid URL" },
          ]}
        >
          <Input
            placeholder="e.g., https://zoom.us/j/... or https://teams.microsoft.com/..."
            prefix={<LinkOutlined />}
          />
        </Form.Item>

        <div style={{ display: "flex", gap: 12 }}>
          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true, message: "Required" }]}
            style={{ flex: 1 }}
          >
            <DatePicker
              style={{ width: "100%" }}
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
            />
          </Form.Item>
          <Form.Item
            name="startTime"
            label="Start Time"
            rules={[{ required: true, message: "Required" }]}
            style={{ flex: 1 }}
          >
            <TimePicker
              style={{ width: "100%" }}
              format="hh:mm A"
              use12Hours
              minuteStep={15}
              disabledTime={() => {
                const startDate = form.getFieldValue("startDate");
                if (!startDate || !dayjs(startDate).isSame(dayjs(), "day")) return {};
                const now = dayjs();
                return {
                  disabledHours: () => Array.from({ length: now.hour() }, (_, i) => i),
                  disabledMinutes: (h) => h === now.hour() ? Array.from({ length: now.minute() }, (_, i) => i) : [],
                };
              }}
            />
          </Form.Item>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Form.Item
            name="endDate"
            label="End Date"
            rules={[{ required: true, message: "Required" }]}
            style={{ flex: 1 }}
          >
            <DatePicker
              style={{ width: "100%" }}
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
            />
          </Form.Item>
          <Form.Item
            name="endTime"
            label="End Time"
            dependencies={["startDate", "startTime", "endDate"]}
            rules={[
              { required: true, message: "Required" },
              ({ getFieldValue }) => ({
                // Nothing stopped a session ending before it started, which then read as "Ended"
                // to learners before it ever began.
                validator: (_, value) => {
                  const startDate = getFieldValue("startDate");
                  const startTime = getFieldValue("startTime");
                  const endDate = getFieldValue("endDate");
                  if (!value || !startDate || !startTime || !endDate) return Promise.resolve();
                  const start = dayjs(startDate).hour(startTime.hour()).minute(startTime.minute());
                  const end = dayjs(endDate).hour(value.hour()).minute(value.minute());
                  if (!end.isAfter(start)) return Promise.reject(new Error("Must be after the start"));
                  // The calendar refuses a session longer than 12 hours. A week-long range used to save
                  // the live class but silently leave it off the calendar.
                  if (end.diff(start, "minute") > 12 * 60) {
                    return Promise.reject(new Error("A live class can be at most 12 hours. Check the end date and AM/PM."));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
            style={{ flex: 1 }}
          >
            <TimePicker
              style={{ width: "100%" }}
              format="hh:mm A"
              use12Hours
              minuteStep={15}
            />
          </Form.Item>
        </div>

        {/* Times are stored and shown as India wall-clock time; a zone picker here changed nothing. */}
        <p style={{ fontSize: 12, color: "#6b7280", margin: "-8px 0 16px" }}>Times are in India Standard Time (IST).</p>

        <Form.Item name="points" label="Points">
          <Input type="number" min={0} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} disabled={loading} block>
            Save Live Class
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default LiveClass;
