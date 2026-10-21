import { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Form, message } from "antd";
import { ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { getCollegeBranding, upsertCollegeBranding } from "@/api/Services/TenantAdminService";

// Manage College > Sign-in: how everyone (students, staff, recruiters) signs in on this college's own address.
// Saved as college_branding.login_methods and enforced by the backend (PublicMobileAuthController); set per the
// college's plan. The main 42lms.com page always offers email first, then phone.
const LOGIN_METHOD_OPTIONS = [
  { value: "EMAIL_PHONE", title: "Email and phone", detail: "Both, with email shown first.", tag: "Default" },
  { value: "PHONE_EMAIL", title: "Phone and email", detail: "Both, with phone shown first." },
  { value: "EMAIL_ONLY", title: "Email only", detail: "Phone sign-in is turned off." },
  { value: "PHONE_ONLY", title: "Phone only", detail: "Email sign-in is turned off." },
];

// A small picture of the login card's toggle for each option.
const MethodSketch = ({ value }) => {
  const order = value === "PHONE_EMAIL" ? ["Phone", "Email"] : value === "EMAIL_ONLY" ? ["Email"] : value === "PHONE_ONLY" ? ["Phone"] : ["Email", "Phone"];
  return (
    <span style={{ display: "flex", gap: 3, padding: 3, marginTop: 10, borderRadius: 7, background: "#f1f4f8", border: "1px solid #e7ecf2" }}>
      {order.map((label, i) => (
        <span
          key={label}
          style={{
            flex: 1,
            padding: "3px 0",
            borderRadius: 5,
            textAlign: "center",
            fontSize: 11,
            fontWeight: i === 0 ? 600 : 400,
            color: i === 0 ? "#172033" : "#5b6b82",
            background: i === 0 ? "#fff" : "transparent",
            boxShadow: i === 0 ? "0 1px 2px rgba(16,24,40,0.08)" : "none",
          }}
        >
          {label}
        </span>
      ))}
    </span>
  );
};

const LoginMethodsPicker = ({ value, onChange }) => {
  const current = value || "EMAIL_PHONE";
  return (
    <div role="radiogroup" aria-label="Sign-in methods" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10, maxWidth: 640 }}>
      {LOGIN_METHOD_OPTIONS.map((option) => {
        const selected = current === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange?.(option.value)}
            style={{
              padding: "12px 14px",
              border: selected ? "2px solid #0a7c88" : "1px solid #d9d9d9",
              borderRadius: 12,
              background: selected ? "#f0f9fa" : "#fff",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#172033" }}>{option.title}</span>
              {option.tag ? <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 999, background: "#e6f4f5", color: "#075963" }}>{option.tag}</span> : null}
            </span>
            <span style={{ display: "block", marginTop: 2, fontSize: 12.5, color: "#5b6b82" }}>{option.detail}</span>
            <MethodSketch value={option.value} />
          </button>
        );
      })}
    </div>
  );
};

// onDirtyChange/onBusyChange let the Manage College drawer guard its close (unsaved change, save in flight).
const CollegeSignIn = ({ fixedCollegeId, onDirtyChange, onBusyChange }) => {
  const [form] = Form.useForm();
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const requestSeq = useRef(0);

  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => { onBusyChange?.(saving); }, [saving, onBusyChange]);

  const load = async (id) => {
    if (!id) return;
    const requestId = ++requestSeq.current;
    setFetching(true);
    setLoadError(null);
    setDirty(false);
    try {
      const res = await getCollegeBranding(id);
      if (requestId !== requestSeq.current) return;
      const b = res?.data?.branding ?? res?.data?.data?.branding ?? res?.data?.data ?? null;
      form.setFieldsValue({ loginMethods: b?.loginMethods || "EMAIL_PHONE" });
    } catch (e) {
      if (requestId !== requestSeq.current) return;
      setLoadError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Couldn't load this college's sign-in settings.");
    } finally {
      if (requestId === requestSeq.current) setFetching(false);
    }
  };

  useEffect(() => {
    load(fixedCollegeId);
    return () => { ++requestSeq.current; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixedCollegeId]);

  const save = async (values) => {
    if (saving || !fixedCollegeId) return;
    setSaving(true);
    try {
      // Only this field is sent; the backend leaves the college's other branding untouched.
      await upsertCollegeBranding(fixedCollegeId, { loginMethods: values.loginMethods || "EMAIL_PHONE" });
      message.success("Sign-in settings saved");
      setDirty(false);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.response?.data?.message || e.message;
      message.error(`Couldn't save sign-in settings: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title="Sign-in"
      size="small"
      loading={fetching}
      extra={<Button icon={<ReloadOutlined />} size="small" onClick={() => load(fixedCollegeId)}>Reload</Button>}
    >
      {loadError ? (
        <Alert type="error" showIcon message="Sign-in settings could not be loaded" description={loadError} style={{ marginBottom: 16 }} />
      ) : null}
      <div style={{ color: "#595959", fontSize: 13, marginBottom: 16 }}>
        How everyone — students, staff and recruiters — signs in on this college&apos;s own web address. Set this as
        per the college&apos;s plan. The main 42lms.com page always offers email first, then phone.
      </div>
      <Form form={form} layout="vertical" onFinish={save} onValuesChange={() => setDirty(true)}>
        <Form.Item name="loginMethods" label="Sign-in methods">
          <LoginMethodsPicker />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />} disabled={Boolean(loadError) || fetching}>
          Save
        </Button>
      </Form>
    </Card>
  );
};

export default CollegeSignIn;
