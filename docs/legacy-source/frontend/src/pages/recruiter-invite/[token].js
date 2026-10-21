import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Card, Form, Input, Result, Skeleton, Typography } from "antd";
import {
  acceptRecruiterInvite, previewRecruiterInvite, recruiterInviteNotHiring, recruiterInviteUnsubscribe, sendRecruiterInviteCode,
} from "@/api/Services/TpoService";

const ERRORS = {
  INVALID_MOBILE: "Enter a valid 10-digit mobile number, or leave it blank.",
  FIRST_NAME_REQUIRED: "Enter your name.",
  ACCOUNT_UNAVAILABLE: "This account can't be used. Please contact the placement cell.",
};
// Errors that belong to one field are shown under it.
const FIELD_OF = {
  INVALID_MOBILE: "phone", FIRST_NAME_REQUIRED: "firstName", COMPANY_EMAIL_REQUIRED: "email", EMAIL_REQUIRED: "email",
  WRONG_CODE: "code", CODE_EXPIRED: "code", CODE_LOCKED: "code", CODE_REQUIRED: "code",
};

/**
 * Public landing page for a placement cell's invite link. Opening it only shows who invited you; joining is a button, so
 * company mail scanners (which open links before people do) never use the link up. Joining proves the work email with a code
 * sent to it (recruiter phase 1): that email is how you sign in, on this college's own address. A mobile number is optional,
 * only for the placement cell to call.
 */
export default function RecruiterInvitePage() {
  const router = useRouter();
  const token = typeof router.query.token === "string" ? router.query.token : null;
  const [state, setState] = useState("loading"); // loading | load_error | ready | invalid | joined | pending | declined
  const [invite, setInvite] = useState(null);
  const [joined, setJoined] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [codeSentTo, setCodeSentTo] = useState(null);
  const savingRef = useRef(false);
  const [form] = Form.useForm();

  const loadPreview = useCallback(async () => {
    if (!token) return;
    setState("loading");
    setError(null);
    try {
      const res = await previewRecruiterInvite(token);
      if (!res?.data?.collegeName) {
        setState("load_error");
        setError("The invitation details could not be verified. Please retry.");
        return;
      }
      setInvite(res.data);
      setState("ready");
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404 || status === 410) setState("invalid");
      else {
        setState("load_error");
        setError(e?.response?.data?.message || "We could not load this invitation. Please retry.");
      }
    }
  }, [token]);

  useEffect(() => { loadPreview(); }, [loadPreview]);

  const busy = async (work) => {
    if (savingRef.current || saving) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try { await work(); } finally { savingRef.current = false; setSaving(false); }
  };

  const showProblem = (e, fallback) => {
    const status = e?.response?.status;
    const code = e?.response?.data?.error;
    const message = ERRORS[code] || e?.response?.data?.message || fallback;
    if (status === 404 || status === 410) setState("invalid");
    else if (FIELD_OF[code]) form.setFields([{ name: FIELD_OF[code], errors: [message] }]);
    else setError(message);
  };

  const sendCode = async () => {
    if (!invite?.email) {
      try { await form.validateFields(["email"]); } catch { return; }
    }
    const email = invite?.email || form.getFieldValue("email");
    await busy(async () => {
      try {
        const res = await sendRecruiterInviteCode(token, email);
        setCodeSentTo(res?.data?.email || email);
      } catch (e) {
        showProblem(e, "We couldn't send the code. Please try again.");
      }
    });
  };

  const onFinish = async (values) => busy(async () => {
    try {
      const res = await acceptRecruiterInvite(token, { ...values, email: invite?.email || values.email });
      if (!res?.data || typeof res.data !== "object") {
        setError("We could not confirm that the invitation was accepted. Your form is still here; please retry.");
        return;
      }
      setJoined(res.data);
      setState(res.data.status === "PENDING_HR" ? "pending" : "joined");
    } catch (e) {
      showProblem(e, "Something went wrong. Please try again.");
    }
  });

  const answer = async (fn, kind) => busy(async () => {
    try {
      await fn(token);
      setState(kind);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404 || status === 410) setState("invalid");
      else setError(e?.response?.data?.message || "We couldn't save your response. Please try again.");
    }
  });

  const shell = (children) => (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#f5f7f9" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>{children}</div>
    </div>
  );

  if (state === "loading") return shell(<Card><Skeleton active paragraph={{ rows: 4 }} /></Card>);

  if (state === "load_error") {
    return shell(
      <Card>
        <Result status="warning" title="We couldn't load this invitation" subTitle={error || "Please retry."}
          extra={<Button type="primary" onClick={loadPreview}>Retry</Button>} />
      </Card>
    );
  }

  if (state === "invalid") {
    return shell(
      <Card>
        <Result status="info" title="This link is no longer valid"
          subTitle="It may have expired or already been used. Ask the placement cell to send you a new one. Already joined? Sign in with your work email."
          extra={<Button type="primary" href="/login">Sign in</Button>} />
      </Card>
    );
  }

  if (state === "pending") {
    return shell(
      <Card>
        <Result status="info" title="One more step"
          subTitle={`You already have a 42LMS account. Sign in on ${joined?.collegeName || "this college"}'s placement address with your work email to accept the invitation.`}
          extra={<Button type="primary" onClick={() => router.push("/login")}>Sign in</Button>} />
      </Card>
    );
  }

  if (state === "declined") {
    return shell(
      <Card>
        <Result status="success" title="Thank you, we have told the placement cell" subTitle="You will not be contacted about this again." />
      </Card>
    );
  }

  if (state === "joined") {
    return shell(
      <Card>
        <Result status="success" title={`You now have access to ${joined?.collegeName || "the college"}`}
          subTitle={`Sign in with your work email, ${joined?.signInEmail || ""}. We'll email you a code each time.`}
          extra={<Button type="primary" onClick={() => router.push("/login")}>Sign in</Button>} />
      </Card>
    );
  }

  return shell(
    <Card>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        {invite?.collegeName} would like you to hire from their students
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        {invite?.reviewDrive ? `They posted a drive, ${invite.reviewDrive}, and would like you to review it. ` : ""}
        {invite?.companyName ? `You are joining as ${invite.companyName}. ` : ""}
        You can request placement drives and review the students who apply. Contact details are shared only as the
        placement cell allows.
      </Typography.Paragraph>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Form form={form} layout="vertical" onFinish={onFinish}
        initialValues={{ firstName: invite?.contactName || "", designation: invite?.designation || "", email: invite?.email || "" }}>
        <Form.Item name="email" label="Work email"
          extra={invite?.email ? "From your invitation. You'll sign in with it." : "Your company email. You'll sign in with it."}
          rules={invite?.email ? [] : [{ required: true, message: "Enter your work email" }, { type: "email", message: "Enter a valid email" }]}>
          <Input autoComplete="email" readOnly={Boolean(invite?.email) || Boolean(codeSentTo)} />
        </Form.Item>
        <Form.Item name="firstName" label="Your name" rules={[{ required: true, message: "Enter your name" }]}>
          <Input autoComplete="name" />
        </Form.Item>
        <Form.Item name="designation" label="Designation (optional)">
          <Input />
        </Form.Item>
        <Form.Item name="phone" label="Mobile (optional)" extra="Only for the placement cell to call you. You never sign in with it.">
          <Input inputMode="tel" autoComplete="tel" maxLength={14} />
        </Form.Item>
        {!codeSentTo ? (
          <Button type="primary" block loading={saving} disabled={saving} onClick={sendCode}>Send me a code</Button>
        ) : (
          <>
            <Form.Item name="code" label={`Code sent to ${codeSentTo}`} extra="This proves the email is yours."
              rules={[{ required: true, message: "Enter the 6-digit code" }, { pattern: /^\d{6}$/, message: "The code has 6 digits" }]}>
              <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={saving} disabled={saving}>
              Join {invite?.collegeName || ""} placements
            </Button>
            <Button type="link" block disabled={saving} onClick={sendCode}>Send a new code</Button>
          </>
        )}
      </Form>
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <Button type="link" disabled={saving} onClick={() => answer(recruiterInviteNotHiring, "declined")}>Not hiring from this college this season</Button>
        <Button type="link" disabled={saving} onClick={() => answer(recruiterInviteUnsubscribe, "declined")}>Stop contacting me</Button>
      </div>
    </Card>
  );
}

// A public page: no session layout (_app.js honours `nolayout`) and no login redirect (PUBLIC_PREFIXES in src/proxy.js).
RecruiterInvitePage.nolayout = true;
