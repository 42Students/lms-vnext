import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Button, InputNumber, Space, Tag, Tooltip, Typography, message } from "antd";
import { InfoCircleOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import Api from "@/api/ApiMethod";
import {
  getCollegeSettings,
  putCollegeSettings,
  deleteCollegeSetting,
  getGlobalSettings,
  putGlobalSettings,
} from "@/api/Services/TenantAdminService";

const { Text } = Typography;
const ADMIN_READABLE_POLICIES = new Set([
  "attendance.correctionWindowHours",
  "attendance.eligibilityThresholdPercent",
]);

/**
 * Inline editor for a numeric policy value stored in the three-tier app_setting store.
 * College admins cannot access TenantAdminController's general settings endpoints: the
 * attendance page shows only its two safe, read-only policy values through a separate
 * college-scoped API. All other policies remain super-admin-only.
 */
export default function PolicySettingField({
  collegeId,
  scopeType = "COLLEGE",
  settingKey,
  label,
  help,
  defaultValue,
  min = 0,
  max,
  step = 1,
  suffix,
  onValueChange,
}) {
  const loginUser = useSelector((state) => state.loginUser);
  // "24 hours" but "75%": a word unit needs a space after the number, a symbol does not.
  const unit = suffix ? (/^[a-z]/i.test(suffix) ? ` ${suffix}` : suffix) : "";
  const isCollegeAdmin = loginUser?.userType === "FACULTY" && loginUser?.facultyType === "ADMIN";
  const isCollege = scopeType === "COLLEGE";
  const canReadAttendancePolicy = isCollege && ADMIN_READABLE_POLICIES.has(settingKey);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const actionRef = useRef(null);
  const [stored, setStored] = useState(null);

  const effectiveValue = stored != null ? stored : defaultValue;
  useEffect(() => {
    if (typeof onValueChange === "function") onValueChange(effectiveValue);
    // onValueChange is intentionally not a dependency: callers pass an inline arrow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveValue]);
  const [draft, setDraft] = useState(defaultValue);
  const [error, setError] = useState(null);

  const load = async () => {
    if (isCollege && !collegeId) return;
    if (isCollegeAdmin && !canReadAttendancePolicy) return;
    setLoading(true);
    setError(null);
    try {
      const res = isCollegeAdmin
        ? await Api.get(`/api/v1/admin/attendance/policy?collegeId=${encodeURIComponent(collegeId)}`)
        : isCollege
          ? await getCollegeSettings(collegeId)
          : await getGlobalSettings();
      const raw = res?.data?.settings?.[settingKey];
      const n = raw != null && raw !== "" ? Number(raw) : null;
      const parsed = Number.isFinite(n) ? n : null;
      setStored(parsed);
      setDraft(parsed != null ? parsed : defaultValue);
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || `Couldn't load ${label}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId, scopeType, settingKey, isCollegeAdmin]);

  const save = async () => {
    if (actionRef.current || saving || isCollegeAdmin || (isCollege && !collegeId) || draft == null) return;
    actionRef.current = "save";
    setSaving(true);
    setError(null);
    try {
      if (isCollege) await putCollegeSettings(collegeId, { [settingKey]: draft });
      else await putGlobalSettings({ [settingKey]: draft });
      setStored(draft);
      message.success(`${label} updated`);
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || `Failed to save ${label}`);
      message.error(`Failed to save ${label}`);
    } finally {
      actionRef.current = null;
      setSaving(false);
    }
  };

  const resetToDefault = async () => {
    if (actionRef.current || saving || isCollegeAdmin) return;
    if (!isCollege) {
      setDraft(defaultValue);
      return;
    }
    if (!collegeId) return;
    actionRef.current = "reset";
    setSaving(true);
    try {
      await deleteCollegeSetting(collegeId, settingKey);
      setStored(null);
      setDraft(defaultValue);
      message.success(`${label} reset to default`);
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || `Failed to reset ${label}`);
      message.error(`Failed to reset ${label}`);
    } finally {
      actionRef.current = null;
      setSaving(false);
    }
  };

  const effective = stored != null ? stored : defaultValue;
  const dirty = draft !== effective;

  if (isCollege && !collegeId) return null;

  if (isCollegeAdmin) {
    if (!canReadAttendancePolicy) return null;
    return (
      <div style={{ marginBottom: 16 }}>
        <Space size={4} style={{ marginBottom: 4 }}>
          <Text strong>{label}</Text>
          {help && (
            <Tooltip title={help}>
              <InfoCircleOutlined style={{ color: "#999" }} />
            </Tooltip>
          )}
          <Tag>Read-only</Tag>
        </Space>
        <div>
          <Text type={error ? "danger" : undefined}>
            {loading ? "Loading policy…" : error ? error : `${effectiveValue}${unit}`}
          </Text>
          <Button size="small" icon={<ReloadOutlined />} onClick={load} disabled={loading} style={{ marginLeft: 8 }} aria-label={`Reload ${label}`} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <Space size={4} style={{ marginBottom: 4 }}>
        <Text strong>{label}</Text>
        {help && (
          <Tooltip title={help}>
            <InfoCircleOutlined style={{ color: "#999" }} />
          </Tooltip>
        )}
        {stored == null ? (
          <Tag>Default ({defaultValue}{unit})</Tag>
        ) : (
          <Tag color="blue">Custom{isCollege ? " for this college" : ""}</Tag>
        )}
      </Space>
      <div>
        <Space>
          <InputNumber
            value={draft}
            min={min}
            max={max}
            step={step}
            disabled={loading || saving}
            onChange={(v) => setDraft(v)}
          />
          {suffix && <Text type="secondary">{suffix}</Text>}
          <Button size="small" icon={<ReloadOutlined />} onClick={load} disabled={loading || saving} />
          <Button
            size="small"
            type="primary"
            icon={<SaveOutlined />}
            onClick={save}
            loading={saving}
            disabled={!dirty || saving}
          >
            Save
          </Button>
          {stored != null && (
            <Button size="small" onClick={resetToDefault} disabled={loading || saving}>
              Reset to default
            </Button>
          )}
        </Space>
        {error && (
          <div style={{ marginTop: 4 }}>
            <Text type="danger" style={{ fontSize: 12 }}>{error}</Text>
          </div>
        )}
      </div>
    </div>
  );
}
