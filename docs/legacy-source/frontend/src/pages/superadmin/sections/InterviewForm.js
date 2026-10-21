import React, { useState, useRef, useEffect, useMemo } from "react";
import { Form, Input, Select, Button, message, Space, DatePicker, TimePicker, Alert, Modal } from "antd";
import { scheduleInterview, getInterviewsForOrganization } from "@/api/Services/interviewService";
import { findConflictingInterviews } from "@/utils/interviewConflicts";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { applyServerFieldErrors, getServerFormError } from "@/utils/formErrors";

dayjs.extend(utc);

// Best-effort IANA timezone name (e.g. "Asia/Kolkata") so the admin knows what "local" means here —
// falls back to a generic label if the browser can't resolve one.
const LOCAL_TIMEZONE = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
})();

const { TextArea } = Input;
const { Option } = Select;

// Validates that a meeting URL is a proper https URL with a real hostname (not data: or javascript: disguised as https)
function isValidMeetingUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" && parsed.hostname.length > 0 && !parsed.hostname.includes(" ");
  } catch {
    return false;
  }
}

export default function InterviewForm({ application, job, organizationId, existingInterviewsCount = 0, prefillInterview = null, onSuccess, onCancel }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const loadingRef = useRef(false);
  const interviewMode = Form.useWatch("interviewMode", form);
  const watchedDate = Form.useWatch("date", form);
  const watchedTime = Form.useWatch("time", form);
  const watchedInterviewerName = Form.useWatch("interviewerName", form);
  const watchedDuration = Form.useWatch("durationMinutes", form);
  const abortRef = useRef(null);
  const submittingRef = useRef(false);

  const candidateName = application?.learner
    ? `${application.learner.firstName || ""} ${application.learner.lastName || ""}`.trim()
    : "Candidate";

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  // Fetched once to power the inline conflict warning below — read-only, so a stale snapshot
  // (another admin scheduling a clashing slot mid-edit) is acceptable; the backend remains the
  // source of truth and this is a soft warning, not a hard block.
  const [orgInterviews, setOrgInterviews] = useState([]);
  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    getInterviewsForOrganization(organizationId)
      .then((res) => {
        if (!cancelled && res?.data?.status === "success") {
          setOrgInterviews(res.data.data || []);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [organizationId]);

  // Extracted, reusable conflict-detection logic (also used by InterviewCalendarContent's
  // "Conflict" tag) — surfaces a double-booking warning here in the scheduling form itself,
  // instead of only after the fact on the calendar.
  const conflicts = useMemo(() => {
    if (!watchedDate || !watchedTime) return [];
    const dateStr = dayjs(watchedDate).format("YYYY-MM-DD");
    const timeStr = dayjs(watchedTime).format("HH:mm:ss");
    const scheduledDateTime = dayjs(`${dateStr}T${timeStr}`);
    if (!scheduledDateTime.isValid()) return [];
    return findConflictingInterviews(orgInterviews, {
      learnerId: application?.learner?.id,
      companyName: job?.companyName,
      interviewerName: watchedInterviewerName,
      scheduledDate: scheduledDateTime.toISOString(),
      durationMinutes: watchedDuration ?? 60,
    });
  }, [watchedDate, watchedTime, watchedInterviewerName, watchedDuration, orgInterviews, application, job]);

  // Clear location when mode changes to avoid stale URLs being sent as addresses
  const handleModeChange = (newMode) => {
    form.setFieldsValue({ location: undefined });
    form.setFields([{ name: "location", errors: [] }]);
  };

  const handleSubmit = async (values) => {
    if (loadingRef.current || loading) return;

    // Learner guard
    if (!application?.learner?.id) {
      message.error("Cannot schedule interview: candidate has not been onboarded yet.");
      submittingRef.current = false;
      return;
    }

    // Combine date + time in LOCAL time, then convert to UTC ISO string for the backend.
    // Using dayjs.utc() explicitly to ensure the intent is clear and resistant to dayjs config changes.
    const dateStr = dayjs(values.date).format("YYYY-MM-DD");
    const timeStr = dayjs(values.time).format("HH:mm:ss");
    const scheduledDateTime = dayjs(`${dateStr}T${timeStr}`); // local time

    // Past-time validation
    if (scheduledDateTime.isBefore(dayjs())) {
      form.setFields([{ name: "time", errors: ["The selected date and time is in the past"] }]);
      submittingRef.current = false;
      return;
    }

    // Meeting link validation for ONLINE mode
    if (values.interviewMode === "ONLINE" && !isValidMeetingUrl(values.location || "")) {
      form.setFields([{ name: "location", errors: ["Please enter a valid meeting link starting with https://"] }]);
      submittingRef.current = false;
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setSaveError("");
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const interviewData = {
        job: { id: job.id },
        jobApplication: { id: application.id },
        learner: { id: application.learner.id },
        interviewType: values.interviewType,
        roundDescription: (values.roundDescription || "").trim(),
        scheduledDate: scheduledDateTime.toISOString(),
        interviewMode: values.interviewMode,
        durationMinutes: values.durationMinutes ?? 60,
        location: (values.location || "").trim(),
        notes: (values.notes || "").trim() || null,
        interviewerName: (values.interviewerName || "").trim() || null,
      };

      const response = await scheduleInterview(interviewData);
      if (response?.data?.status === "success") {
        message.success("Interview scheduled successfully");
        onSuccess();
      } else {
        const pseudoError = { response: { data: response?.data || { message: "Failed to schedule interview" } } };
        const fieldError = applyServerFieldErrors(form, pseudoError, {
          interview_type: "interviewType",
          round_description: "roundDescription",
          scheduled_date: "time",
          duration_minutes: "durationMinutes",
          interview_mode: "interviewMode",
          interviewer_name: "interviewerName",
        });
        const errorMessage = getServerFormError(pseudoError, "Failed to schedule interview.");
        setSaveError(errorMessage);
      }
    } catch (error) {
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") return;
      const fieldError = applyServerFieldErrors(form, error, {
        interview_type: "interviewType",
        round_description: "roundDescription",
        scheduled_date: "time",
        duration_minutes: "durationMinutes",
        interview_mode: "interviewMode",
        interviewer_name: "interviewerName",
      });
      const errorMessage = getServerFormError(error, "Failed to schedule interview. Please try again.");
      setSaveError(errorMessage);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const requestCancel = () => {
    if (loadingRef.current || loading) {
      message.info("Wait for the interview to finish saving.");
      return;
    }
    if (!form.isFieldsTouched()) {
      onCancel?.();
      return;
    }
    Modal.confirm({
      title: "Discard interview setup?",
      content: "Your interview details and selected slot will be lost.",
      okText: "Discard changes",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => onCancel?.(),
    });
  };

  const prefillInitialValues = prefillInterview
    ? {
        interviewType: prefillInterview.interviewType || "SCREENING",
        interviewMode: prefillInterview.interviewMode || "ONLINE",
        durationMinutes: prefillInterview.durationMinutes || 60,
        roundDescription: prefillInterview.roundDescription || "",
        location: prefillInterview.location || "",
        notes: prefillInterview.notes || "",
        interviewerName: prefillInterview.interviewerName || "",
      }
    : { interviewType: "SCREENING", interviewMode: "ONLINE", durationMinutes: 60 };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={prefillInitialValues}
      onValuesChange={() => setSaveError("")}
      disabled={loading}
    >
      {saveError ? (
        <Alert
          type="error"
          showIcon
          message="Interview was not scheduled"
          description={saveError}
          closable
          onClose={() => setSaveError("")}
          style={{ marginBottom: 16 }}
        />
      ) : null}
      {/* Candidate context banner */}
      <div style={{ background: "#f6f8fa", borderRadius: 6, padding: "10px 14px", marginBottom: 16, border: "1px solid #e8e8e8" }}>
        <span style={{ fontWeight: 500 }}>{candidateName}</span>
        {job?.jobTitle && <span style={{ color: "#8c8c8c" }}> &middot; {job.jobTitle}</span>}
      </div>
      {prefillInterview?._rescheduleFromCancelled && (
        <Alert type="info" message="Rescheduling a cancelled interview — pick a new date and time. Other fields are pre-filled from the cancelled round." showIcon style={{ marginBottom: 16 }} />
      )}
      {!prefillInterview?._rescheduleFromCancelled && existingInterviewsCount > 0 && (
        <Alert type="info" message={`This application has ${existingInterviewsCount} scheduled interview(s). You are adding another round.`} showIcon style={{ marginBottom: 16 }} />
      )}
      <div style={{ marginBottom: 16, fontSize: 12, color: "#8c8c8c" }}>
        Round name/description helps candidates and appears in reminders.
      </div>

      <Form.Item
        name="interviewType"
        label="Interview Type"
        rules={[{ required: true, message: "Please select interview type" }]}
      >
        <Select placeholder="Select interview type">
          <Option value="SCREENING">Screening</Option>
          <Option value="TECHNICAL">Technical</Option>
          <Option value="HR">HR</Option>
          <Option value="MANAGERIAL">Managerial</Option>
          <Option value="FINAL">Final</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="roundDescription"
        label="What this round is about"
        rules={[
          { required: true, whitespace: true, message: "Please describe what this round is about" },
          { min: 10, message: "Please add at least a short description (min 10 characters)" },
        ]}
      >
        <TextArea
          rows={3}
          placeholder="e.g. Technical discussion on DSA and system design, or HR round – fit and expectations"
          maxLength={500}
          showCount
        />
      </Form.Item>

      <Form.Item
        name="interviewerName"
        label="Interviewer(s)"
        tooltip="Who is conducting this round — comma-separate names for a panel. Optional."
      >
        <Input placeholder="e.g. Priya Sharma, Rohan Mehta" maxLength={255} />
      </Form.Item>

      <div style={{ marginBottom: 8, fontSize: 12, color: "#8c8c8c" }}>
        Times shown in your local timezone{LOCAL_TIMEZONE ? ` (${LOCAL_TIMEZONE})` : ""}.
      </div>

      <Form.Item
        name="date"
        label="Date"
        rules={[{ required: true, message: "Please select date" }]}
      >
        <DatePicker
          style={{ width: "100%" }}
          disabledDate={(current) => current && current < dayjs().startOf("day")}
          placeholder="Select interview date"
        />
      </Form.Item>

      <Form.Item
        name="time"
        label="Time"
        rules={[
          { required: true, message: "Please select time" },
        ]}
      >
        <TimePicker
          style={{ width: "100%" }}
          format="HH:mm"
          minuteStep={5}
          placeholder="Select time"
        />
      </Form.Item>

      {conflicts.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Possible scheduling conflict"
          description={`This slot overlaps with ${conflicts.length} existing interview${conflicts.length !== 1 ? "s" : ""} for the same candidate or interviewer. You can still schedule it, but double-check before proceeding.`}
        />
      )}

      <Form.Item
        name="durationMinutes"
        label="Duration (minutes)"
        rules={[{ required: true, message: "Please select duration" }]}
      >
        <Select placeholder="Select duration">
          <Option value={15}>15 min</Option>
          <Option value={30}>30 min</Option>
          <Option value={45}>45 min</Option>
          <Option value={60}>1 hour</Option>
          <Option value={90}>1.5 hours</Option>
          <Option value={120}>2 hours</Option>
          <Option value={180}>3 hours</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="interviewMode"
        label="Mode"
        rules={[{ required: true, message: "Please select mode" }]}
      >
        <Select placeholder="Select mode" onChange={handleModeChange}>
          <Option value="ONLINE">Online</Option>
          <Option value="OFFLINE">In-person</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="location"
        label={interviewMode === "ONLINE" ? "Meeting Link" : "Venue Address"}
        rules={[
          { required: true, whitespace: true, message: interviewMode === "ONLINE" ? "Please enter the meeting link" : "Please enter the venue address" },
          ...(interviewMode === "ONLINE" ? [{
            validator: (_, value) => {
              if (!value) return Promise.resolve();
              if (!isValidMeetingUrl(value)) {
                return Promise.reject(new Error("Meeting link must be a valid https:// URL"));
              }
              return Promise.resolve();
            },
          }] : []),
        ]}
      >
        <Input
          placeholder={interviewMode === "ONLINE" ? "https://meet.google.com/..." : "Building, Floor, Room number"}
          maxLength={500}
        />
      </Form.Item>

      <Form.Item name="notes" label="Notes (Optional)">
        <TextArea rows={3} placeholder="Additional notes for the candidate..." maxLength={1000} showCount />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading} disabled={loading}>
            Schedule Interview
          </Button>
          <Button htmlType="button" onClick={requestCancel} disabled={loading}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
