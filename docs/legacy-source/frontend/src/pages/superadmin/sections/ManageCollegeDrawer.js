import { Drawer, Modal, Tabs, Tag, message } from "antd";
import { useCallback, useEffect, useState } from "react";
import CollegeSubdomain from "./CollegeSubdomain";
import CollegeBranding from "./CollegeBranding";
import CollegeSignIn from "./CollegeSignIn";
import AdminUsers from "./AdminUsers";
import AuditLogs from "./AuditLogs";

export default function ManageCollegeDrawer({ open, onClose, college }) {
  const collegeId = college?.id ?? college?.collegeId ?? null;
  const orgId = college?.orgId ?? college?.organizationId ?? null;
  const [windowWidth, setWindowWidth] = useState(1024);
  const [childDirty, setChildDirty] = useState({ domains: false, signin: false, branding: false, admins: false });
  const [childBusy, setChildBusy] = useState({ domains: false, signin: false, branding: false, admins: false });

  const reportDirty = useCallback((key, value) => {
    setChildDirty((current) => current[key] === Boolean(value)
      ? current
      : { ...current, [key]: Boolean(value) });
  }, []);
  const reportBusy = useCallback((key, value) => {
    setChildBusy((current) => current[key] === Boolean(value)
      ? current
      : { ...current, [key]: Boolean(value) });
  }, []);
  const onDomainsDirty = useCallback((value) => reportDirty("domains", value), [reportDirty]);
  const onBrandingDirty = useCallback((value) => reportDirty("branding", value), [reportDirty]);
  const onAdminsDirty = useCallback((value) => reportDirty("admins", value), [reportDirty]);
  const onSignInDirty = useCallback((value) => reportDirty("signin", value), [reportDirty]);
  const onDomainsBusy = useCallback((value) => reportBusy("domains", value), [reportBusy]);
  const onBrandingBusy = useCallback((value) => reportBusy("branding", value), [reportBusy]);
  const onAdminsBusy = useCallback((value) => reportBusy("admins", value), [reportBusy]);
  const onSignInBusy = useCallback((value) => reportBusy("signin", value), [reportBusy]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setWindowWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    setChildDirty({ domains: false, signin: false, branding: false, admins: false });
    setChildBusy({ domains: false, signin: false, branding: false, admins: false });
  }, [collegeId, open]);

  const drawerWidth = windowWidth < 768 ? "100%" : 980;
  const hasDirtyChild = Object.values(childDirty).some(Boolean);
  const hasBusyChild = Object.values(childBusy).some(Boolean);

  const finishClose = () => {
    setChildDirty({ domains: false, signin: false, branding: false, admins: false });
    setChildBusy({ domains: false, signin: false, branding: false, admins: false });
    onClose?.();
  };

  const requestClose = () => {
    if (hasBusyChild) {
      message.info("Wait for the current college setup action to finish.");
      return;
    }
    if (!hasDirtyChild) {
      finishClose();
      return;
    }
    const dirtySections = [
      childDirty.domains ? "web address" : null,
      childDirty.signin ? "sign-in" : null,
      childDirty.branding ? "branding" : null,
      childDirty.admins ? "admin account" : null,
    ].filter(Boolean);
    Modal.confirm({
      title: "Discard unsaved college setup changes?",
      content: `Unsaved ${dirtySections.join(", ")} changes will be lost if you close this drawer.`,
      okText: "Discard and close",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: finishClose,
    });
  };

  if (!collegeId) {
    return (
      <Drawer
        title="Manage College"
        open={open}
        onClose={onClose}
        width={drawerWidth}
        destroyOnClose
      >
        <div style={{ padding: 16 }}>
          <Tag color="red">Missing collegeId</Tag>
          <div style={{ marginTop: 8, color: "#666" }}>
            This drawer requires a valid college record. Refresh the Colleges list and try again.
          </div>
        </div>
      </Drawer>
    );
  }

  return (
    <Drawer
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 600 }}>{college?.name ?? "Manage College"}</div>
          {collegeId ? <Tag color="blue">ID: {collegeId}</Tag> : null}
          {orgId ? (
            <Tag title={`Organization ID ${orgId}`}>
              Org: {college?.organizationName || `#${orgId}`}
            </Tag>
          ) : null}
        </div>
      }
      open={open}
      onClose={requestClose}
      width={drawerWidth}
      destroyOnClose
      maskClosable={false}
      closable={!hasBusyChild}
      keyboard={!hasBusyChild}
      styles={{ body: { padding: 0 } }}
    >
      <Tabs
        defaultActiveKey="domains"
        items={[
          {
            key: "domains",
            label: "Web address",
            children: (
              <div style={{ padding: 16 }}>
                <CollegeSubdomain fixedCollegeId={collegeId} onDirtyChange={onDomainsDirty} onBusyChange={onDomainsBusy} />
              </div>
            ),
          },
          {
            key: "signin",
            label: "Sign-in",
            children: (
              <div style={{ padding: 16 }}>
                <CollegeSignIn fixedCollegeId={collegeId} onDirtyChange={onSignInDirty} onBusyChange={onSignInBusy} />
              </div>
            ),
          },
          {
            key: "branding",
            label: "Branding",
            children: (
              <div style={{ padding: 16 }}>
                <CollegeBranding
                  fixedCollegeId={collegeId}
                  hideCollegePicker
                  onDirtyChange={onBrandingDirty}
                  onBusyChange={onBrandingBusy}
                />
              </div>
            ),
          },
          {
            key: "admins",
            label: "Admins",
            children: (
              <div style={{ padding: 16 }}>
                <AdminUsers
                  key={collegeId ?? "none"} // BE-0135/0136: another college's admins start afresh
                  fixedCollegeId={collegeId}
                  onDirtyChange={onAdminsDirty}
                  onBusyChange={onAdminsBusy}
                />
              </div>
            ),
          },
          {
            key: "activity",
            label: "Activity",
            children: (
              <div style={{ padding: 16 }}>
                <AuditLogs fixedCollegeId={collegeId} hideFilters />
              </div>
            ),
          },
        ]}
      />
    </Drawer>
  );
}
