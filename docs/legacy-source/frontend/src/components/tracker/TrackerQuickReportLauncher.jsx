import { useEffect, useRef, useState } from "react";
import { BugOutlined } from "@ant-design/icons";
import { Button, Cascader, Drawer, Form, Input, Select, message } from "antd";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import ScreenshotPicker from "@/components/tracker/ScreenshotPicker";
import { createBugReport } from "@/api/Services/BugTrackerService";
import { RECENT_TRACKER_CONTEXT_KEY, uploadTrackerAttachments } from "@/utils/bugTrackerAttachments";
import {
  ACCOUNT_OPTIONS,
  ENVIRONMENT_OPTIONS,
  ISSUE_TYPE_OPTIONS,
  LOCATION_OPTIONS,
  REPORTER_OPTIONS,
  SEVERITY_OPTIONS,
} from "@/data/bugTrackerData";
import { locationPathToFields } from "@/utils/bugTrackerUtils";
import {
  QUICK_REPORT_ENABLED_KEY,
  buildTrackerSourceContext,
  inferTrackerAccount,
  inferTrackerLocation,
  isEditableTarget,
} from "@/utils/bugTrackerQuickReport";

const { TextArea } = Input;

export default function TrackerQuickReportLauncher() {
  const router = useRouter();
  const loginUser = useSelector((state) => state.loginUser);
  const [form] = Form.useForm();
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [screenshots, setScreenshots] = useState([]);
  const [submittedIssue, setSubmittedIssue] = useState(null);
  const [failedScreenshots, setFailedScreenshots] = useState([]);
  const [uploadingScreenshots, setUploadingScreenshots] = useState(false);

  useEffect(() => {
    const readEnabled = () => {
      try {
        setEnabled(localStorage.getItem(QUICK_REPORT_ENABLED_KEY) === "true");
      } catch (_) {
        setEnabled(false);
      }
    };
    readEnabled();
    window.addEventListener("storage", readEnabled);
    return () => window.removeEventListener("storage", readEnabled);
  }, [router.pathname]);

  const available =
    enabled &&
    Boolean(loginUser?.isUserLoggedIn) &&
    !router.pathname.startsWith("/tracker") &&
    !router.pathname.startsWith("/auth") &&
    !router.pathname.includes("login") &&
    router.pathname !== "/";

  const seedForm = () => {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(RECENT_TRACKER_CONTEXT_KEY) || "{}");
    } catch (_) {}

    form.setFieldsValue({
      reporterName: form.getFieldValue("reporterName") || saved.reporterName || undefined,
      accountRole: inferTrackerAccount(loginUser),
      environment: form.getFieldValue("environment") || saved.environment || undefined,
      location: inferTrackerLocation(router.pathname, router.asPath),
      severity: form.getFieldValue("severity") || "NOT_SURE",
    });
  };

  const openDrawer = () => {
    if (!available) return;
    if (!submittedIssue) seedForm();
    setOpen(true);
  };
  // The keydown listener below is intentionally only re-attached when `available` changes (not on
  // every render) to avoid the same churn ScreenshotPicker's paste listener has -- so it can't just
  // close over `openDrawer` directly, or it would call a stale version (e.g. still thinking
  // submittedIssue is null after an issue was actually already submitted). Keeping the latest
  // version in a ref sidesteps that without re-subscribing the listener every render.
  const openDrawerRef = useRef(openDrawer);
  openDrawerRef.current = openDrawer;

  useEffect(() => {
    if (!available) return undefined;
    const onShortcut = (event) => {
      if (!event.altKey || String(event.key || "").toLowerCase() !== "b") return;
      // This shortcut is live on every logged-in page in the LMS, not just /tracker -- without this
      // guard, Alt+B would hijack focus away from whatever a student or faculty member is typing
      // (a course description, an assignment title, anything) any time "b" plus Alt happens to be
      // part of their keyboard layout's normal typing.
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      openDrawerRef.current();
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [available]);

  const uploadEntries = async (publicId, entries) => {
    if (!entries.length) return;
    setUploadingScreenshots(true);
    const results = await uploadTrackerAttachments(publicId, entries);
    setUploadingScreenshots(false);
    setFailedScreenshots(results.filter((item) => !item.ok));
  };

  const submit = async (values) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const issue = await createBugReport({
        reporterName: values.reporterName,
        accountRole: values.accountRole,
        environment: values.environment,
        ...locationPathToFields(values.location),
        issueType: values.issueType,
        description: values.description.trim(),
        severity: values.severity,
        evidenceLink: null,
        ...buildTrackerSourceContext(router.pathname),
      });

      setSubmittedIssue(issue);
      try {
        localStorage.setItem(RECENT_TRACKER_CONTEXT_KEY, JSON.stringify({
          reporterName: values.reporterName,
          accountRole: values.accountRole,
          environment: values.environment,
        }));
      } catch (_) {}

      if (screenshots.length) {
        await uploadEntries(
          issue.publicId,
          screenshots.map((file) => ({ file, storageKey: null }))
        );
      }
    } catch (error) {
      message.error(error?.message || "Issue could not be reported. Your form is still here.");
    } finally {
      setSubmitting(false);
    }
  };

  const retryScreenshots = async () => {
    if (!submittedIssue || !failedScreenshots.length || uploadingScreenshots) return;
    const entries = failedScreenshots.map((item) => ({
      file: item.file,
      storageKey: item.storageKey,
    }));
    setFailedScreenshots([]);
    await uploadEntries(submittedIssue.publicId, entries);
  };

  const resetForAnother = () => {
    form.resetFields();
    setScreenshots([]);
    setFailedScreenshots([]);
    setSubmittedIssue(null);
    seedForm();
  };

  if (!available) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          className="tracker-quick-launcher"
          onClick={openDrawer}
          aria-label="Report an LMS issue"
          title="Report issue (Alt+B)"
        >
          <BugOutlined aria-hidden="true" />
          <span>Report issue</span>
        </button>
      )}

      <Drawer
        title="Report issue"
        placement="right"
        width="min(560px, 100vw)"
        open={open}
        onClose={() => setOpen(false)}
        destroyOnClose={false}
        className="tracker-quick-drawer"
      >
        {submittedIssue ? (
          <div className="tracker-quick-success" aria-live="polite">
            <div className="tracker-success-mark">✓</div>
            <p className="tracker-eyebrow">Issue saved</p>
            <h2>{submittedIssue.publicId}</h2>
            <p>The report is safe. You can close this drawer and continue testing.</p>

            {uploadingScreenshots && (
              <div className="tracker-attachment-result is-uploading">Uploading screenshots…</div>
            )}
            {!uploadingScreenshots && failedScreenshots.length > 0 && (
              <div className="tracker-attachment-result is-error">
                <span>{failedScreenshots.length} screenshot upload failed. The issue itself is already saved.</span>
                <Button size="small" onClick={retryScreenshots}>Retry screenshots</Button>
              </div>
            )}

            <div className="tracker-quick-success__actions">
              <Button
                onClick={() => {
                  setOpen(false);
                  router.push(`/tracker/issues/${submittedIssue.publicId}`);
                }}
              >
                View issue
              </Button>
              <Button
                type="primary"
                disabled={uploadingScreenshots}
                onClick={resetForAnother}
              >
                Report another
              </Button>
            </div>
          </div>
        ) : (
          <Form form={form} layout="vertical" requiredMark={false} onFinish={submit}>
            <div className="tracker-quick-context">
              <span>Current page captured automatically</span>
              <small>Environment is always selected by you.</small>
            </div>

            <div className="tracker-quick-grid tracker-quick-grid--three">
              <Form.Item name="reporterName" label="Reporter" rules={[{ required: true, message: "Select your name." }]}>
                <Select options={REPORTER_OPTIONS} showSearch optionFilterProp="label" placeholder="Reporter" />
              </Form.Item>
              <Form.Item name="accountRole" label="Account" rules={[{ required: true }]}>
                <Select options={ACCOUNT_OPTIONS} />
              </Form.Item>
              <Form.Item name="environment" label="Environment" rules={[{ required: true, message: "Select environment." }]}>
                <Select options={ENVIRONMENT_OPTIONS} placeholder="Environment" />
              </Form.Item>
            </div>

            <Form.Item name="location" label="Where?" rules={[{ required: true, message: "Select the page and area." }]}>
              <Cascader options={LOCATION_OPTIONS} showSearch placeholder="Page → screen → section" />
            </Form.Item>

            <Form.Item name="issueType" label="Issue type" rules={[{ required: true, message: "Select issue type." }]}>
              <Select options={ISSUE_TYPE_OPTIONS} showSearch optionFilterProp="label" placeholder="Issue type" />
            </Form.Item>

            <Form.Item
              name="description"
              label="What went wrong?"
              rules={[
                { required: true, whitespace: true, message: "Describe what went wrong." },
                { max: 4000, message: "Keep it under 4000 characters." },
              ]}
            >
              <TextArea
                autoFocus
                autoSize={{ minRows: 4, maxRows: 8 }}
                maxLength={4000}
                showCount
                placeholder="What did you do, and what went wrong?"
                onKeyDown={(event) => {
                  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                    event.preventDefault();
                    form.submit();
                  }
                }}
              />
            </Form.Item>

            {open && (
              <ScreenshotPicker files={screenshots} onChange={setScreenshots} disabled={submitting} />
            )}

            <div className="tracker-quick-submit">
              <span>Alt+B opens this drawer anywhere in LMS</span>
              <Button type="primary" htmlType="submit" loading={submitting}>Report issue</Button>
            </div>
          </Form>
        )}
      </Drawer>
    </>
  );
}
