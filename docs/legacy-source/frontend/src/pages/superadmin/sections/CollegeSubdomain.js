import { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Input, Modal, Typography, message } from "antd";
import { CheckCircleFilled, LinkOutlined, ReloadOutlined } from "@ant-design/icons";
import { allotCollegeSubdomain, getCollegeSubdomain, removeCollegeSubdomain } from "@/api/Services/TenantAdminService";

// Manage College > Web address: the one subdomain a college has on our domain (e.g. kluniversity.42lms.com).
// Type a name and Allot: it is live straight away, because DNS and the HTTPS certificate are wildcards
// (*.42lms.com, and *.development.42lms.com on dev). The backend (TenantAdminController) checks the name,
// keeps one per college and needs no ownership check for our own domain.
const NAME_RULE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

const CollegeSubdomain = ({ fixedCollegeId, onDirtyChange, onBusyChange }) => {
  const [baseDomain, setBaseDomain] = useState("42lms.com");
  const [current, setCurrent] = useState(null); // allotted host, or null
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [fieldError, setFieldError] = useState(null);
  const requestSeq = useRef(0);
  const mutationRef = useRef(false); // one allot/remove at a time, even on a double click

  const currentSub = current ? current.slice(0, current.length - baseDomain.length - 1) : "";
  const dirty = value.trim() !== "" && value.trim().toLowerCase() !== currentSub;
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => { onBusyChange?.(saving); }, [saving, onBusyChange]);

  const load = async () => {
    if (!fixedCollegeId) return;
    const seq = ++requestSeq.current;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getCollegeSubdomain(fixedCollegeId);
      if (seq !== requestSeq.current) return;
      const data = res?.data ?? {};
      if (data.baseDomain) setBaseDomain(data.baseDomain);
      setCurrent(data.host || null);
      setValue(data.subdomain || "");
      setFieldError(null);
    } catch (e) {
      if (seq !== requestSeq.current) return;
      setLoadError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Couldn't load this college's web address.");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => { ++requestSeq.current; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixedCollegeId]);

  const allot = async () => {
    const name = value.trim().toLowerCase();
    if (!NAME_RULE.test(name)) {
      setFieldError("Use 3 to 30 lowercase letters, numbers or hyphens, starting and ending with a letter or number.");
      return;
    }
    const doAllot = async (fromConfirm = false) => {
      if (mutationRef.current) return;
      mutationRef.current = true;
      setSaving(true);
      try {
        const res = await allotCollegeSubdomain(fixedCollegeId, name);
        setCurrent(res?.data?.host || `${name}.${baseDomain}`);
        setValue(name);
        setFieldError(null);
        message.success(`${name}.${baseDomain} is live`);
      } catch (e) {
        setFieldError(e?.response?.data?.message || e?.response?.data?.error || "Couldn't allot this address. Try again.");
        // BE-0210: from the Move confirmation, rethrow so it stays open (like Remove does) instead of closing on a failure.
        if (fromConfirm) throw e;
      } finally {
        mutationRef.current = false;
        setSaving(false);
      }
    };
    if (current && currentSub !== name) {
      Modal.confirm({
        title: `Move this college to ${name}.${baseDomain}?`,
        content: `${current} stops working straight away. Anyone using the old address will need the new one.`,
        okText: "Move",
        cancelText: "Keep current",
        onOk: () => doAllot(true),
      });
      return;
    }
    await doAllot();
  };

  const remove = () => {
    Modal.confirm({
      title: `Remove ${current}?`,
      content: "The college can't be reached at this address until a new one is allotted. Its data is not affected.",
      okText: "Remove",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        if (mutationRef.current) return;
        mutationRef.current = true;
        setSaving(true);
        try {
          await removeCollegeSubdomain(fixedCollegeId);
          setCurrent(null);
          setValue("");
          message.success("Web address removed");
        } catch (e) {
          message.error(e?.response?.data?.message || "Couldn't remove the address. Try again.");
          throw e; // keep the confirm open so the failure is visible
        } finally {
          mutationRef.current = false;
          setSaving(false);
        }
      },
    });
  };

  return (
    <Card
      title="Web address"
      size="small"
      loading={loading}
      extra={<Button icon={<ReloadOutlined />} size="small" onClick={load}>Reload</Button>}
    >
      {loadError ? <Alert type="error" showIcon message="Couldn't load the web address" description={loadError} style={{ marginBottom: 16 }} /> : null}
      <div style={{ color: "#595959", fontSize: 13, marginBottom: 16 }}>
        The address students and staff open to sign in. It works straight away, with HTTPS, as soon as you allot it.
      </div>

      {current ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "10px 12px", marginBottom: 16, border: "1px solid #b7e4c7", borderRadius: 10, background: "#f0fbf4" }}>
          <CheckCircleFilled style={{ color: "#1a7f37", fontSize: 16 }} />
          <Typography.Text strong>Live at</Typography.Text>
          <a href={`https://${current}`} target="_blank" rel="noopener noreferrer"><LinkOutlined /> {current}</a>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", maxWidth: 560 }}>
        <Input
          aria-label="Subdomain"
          value={value}
          onChange={(e) => { setValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); setFieldError(null); }}
          onPressEnter={allot}
          placeholder="kluniversity"
          addonAfter={`.${baseDomain}`}
          maxLength={30}
          status={fieldError ? "error" : undefined}
          style={{ flex: "1 1 260px" }}
          disabled={saving || Boolean(loadError)}
        />
        <Button type="primary" onClick={allot} loading={saving} disabled={!value.trim() || !dirty || Boolean(loadError)}>
          {current ? "Change" : "Allot"}
        </Button>
        {current ? <Button danger onClick={remove} disabled={saving}>Remove</Button> : null}
      </div>
      {fieldError ? <div role="alert" style={{ marginTop: 6, fontSize: 13, color: "#cf1322" }}>{fieldError}</div> : null}
    </Card>
  );
};

export default CollegeSubdomain;
