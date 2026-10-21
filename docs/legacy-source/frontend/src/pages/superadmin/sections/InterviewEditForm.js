import React, { useState, useEffect, useMemo, useRef } from "react";
import { AutoComplete, Form, Input, Select, Button, message, Space, DatePicker, TimePicker, Alert, Modal } from "antd";
import { updateInterview, getInterviewsForOrganization, getInterviewerNames } from "@/api/Services/interviewService";
import { findConflictingInterviews } from "@/utils/interviewConflicts";
import { parsePlacementUtcDateTime } from "@/utils/placementDateTime";
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

function interviewSnapshot(values = {}) {
  return JSON.stringify({
    interviewType: values.interviewType ?? null,
    roundDescription: String(values.roundDescription ?? "").trim(),
    date: values.date?.format ? values.date.format("YYYY-MM-DD") : values.date ?? null,
    time: values.time?.format ? values.time.format("HH:mm") : values.time ?? null,
    durationMinutes: values.durationMinutes ?? null,
    interviewMode: values.interviewMode ?? null,
    location: String(values.location ?? "").trim(),
    notes: String(values.notes ?? "").trim(),
    interviewerName: String(values.interviewerName ?? "").trim(),
  });
}

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

export default function InterviewEditForm({ interview, organizationId, onSuccess, onCancel }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const loadingRef = useRef(false);
  const originalFormRef = useRef(null);
  const interviewMode = Form.useWatch("interviewMode", form);
  const watchedDate = Form.useWatch("date", form);
  const watchedTime = Form.useWatch("time", form);
  const watchedInterviewerName = Form.useWatch("interviewerName", form);
  // Existing interviewer spellings, so an admin reuses one instead of inventing a near-duplicate.
  // The server's double-booking check matches on this exact string, which makes a typo a
  // correctness bug rather than a cosmetic one. A failed load leaves the field a plain text input.
  const [interviewerOptions, setInterviewerOptions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getInterviewerNames()
      .then((res) => {
        if (cancelled) return;
        const names = res?.data?.data ?? res?.data ?? [];
        setInterviewerOptions(
          (Array.isArray(names) ? names : []).filter(Boolean).map((n) => ({ value: n }))
        );
      })
      .catch(() => {
        if (!cancelled) setInterviewerOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const watchedDuration = Form.useWatch("durationMinutes", form);
  const [originalScheduledDate, setOriginalScheduledDate] = useState(null);

  const isRescheduleRequested = interview?.interviewStatus === "RESCHEDULE_REQUESTED";
  const candidateName = interview?.learner
    ? `${interview.learner.firstName || ""} ${interview.learner.lastName || ""}`.trim()
    : "Candidate";

  // Fetched once to power the inline conflict warning below — read-only soft warning, not a hard
  // block; the backend remains the source of truth for the actual update.
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
  // "Conflict" tag). Excludes this interview's own id so editing it doesn't flag it against itself.
  const conflicts = useMemo(() => {
    if (!watchedDate || !watchedTime) return [];
    const dateStr = dayjs(watchedDate).format("YYYY-MM-DD");
    const timeStr = dayjs(watchedTime).format("HH:mm:ss");
    const scheduledDateTime = dayjs(`${dateStr}T${timeStr}`);
    if (!scheduledDateTime.isValid()) return [];
    return findConflictingInterviews(orgInterviews, {
      id: interview?.id,
      learnerId: interview?.learner?.id,
      companyName: interview?.job?.companyName,
      interviewerName: watchedInterviewerName,
      scheduledDate: scheduledDateTime.toISOString(),
      durationMinutes: watchedDuration ?? 60,
    });
  }, [watchedDate, watchedTime, watchedInterviewerName, watchedDuration, orgInterviews, interview]);

  useEffect(() => {
    if (!interview) return;
    const sd = interview.scheduledDate;
    let dateVal = null;
    let timeVal = null;
    if (sd) {
      const parsed = parsePlacementUtcDateTime(sd);
      const m = parsed ? dayjs(parsed.valueOf()) : null;
      if (m?.isValid()) {
        dateVal = m;
        timeVal = m;
      }
    }
    const originalParsed = parsePlacementUtcDateTime(sd);
    setOriginalScheduledDate(originalParsed ? dayjs(originalParsed.valueOf()) : null);
    const values = {
      interviewType: interview.interviewType || "SCREENING",
      roundDescription: interview.roundDescription || "",
      date: dateVal,
      time: timeVal,
      durationMinutes: interview.durationMinutes ?? 60,
      interviewMode: interview.interviewMode || "ONLINE",
      location: interview.location || "",
      notes: interview.notes || "",
      interviewerName: interview.interviewerName || "",
    };
    form.resetFields();
    form.setFieldsValue(values);
    originalFormRef.current = interviewSnapshot(values);
    setSaveError("");
  }, [interview, form]);

  const handleModeChange = () => {
    form.setFieldsValue({ location: undefined });
    form.setFields([{ name: "location", errors: [] }]);
  };

  const handleSubmit = async (values) => {
    if (loadingRef.current || loading || !interview?.id) return;
    if (!organizationId) {
      setSaveError("Organization context missing. Please reload the page and try again.");
      return;
    }

    // Combine date + time in LOCAL time, then convert to UTC ISO string for the backend.
    const dateStr = dayjs(values.date).format("YYYY-MM-DD");
    const timeStr = dayjs(values.time).format("HH:mm:ss");
    const scheduledDateTime = dayjs(`${dateStr}T${timeStr}`); // local time

    const unchangedScheduledTime = originalScheduledDate?.isValid?.() && scheduledDateTime.isSame(originalScheduledDate, "minute");
    if (!unchangedScheduledTime && scheduledDateTime.isBefore(dayjs())) {
      form.setFields([{ name: "time", errors: ["The selected date and time is in the past"] }]);
      loadingRef.current = false;
      return;
    }

    if (values.interviewMode === "ONLINE" && !isValidMeetingUrl(values.location || "")) {
      form.setFields([{ name: "location", errors: ["Please enter a valid meeting link starting with https://"] }]);
      loadingRef.current = false;
      return;
    }

    const dateChanged = !(originalScheduledDate && originalScheduledDate.isValid() && scheduledDateTime.isSame(originalScheduledDate));

    loadingRef.current = true;
    setLoading(true);
    setSaveError("");
    try {
      const payload = {
        interviewType: values.interviewType,
        roundDescription: (values.roundDescription || "").trim(),
        scheduledDate: scheduledDateTime.toISOString(),
        durationMinutes: values.durationMinutes ?? 60,
        interviewMode: values.interviewMode,
        location: (values.location || "").trim(),
        notes: (values.notes || "").trim() || null,
        interviewerName: (values.interviewerName || "").trim() || null,
      };

      const response = await updateInterview(interview.id, payload, organizationId);
      if (response?.data?.status === "success") {
        message.success(isRescheduleRequested && dateChanged ? "Reschedule applied. Candidate has been notified." : "Interview updated successfully");
        onSuccess();
      } else {
        const pseudoError = { response: { data: response?.data || { message: "Failed to update interview" } } };
        const fieldError = applyServerFieldErrors(form, pseudoError, {
          interview_type: "interviewType",
          round_description: "roundDescription",
          scheduled_date: "time",
          duration_minutes: "durationMinutes",
          interview_mode: "interviewMode",
          interviewer_name: "interviewerName",
        });
        const errorMessage = getServerFormError(pseudoError, "Failed to update interview.");
        setSaveError(errorMessage);
      }
    } catch (error) {
      const fieldError = applyServerFieldErrors(form, error, {
        interview_type: "interviewType",
        round_description: "roundDescription",
        scheduled_date: "time",
        duration_minutes: "durationMinutes",
        interview_mode: "interviewMode",
        interviewer_name: "interviewerName",
      });
      const errorMessage = getServerFormError(error, "Failed to update interview. Please try again.");
      setSaveError(errorMessage);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const requestCancel = () => {
    if (loadingRef.current || loading) {
      message.info("Wait for the interview update to finish saving.");
      return;
    }
    if (interviewSnapshot(form.getFieldsValue(true)) === originalFormRef.current) {
      onCancel?.();
      return;
    }
    Modal.confirm({
      title: "Discard interview changes?",
      content: "Your unsaved interview edits will be lost.",
      okText: "Discard changes",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => onCancel?.(),
    });
  };

  if (!interview) return null;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      onValuesChange={() => setSaveError("")}
      disabled={loading}
    >
      {saveError ? (
        <Alert
          type="error"
          showIcon
          message="Interview changes were not saved"
          description={saveError}
          closable
          onClose={() => setSaveError("")}
          style={{ marginBottom: 16 }}
        />
      ) : null}
      {isRescheduleRequested && (
        <div style={{ background: "#fff7e6", borderRadius: 6, padding: "10px 14px", marginBottom: 16, border: "1px solid #ffd591" }}>
          <strong>Reschedule requested</strong> – Pick a new date/time to approve. The candidate will be notified of the new slot.
          {interview?.rescheduleRequestJson && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #ffd591" }}>
              {interview.rescheduleRequestJson.reason && (
                <div><strong>Reason:</strong> {interview.rescheduleRequestJson.reason}</div>
              )}
              {interview.rescheduleRequestJson.note && (
                <div><strong>Note:</strong> {interview.rescheduleRequestJson.note}</div>
              )}
              {Array.isArray(interview.rescheduleRequestJson.windows) && interview.rescheduleRequestJson.windows.length > 0 && (
                <div>
                  <strong>Free:</strong>{" "}
                  {interview.rescheduleRequestJson.windows
                    .map((w) => [w.day, w.band].filter(Boolean).join(" "))
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <div style={{ background: "#f6f8fa", borderRadius: 6, padding: "10px 14px", marginBottom: 16, border: "1px solid #e8e8e8" }}>
        <span style={{ fontWeight: 500 }}>{candidateName}</span>
        {interview?.job?.jobTitle && <span style={{ color: "#8c8c8c" }}> &middot; {interview.job.jobTitle}</span>}
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
        <TextArea rows={3} placeholder="e.g. Technical discussion on DSA and system design" maxLength={500} showCount />
      </Form.Item>

      <Form.Item
        name="interviewerName"
        label="Interviewer(s)"
        tooltip="Who is conducting this round — comma-separate names for a panel. Optional. Pick an existing name where you can: double-booking is detected by matching this text, so a near-duplicate spelling hides the clash."
      >
        <AutoComplete
          options={interviewerOptions}
          filterOption={(input, option) =>
            (option?.value || "").toLowerCase().includes((input || "").toLowerCase())
          }
          allowClear
        >
          <Input placeholder="e.g. Priya Sharma, Rohan Mehta" maxLength={255} />
        </AutoComplete>
      </Form.Item>

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

      <div style={{ marginBottom: 8, fontSize: 12, color: "#8c8c8c" }}>
        Times shown in your local timezone{LOCAL_TIMEZONE ? ` (${LOCAL_TIMEZONE})` : ""}.
      </div>

      <Form.Item name="date" label="Date" rules={[{ required: true, message: "Please select date" }]}>
        <DatePicker
          style={{ width: "100%" }}
          disabledDate={(current) => current && current < dayjs().startOf("day")}
          placeholder="Select interview date"
        />
      </Form.Item>

      <Form.Item name="time" label="Time" rules={[{ required: true, message: "Please select time" }]}>
        <TimePicker style={{ width: "100%" }} format="HH:mm" minuteStep={5} placeholder="Select time" />
      </Form.Item>

      {conflicts.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Possible scheduling conflict"
          description={`This slot overlaps with ${conflicts.length} existing interview${conflicts.length !== 1 ? "s" : ""} for the same candidate or interviewer. You can still save, but double-check before proceeding.`}
        />
      )}

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
          ...(interviewMode === "ONLINE"
            ? [
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (!isValidMeetingUrl(value)) return Promise.reject(new Error("Meeting link must be a valid https:// URL"));
                    return Promise.resolve();
                  },
                },
              ]
            : []),
        ]}
      >
        <Input placeholder={interviewMode === "ONLINE" ? "https://meet.google.com/..." : "Building, Floor, Room number"} maxLength={500} />
      </Form.Item>

      <Form.Item name="notes" label="Notes (Optional)">
        <TextArea rows={2} placeholder="Additional notes for the candidate..." maxLength={1000} showCount />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading} disabled={loading}>
            {isRescheduleRequested ? "Apply new slot" : "Save changes"}
          </Button>
          <Button htmlType="button" onClick={requestCancel} disabled={loading}>
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
