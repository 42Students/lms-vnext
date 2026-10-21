import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Form, Input, Result, Skeleton, Space, Statistic, Typography } from "antd";
import { getPublicPlacementsPage, recruitFromCollege, sendRecruitCode } from "@/api/Services/TpoService";

const FIELD_OF = { COMPANY_EMAIL_REQUIRED: "email", EMAIL_REQUIRED: "email", NAME_REQUIRED: "name", WRONG_CODE: "code", CODE_EXPIRED: "code", CODE_LOCKED: "code", CODE_REQUIRED: "code" };

/**
 * A college's public placements page on its own address (D2): what the placement cell wrote, the live numbers it chose, and
 * "Recruit from us". A company proves its email with a code; the placement cell gets it in Engage.
 */
export default function PlacementsPublicPage() {
  const [state, setState] = useState("loading"); // loading | ready | missing | error | sent
  const [page, setPage] = useState(null);
  const [codeSentTo, setCodeSentTo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState(null);
  const savingRef = useRef(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await getPublicPlacementsPage();
      setPage(res.data);
      setState("ready");
    } catch (e) {
      setState(e?.response?.status === 404 ? "missing" : "error");
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const busy = async (work) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setProblem(null);
    try { await work(); } finally { savingRef.current = false; setSaving(false); }
  };
  const show = (e, fallback) => {
    const code = e?.response?.data?.error;
    const msg = e?.response?.data?.message || fallback;
    if (FIELD_OF[code]) form.setFields([{ name: FIELD_OF[code], errors: [msg] }]);
    else setProblem(msg);
  };

  const sendCode = async () => {
    try { await form.validateFields(["email", "name"]); } catch { return; }
    await busy(async () => {
      try {
        const res = await sendRecruitCode(form.getFieldValue("email"));
        setCodeSentTo(res?.data?.email || form.getFieldValue("email"));
      } catch (e) { show(e, "We couldn't send the code. Please try again."); }
    });
  };
  const submit = async (v) => busy(async () => {
    try {
      await recruitFromCollege(v);
      setState("sent");
    } catch (e) { show(e, "Something went wrong. Please try again."); }
  });

  const shell = (children) => (
    <div style={{ minHeight: "100vh", padding: "32px 16px", background: "#f5f7f9" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>{children}</div>
    </div>
  );
  if (state === "loading") return shell(<Card><Skeleton active paragraph={{ rows: 6 }} /></Card>);
  if (state === "missing") return shell(<Card><Result status="404" title="This page isn't available" subTitle="The placement cell hasn't published a placements page here." /></Card>);
  if (state === "error") return shell(<Card><Result status="warning" title="We couldn't load this page" extra={<Button type="primary" onClick={load}>Retry</Button>} /></Card>);

  return shell(
    <Space direction="vertical" size="large" style={{ width: "100%" }} data-testid="placements.public">
      <Card>
        <Typography.Title level={2} style={{ marginTop: 0 }}>Placements at {page.collegeName}</Typography.Title>
        {page.about && <Typography.Paragraph style={{ whiteSpace: "pre-wrap" }}>{page.about}</Typography.Paragraph>}
        {(page.numbers || []).length > 0 && (
          <Space wrap size={32} style={{ marginTop: 8 }}>
            {page.numbers.map((n) => <Statistic key={n.key} title={n.label} value={n.value} />)}
          </Space>
        )}
        {(page.numbers || []).length > 0 && <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>Live numbers over the last 12 months.</Typography.Paragraph>}
      </Card>
      <Card title="Recruit from us">
        {state === "sent" ? (
          <Result status="success" title="Thank you" subTitle={`The placement cell at ${page.collegeName} has your details and will get in touch.`} />
        ) : (
          <>
            {problem && <Alert type="error" showIcon message={problem} style={{ marginBottom: 12 }} />}
            <Form form={form} layout="vertical" onFinish={submit}>
              <Form.Item name="email" label="Work email" extra="Your company email. We send a code to it."
                rules={[{ required: true, message: "Enter your work email" }, { type: "email", message: "Enter a valid email" }]}>
                <Input autoComplete="email" readOnly={Boolean(codeSentTo)} />
              </Form.Item>
              <Form.Item name="name" label="Your name" rules={[{ required: true, whitespace: true, message: "Enter your name" }]}><Input autoComplete="name" /></Form.Item>
              <Form.Item name="company" label="Company"><Input autoComplete="organization" /></Form.Item>
              <Form.Item name="phone" label="Mobile (optional)"><Input inputMode="tel" autoComplete="tel" maxLength={14} /></Form.Item>
              <Form.Item name="note" label="What are you hiring for? (optional)"><Input.TextArea rows={3} maxLength={1000} /></Form.Item>
              {!codeSentTo ? (
                <Button type="primary" loading={saving} disabled={saving} onClick={sendCode}>Send me a code</Button>
              ) : (
                <>
                  <Form.Item name="code" label={`Code sent to ${codeSentTo}`}
                    rules={[{ required: true, message: "Enter the 6-digit code" }, { pattern: /^\d{6}$/, message: "The code has 6 digits" }]}>
                    <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={saving} disabled={saving}>Send to the placement cell</Button>
                </>
              )}
            </Form>
          </>
        )}
      </Card>
    </Space>
  );
}

// A public page: no session layout and no login redirect (PUBLIC_PREFIXES in src/proxy.js).
PlacementsPublicPage.nolayout = true;
