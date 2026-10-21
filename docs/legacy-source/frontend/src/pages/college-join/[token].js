import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Card, Form, Input, Result, Skeleton, Typography } from "antd";
import { joinCollegeLink, previewCollegeJoin, sendCollegeJoinCode } from "@/api/Services/TpoService";

// Errors that belong to one field are shown under it.
const FIELD_OF = {
  INVALID_MOBILE: "phone", FIRST_NAME_REQUIRED: "firstName", COMPANY_EMAIL_REQUIRED: "email", EMAIL_REQUIRED: "email", COMPANY_NAME_REQUIRED: "companyName", COMPANY_EXISTS: "companyName",
  WRONG_CODE: "code", CODE_EXPIRED: "code", CODE_LOCKED: "code", CODE_REQUIRED: "code",
};

/**
 * Public page for a college's public link for recruiters (phase 2, N5 a). Anyone who proves a business email with a code joins
 * the college's placements; the company comes from the email (its name is asked only when the company is new). Opening the
 * page only shows the college; joining is a button.
 */
export default function CollegeJoinPage() {
  const router = useRouter();
  const token = typeof router.query.token === "string" ? router.query.token : null;
  const [state, setState] = useState("loading"); // loading | load_error | ready | invalid | joined
  const [link, setLink] = useState(null);
  const [joined, setJoined] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [codeSentTo, setCodeSentTo] = useState(null);
  const [knownCompany, setKnownCompany] = useState(undefined); // the company's name when the email's domain is known
  const savingRef = useRef(false);
  const [form] = Form.useForm();

  const loadPreview = useCallback(async () => {
    if (!token) return;
    setState("loading");
    setError(null);
    try {
      const res = await previewCollegeJoin(token);
      if (!res?.data?.collegeName) { setState("load_error"); return; }
      setLink(res.data);
      setState("ready");
    } catch (e) {
      if (e?.response?.status === 404) setState("invalid");
      else { setState("load_error"); setError(e?.response?.data?.message || null); }
    }
  }, [token]);
  useEffect(() => { loadPreview(); }, [loadPreview]);

  const busy = async (work) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try { await work(); } finally { savingRef.current = false; setSaving(false); }
  };

  const showProblem = (e, fallback) => {
    const code = e?.response?.data?.error;
    const message = e?.response?.data?.message || fallback;
    if (e?.response?.status === 404) setState("invalid");
    else if (FIELD_OF[code]) form.setFields([{ name: FIELD_OF[code], errors: [message] }]);
    else setError(message);
  };

  const sendCode = async () => {
    try { await form.validateFields(["email"]); } catch { return; }
    const email = form.getFieldValue("email");
    await busy(async () => {
      try {
        const res = await sendCollegeJoinCode(token, email);
        setCodeSentTo(res?.data?.email || email);
        setKnownCompany(res?.data?.companyName || null);
      } catch (e) {
        showProblem(e, "We couldn't send the code. Please try again.");
      }
    });
  };

  const onFinish = async (values) => busy(async () => {
    try {
      const res = await joinCollegeLink(token, values);
      setJoined(res.data);
      setState("joined");
    } catch (e) {
      showProblem(e, "Something went wrong. Please try again.");
    }
  });

  const shell = (children) => (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#f5f7f9" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>{children}</div>
    </div>
  );

  if (state === "loading") return shell(<Card><Skeleton active paragraph={{ rows: 4 }} /></Card>);
  if (state === "load_error") {
    return shell(<Card><Result status="warning" title="We couldn't load this page" subTitle={error || "Please retry."}
      extra={<Button type="primary" onClick={loadPreview}>Retry</Button>} /></Card>);
  }
  if (state === "invalid") {
    return shell(<Card><Result status="info" title="This link is no longer valid" subTitle="Ask the placement cell for a new one. Already joined? Sign in with your work email." extra={<Button type="primary" href="/login">Sign in</Button>} /></Card>);
  }
  if (state === "joined") {
    return shell(
      <Card>
        <Result status="success" title={joined?.status === "ALREADY_JOINED" ? `You already have access to ${joined?.collegeName || "the college"}` : `You now have access to ${joined?.collegeName || "the college"}`}
          subTitle={`Sign in with your work email, ${joined?.signInEmail || ""}, on the college's placement address. We'll email you a code each time.`}
          extra={<Button type="primary" onClick={() => router.push("/login")}>Sign in</Button>} />
      </Card>
    );
  }

  return shell(
    <Card>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        Hire from {link?.collegeName}
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Join with your company email. You can then request placement drives and review the students who apply.
      </Typography.Paragraph>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="email" label="Work email" extra="Your company email. Personal emails such as Gmail can't be used. You'll sign in with it."
          rules={[{ required: true, message: "Enter your work email" }, { type: "email", message: "Enter a valid email" }]}>
          <Input autoComplete="email" readOnly={Boolean(codeSentTo)} />
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
            {knownCompany ? <Typography.Paragraph type="secondary">You are joining as {knownCompany}.</Typography.Paragraph> : (
              <Form.Item name="companyName" label="Company name" rules={[{ required: true, whitespace: true, message: "Add your company's name" }]}>
                <Input maxLength={200} />
              </Form.Item>
            )}
            <Form.Item name="code" label={`Code sent to ${codeSentTo}`} extra="This proves the email is yours."
              rules={[{ required: true, message: "Enter the 6-digit code" }, { pattern: /^\d{6}$/, message: "The code has 6 digits" }]}>
              <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={saving} disabled={saving}>Join {link?.collegeName || ""} placements</Button>
            <Button type="link" block disabled={saving} onClick={sendCode}>Send a new code</Button>
          </>
        )}
      </Form>
    </Card>
  );
}

// A public page: no session layout and no login redirect (PUBLIC_PREFIXES in src/proxy.js).
CollegeJoinPage.nolayout = true;
