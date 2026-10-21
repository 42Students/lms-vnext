import { useState } from "react";
import { Alert, Button, Input } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { verifyTrackerLogsPassword } from "@/api/Services/TrackerLogsAccessService";
import { storeAuthResponse } from "@/utils/authUtils";

/**
 * A password-only door onto the Logs page, for the one person who finds the real phone+OTP
 * super-admin login too slow just to check logs. No username field on purpose -- see
 * PublicTrackerLogsAccessController on the backend for what this trades away.
 */
export default function TrackerLogsAccessGate() {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (submitting || !password) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await verifyTrackerLogsPassword(password);
      storeAuthResponse(response);
      // A full reload, not a client-side state flip, so every part of the app that reads auth
      // state at boot (Redux's loginUser slice, the isManager check on this very page) picks up
      // the session that storeAuthResponse just wrote, instead of running once already stale.
      window.location.reload();
    } catch (err) {
      setError(err?.response?.data?.message || "Incorrect password.");
      setPassword("");
      setSubmitting(false);
    }
  };

  return (
    <div className="tracker-logs-gate-wrap">
      <form className="tracker-logs-gate" onSubmit={submit}>
        <div className="tracker-logs-gate__icon"><LockOutlined /></div>
        <h1>Logs access</h1>
        <p>Enter the password to view backend logs.</p>
        {error && <Alert type="error" showIcon message={error} className="tracker-alert" />}
        <Input.Password
          autoFocus
          size="large"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={submitting}
        />
        <Button type="primary" htmlType="submit" size="large" loading={submitting} block disabled={!password}>
          Unlock
        </Button>
      </form>
    </div>
  );
}
