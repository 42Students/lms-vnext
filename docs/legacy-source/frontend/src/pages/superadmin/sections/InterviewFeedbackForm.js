import React, { useRef, useState } from "react";
import { Alert, Form, Input, Select, Button, message, Space, Rate, Modal } from "antd";
import { submitInterviewFeedback } from "@/api/Services/interviewService";

const { TextArea } = Input;
const { Option } = Select;

export default function InterviewFeedbackForm({ interview, onSuccess, onCancel }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const submitRef = useRef(false);

  const candidateName = interview?.learner
    ? `${interview.learner.firstName || ""} ${interview.learner.lastName || ""}`.trim()
    : "Candidate";

  const handleSubmit = async (values) => {
    if (submitRef.current || loading || !interview?.id) return;

    submitRef.current = true;
    setSubmitError(null);
    setLoading(true);
    try {
      const payload = {
        rating: values.rating ?? null,
        comments: (values.comments || "").trim() || null,
        recommendAction: values.recommendAction || null,
      };

      const response = await submitInterviewFeedback(interview.id, payload);
      if (response?.data?.status === "success") {
        message.success("Feedback submitted successfully");
        onSuccess();
      } else {
        const errorMessage = response?.data?.message || "Failed to submit feedback";
        setSubmitError(errorMessage);
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to submit feedback. Please try again.";
      setSubmitError(errorMessage);
    } finally {
      submitRef.current = false;
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    if (submitRef.current || loading) {
      message.info("Wait for feedback submission to finish.");
      return;
    }
    if (form.isFieldsTouched()) {
      Modal.confirm({
        title: "Discard unsaved feedback?",
        content: "You have unsaved changes in this feedback form. If you close now, they will be lost.",
        okText: "Discard",
        okButtonProps: { danger: true },
        cancelText: "Keep editing",
        onOk: () => onCancel(),
      });
      return;
    }
    onCancel();
  };

  if (!interview) return null;

  const alreadySubmitted = interview.feedbackRating != null || interview.feedbackSubmittedAt != null;

  if (alreadySubmitted) {
    return (
      <div>
        <div style={{ background: "#f0f9ff", borderRadius: 6, padding: "12px 16px", marginBottom: 16, border: "1px solid #bae6fd" }}>
          <strong>Feedback already submitted</strong>
          {interview.feedbackSubmittedAt && (
            <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
              Submitted on {new Date(interview.feedbackSubmittedAt).toLocaleString()}
            </div>
          )}
        </div>
        <div style={{ padding: "8px 0" }}>
          <div style={{ marginBottom: 8 }}><strong>Rating:</strong> {interview.feedbackRating}/5</div>
          {interview.feedbackRecommendAction && (
            <div style={{ marginBottom: 8 }}>
              <strong>Recommendation:</strong>{" "}
              {{ PROCEED_NEXT_ROUND: "Proceed to Next Round", HIRE: "Hire", REJECT: "Reject", HOLD: "Hold" }[interview.feedbackRecommendAction] || interview.feedbackRecommendAction}
            </div>
          )}
          {interview.feedbackComments && (
            <div><strong>Comments:</strong> <span style={{ color: "#64748b" }}>{interview.feedbackComments}</span></div>
          )}
        </div>
        <Button htmlType="button" onClick={handleCancelClick}>Close</Button>
      </div>
    );
  }

  return (
    <>
    {submitError ? (
      <Alert
        type="error"
        showIcon
        closable
        message="Feedback was not submitted"
        description={submitError}
        action={<Button size="small" onClick={() => form.submit()} disabled={loading}>Retry</Button>}
        onClose={() => setSubmitError(null)}
        style={{ marginBottom: 12 }}
      />
    ) : null}
    <Form form={form} layout="vertical" onFinish={handleSubmit} disabled={loading}>
      <div style={{ background: "#f6f8fa", borderRadius: 6, padding: "10px 14px", marginBottom: 16, border: "1px solid #e8e8e8" }}>
        <span style={{ fontWeight: 500 }}>{candidateName}</span>
        {interview?.job?.jobTitle && <span style={{ color: "#8c8c8c" }}> &middot; {interview.job.jobTitle}</span>}
        {interview?.interviewType && (
          <span style={{ color: "#8c8c8c", marginLeft: 8 }}>
            &middot; {interview.interviewType.charAt(0) + interview.interviewType.slice(1).toLowerCase()} round
          </span>
        )}
      </div>

      <Form.Item
        name="rating"
        label="Rating (1–5)"
        rules={[
          { required: true, message: "Please rate the candidate" },
          {
            validator: (_, value) =>
              value > 0 ? Promise.resolve() : Promise.reject(new Error("Please rate the candidate")),
          },
        ]}
      >
        <Rate count={5} />
      </Form.Item>

      <Form.Item
        name="recommendAction"
        label="Recommendation"
        rules={[{ required: true, message: "Please select a recommendation" }]}
        extra="Hire/Reject will automatically update the candidate's application status and send them a notification."
      >
        <Select placeholder="Select outcome">
          <Option value="PROCEED_NEXT_ROUND">Proceed to Next Round</Option>
          <Option value="HIRE">Hire</Option>
          <Option value="REJECT">Reject</Option>
          <Option value="HOLD">Hold</Option>
        </Select>
      </Form.Item>

      <Form.Item noStyle shouldUpdate={(prev, cur) => prev.recommendAction !== cur.recommendAction}>
        {({ getFieldValue }) => {
          const isReject = getFieldValue("recommendAction") === "REJECT";
          return (
            <Form.Item
              name="comments"
              label="Comments"
              rules={[
                {
                  required: isReject,
                  message: "Add feedback explaining the rejection — this will be shared with the candidate.",
                  whitespace: true,
                },
              ]}
              extra={
                isReject
                  ? "This text will be sent to the candidate as the reason for rejection. Only the first 500 characters will be included in the rejection email."
                  : undefined
              }
            >
              <TextArea
                rows={4}
                placeholder="Feedback notes (observations, strengths, areas for improvement, etc.)"
                maxLength={isReject ? 500 : 2000}
                showCount
              />
            </Form.Item>
          );
        }}
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            Submit feedback
          </Button>
          <Button htmlType="button" onClick={handleCancelClick} disabled={loading}>
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
    </>
  );
}
