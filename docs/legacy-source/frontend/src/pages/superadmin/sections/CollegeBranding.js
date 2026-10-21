import { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Form, Input, Segmented, message } from "antd";
import { ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { deleteFileFromR2 } from "@/api/Services/AdminService";
import { getCollegeBranding, upsertCollegeBranding } from "@/api/Services/TenantAdminService";
import BrandingImageUpload from "@/components/Global/CroppedImageUpload/BrandingImageUpload";
import { useUnsavedFormGuard } from "@/components/admin/projects/useUnsavedFormGuard";


// Preview background: the login page's teal halo (the same for every college).
const LOGIN_PREVIEW_BACKGROUND = "radial-gradient(ellipse 45% 40% at 52% 50%, #0a7c8822, transparent 70%), radial-gradient(ellipse 75% 70% at 50% 48%, #26bac740, #7dd3e01a 45%, transparent 75%), #f6f8fb";

// onDirtyChange/onBusyChange let the Manage College drawer guard its close (unsaved branding, save in flight).
const CollegeBranding = ({ fixedCollegeId = null, hideCollegePicker = false, onDirtyChange, onBusyChange } = {}) => {
  const [form] = Form.useForm();
  const [collegeId, setCollegeId] = useState(fixedCollegeId);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const savingRef = useRef(false);
  const requestSeq = useRef(0);
  const activeCollegeRef = useRef(fixedCollegeId);
  const previousCollegeRef = useRef(fixedCollegeId);
  activeCollegeRef.current = fixedCollegeId;
  const [fetching, setFetching] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const isCollegeScoped = fixedCollegeId != null;
  const logoUrlPreview = Form.useWatch("logoUrl", form);
  const [previewMode, setPreviewMode] = useState("desktop");

  useUnsavedFormGuard(form, { enabled: Boolean(collegeId) && !loading && !fetching });
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    onBusyChange?.(loading);
  }, [loading, onBusyChange]);

  // BUGFIX: images used to be deleted from storage the instant the admin replaced/removed one in
  // the form -- before Save was ever clicked. This queues each replaced/removed file's storage key
  // instead, and only actually deletes them once the form has genuinely saved successfully (see
  // handleStaleKey / save below). Abandoning an edit now just leaves an unreferenced, harmless
  // orphan file in storage instead of a broken image on the college's real login page.
  const staleKeysRef = useRef(new Set());
  const handleStaleKey = (key) => {
    if (key) staleKeysRef.current.add(key);
  };

  const loadBranding = async (id) => {
    if (!id) return;
    const requestId = ++requestSeq.current;
    setFetching(true);
    setLoadError(null);
    form.resetFields();
    setDirty(false);
    staleKeysRef.current = new Set();
    try {
      const res = await getCollegeBranding(id);
      if (requestId !== requestSeq.current || Number(activeCollegeRef.current) !== Number(id)) return;
      const b = res?.data?.branding ?? res?.data?.data?.branding ?? res?.data?.data ?? null;
      form.setFieldsValue({
        logoUrl: b?.logoUrl || "",
      });
    } catch (e) {
      if (requestId !== requestSeq.current || Number(activeCollegeRef.current) !== Number(id)) return;
      setLoadError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Couldn't load branding for this college.");
    } finally {
      if (requestId === requestSeq.current && Number(activeCollegeRef.current) === Number(id)) setFetching(false);
    }
  };

  useEffect(() => {
    if (!isCollegeScoped) return undefined;
    const targetCollegeId = fixedCollegeId ?? collegeId;
    if (previousCollegeRef.current != null && Number(previousCollegeRef.current) !== Number(targetCollegeId)
        && form.isFieldsTouched()) {
      message.warning("Unsaved branding changes were discarded because the selected college changed.");
    }
    previousCollegeRef.current = targetCollegeId;
    activeCollegeRef.current = targetCollegeId;
    if (fixedCollegeId && collegeId !== fixedCollegeId) setCollegeId(fixedCollegeId);
    if (targetCollegeId) loadBranding(targetCollegeId);
    else form.resetFields();
    return () => { ++requestSeq.current; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId, fixedCollegeId, isCollegeScoped]);

  const save = async (values) => {
    if (savingRef.current) return;
    const targetCollegeId = fixedCollegeId ?? collegeId;
    if (!targetCollegeId) {
      message.warning("Choose a college first");
      return;
    }
    savingRef.current = true;
    setLoading(true);
    try {
      await upsertCollegeBranding(targetCollegeId, values);
      if (Number(activeCollegeRef.current) !== Number(targetCollegeId)) return;
      message.success("Branding saved");
      setDirty(false);
      // Only now — after the save that actually persisted the new URLs has succeeded — are the
      // files those URLs replaced safe to delete. Best-effort per key: one failing (already gone,
      // a transient network blip) shouldn't stop the others from being cleaned up.
      const staleKeys = Array.from(staleKeysRef.current);
      staleKeysRef.current = new Set();
      staleKeys.forEach((key) => {
        deleteFileFromR2(key, { collegeId: targetCollegeId }).catch(() => {});
      });
      loadBranding(targetCollegeId);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.response?.data?.message || e.message;
      message.error(`Couldn't save branding: ${msg}`);
    } finally {
      savingRef.current = false;
      setLoading(false);
    }
  };

  return (
    !isCollegeScoped ? (
      <Card title="Look and feel" size="small">
        <Alert
          type="info"
          showIcon
          message="Pick a college first"
          description="Branding belongs to one college. Choose a college in the header so changes can't land on the wrong one."
        />
      </Card>
    ) : (
    <Card
      title="Look and feel"
      size="small"
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={() => collegeId && loadBranding(collegeId)}
          disabled={!collegeId}
          size="small"
        >
          Reload
        </Button>
      }
      loading={fetching}
    >
      {loadError ? (
        <Alert
          type="error"
          showIcon
          message="Branding could not be loaded"
          description={loadError}
          action={<Button size="small" onClick={() => collegeId && loadBranding(collegeId)}>Retry</Button>}
          style={{ marginBottom: 16 }}
        />
      ) : null}
      <div style={{ color: "#595959", fontSize: 13, marginBottom: 16 }}>
        What students and staff see the moment they open this college&apos;s web address — the
        login page. This is purely cosmetic (it doesn&apos;t affect who can log in or how), so
        there&apos;s no wrong order to fill these in, and nothing here is required: a college with
        every field blank still logs in fine on the default 42LMS look. Fill in as much as the
        college has given you.
      </div>
      <Form form={form} layout="vertical" onFinish={save} onValuesChange={() => setDirty(true)}>
        <Form.Item
          name="logoUrl"
          label="Logo"
          extra="Shown at the top of the sign-in card, next to the college name. Without a logo, the college's initials are shown in the brand colour. Square image works best."
        >
          <BrandingImageUpload collegeId={collegeId} aspect={1} minWidth={200} minHeight={200} onStaleKey={handleStaleKey} />
        </Form.Item>
        {/* Mirrors the real login page (src/loginPages/Login.js): the light page with the teal halo; the white card
            with the logo (or initials) and the college name; the button in 42LMS teal. An approximation: the real
            page also has the floating symbols and the full form. */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Preview</div>
          <Segmented
            size="small"
            value={previewMode}
            onChange={setPreviewMode}
            options={[
              { label: "Desktop", value: "desktop" },
              { label: "Mobile", value: "mobile" },
            ]}
            style={{ marginBottom: 12 }}
          />
          {(() => {
            const accent = "#0a7c88"; // 42LMS teal: the login page never takes a college's colour
            const desktop = previewMode === "desktop";
            const width = desktop ? 340 : 170;
            const height = desktop ? Math.round((340 * 9) / 16) : Math.round((170 * 16) / 9);
            return (
              <div
                style={{
                  width,
                  height,
                  borderRadius: 12,
                  border: "1px solid #d9d9d9",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: desktop ? "center" : "flex-start",
                  justifyContent: "center",
                  paddingTop: desktop ? 0 : 28,
                  background: LOGIN_PREVIEW_BACKGROUND,
                }}
              >
                <div
                  style={{
                    width: desktop ? 128 : 138,
                    padding: 10,
                    borderRadius: 8,
                    background: "#fff",
                    border: "1px solid #e7ecf2",
                    boxShadow: "0 6px 16px -8px rgba(16, 24, 40, 0.25)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 5, paddingBottom: 6, marginBottom: 7, borderBottom: "1px solid #e7ecf2" }}>
                    {logoUrlPreview ? (
                      <img src={logoUrlPreview} alt="Logo preview" style={{ width: 16, height: 16, objectFit: "contain" }} />
                    ) : (
                      <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: 4, background: `${accent}22`, boxShadow: `inset 0 0 0 1px ${accent}55` }} />
                    )}
                    <span style={{ height: 5, width: 50, borderRadius: 2, background: "#172033" }} />
                  </div>
                  <div style={{ height: 6, width: 34, borderRadius: 2, background: "#172033", marginBottom: 8 }} />
                  <div style={{ height: 12, borderRadius: 3, border: "1px solid #d6e1ee", marginBottom: 6 }} />
                  <div style={{ height: 12, borderRadius: 3, background: accent }} />
                </div>
              </div>
            );
          })()}
          <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 6 }}>
            Approximation — the real page also shows the floating symbols and the full sign-in form.
          </div>
        </div>

        <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} disabled={!collegeId || Boolean(loadError) || fetching}>
          Save
        </Button>
      </Form>
    </Card>
    )
  );
};

export default CollegeBranding;
