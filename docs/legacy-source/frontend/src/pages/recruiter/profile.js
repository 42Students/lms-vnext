import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Card, Descriptions, Form, Input, List, Result, Skeleton, Tag, Typography, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import PageShell from "@/components/Common/PageShell";
import { DetailSkeleton } from "@/components/Common/Skeletons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import { appAction, loginUserAction } from "@/redux/store";
import { getRecruiterMe, updateRecruiterMe } from "@/api/Services/RecruiterService";
import { isRecruiterType } from "@/config/roles";
import { dj } from "@/components/tpo/dj";
import Router from "next/router";

/**
 * The recruiter's profile. Name, designation and an optional mobile are theirs to change. The work email is how they sign in
 * (proven with a code when the account was made, N1), so it is shown, not edited; a different company means a new account.
 */
export default function RecruiterProfile() {
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);
  const [form] = Form.useForm();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [dirty, setDirty] = useState(false);
  const saveAttemptRef = useRef(false);

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("profile"));
  }, [dispatch]);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(false);
    getRecruiterMe()
      .then((res) => {
        const data = res?.data ?? null;
        setMe(data);
        const u = data?.user || {};
        form.setFieldsValue({
          firstName: u.firstName,
          lastName: u.lastName,
          designation: u.designation,
          contactMobile: u.contactMobile,
        });
        setDirty(false);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [form]);

  useEffect(() => {
    if (isRecruiterType(loginUser?.userType)) load();
  }, [load, loginUser?.userType]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const beforeRouteChange = () => {
      if (window.confirm("Discard your unsaved profile changes?")) return;
      const addressBar = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (addressBar !== Router.asPath) window.history.pushState(null, "", Router.asPath);
      // eslint-disable-next-line no-throw-literal
      throw "Route change aborted to preserve recruiter profile changes.";
    };
    window.addEventListener("beforeunload", warn);
    Router.events.on("routeChangeStart", beforeRouteChange);
    return () => {
      window.removeEventListener("beforeunload", warn);
      Router.events.off("routeChangeStart", beforeRouteChange);
    };
  }, [dirty]);

  const onSave = async () => {
    if (saving || saveAttemptRef.current || !dirty) return;
    saveAttemptRef.current = true;
    let values;
    try {
      values = await form.validateFields();
    } catch (_) {
      saveAttemptRef.current = false;
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const res = await updateRecruiterMe({ ...values, contactMobile: values.contactMobile ?? "" });
      const user = res?.data?.user;
      if (user) {
        setMe((prev) => ({ ...(prev || {}), user }));
        dispatch(loginUserAction.handleUserData({
          firstName: user.firstName,
          lastName: user.lastName,
          designation: user.designation,
        }));
      }
      setDirty(false);
      message.success("Profile saved");
    } catch (e) {
      const code = e?.response?.data?.error;
      if (code === "INVALID_MOBILE") form.setFields([{ name: "contactMobile", errors: ["Enter a valid 10-digit mobile number, or leave it blank"] }]);
      setSaveError(code === "INVALID_MOBILE" ? "Check the mobile number."
        : e?.response?.data?.message || "Could not save your profile. Your changes are still here; try again.");
    } finally {
      saveAttemptRef.current = false;
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="scroll-container learn-profile-page recruiter-profile recruiter-profile--state" data-testid="recruiter.profile.loading">
        <PageShell>
          <ListingPageHeader className="recruiter-profile__header" title="Profile" />
          <Card className="recruiter-profile__state-card"><DetailSkeleton label="Loading recruiter profile" withMedia={false} /></Card>
        </PageShell>
      </div>
    );
  }

  if (loadError || !me) {
    return (
      <div className="scroll-container learn-profile-page recruiter-profile recruiter-profile--state" data-testid="recruiter.profile.error">
        <PageShell>
          <ListingPageHeader className="recruiter-profile__header" title="Profile" />
          <Card className="recruiter-profile__state-card">
            <Result
              status="warning"
              title="We couldn't load your profile"
              extra={<Button type="primary" icon={<ReloadOutlined />} onClick={load}>Retry</Button>}
            />
          </Card>
        </PageShell>
      </div>
    );
  }

  const user = me.user || {};
  return (
    <div className="scroll-container learn-profile-page recruiter-profile" data-testid="recruiter.profile.ready">
      <PageShell>
        <ListingPageHeader
          className="recruiter-profile__header"
          title="Profile"
          rightContent={dirty ? <Tag color="orange">Unsaved changes</Tag> : null}
        />

        <div className="recruiter-profile__layout">
          <div className="recruiter-profile__main">
            <Card className="recruiter-profile__card" title="Your details">
              <Typography.Paragraph type="secondary">These details identify you to the placement cell.</Typography.Paragraph>
              {saveError ? <Alert type="error" showIcon message="Profile was not saved" description={saveError} style={{ marginBottom: 12 }} /> : null}
              <Form className="recruiter-profile__form" form={form} layout="vertical" requiredMark="optional" disabled={saving} onValuesChange={() => setDirty(true)}>
                <div className="recruiter-profile__field-grid">
                  <Form.Item name="firstName" label="First name" rules={[{ required: true, whitespace: true, message: "First name is required" }]}>
                    <Input maxLength={100} />
                  </Form.Item>
                  <Form.Item name="lastName" label="Last name">
                    <Input maxLength={100} />
                  </Form.Item>
                </div>
                <Form.Item name="contactMobile" label="Mobile" extra="Only for the placement cell to call you. You never sign in with it.">
                  <Input inputMode="tel" autoComplete="tel" maxLength={14} />
                </Form.Item>
                <Form.Item name="designation" label="Designation">
                  <Input maxLength={150} />
                </Form.Item>
                <div className="recruiter-profile__save-row">
                  <Button type="primary" onClick={onSave} loading={saving} disabled={!dirty || saving} data-testid="recruiter.profile.save">Save changes</Button>
                </div>
              </Form>
            </Card>

            <Card className="recruiter-profile__card recruiter-profile__colleges" title="College access">
              <Typography.Paragraph type="secondary">You are working with this college&apos;s placement cell. Your access is managed by the college: to stop working with it, ask its placement cell.</Typography.Paragraph>
              {Array.isArray(me.colleges) && me.colleges.length > 0 ? (
                <List size="small" dataSource={me.colleges} rowKey="collegeId" renderItem={(c) => (
                  <List.Item className="recruiter-profile__college-row">
                    <List.Item.Meta title={c.collegeName} description={c.validUntil ? `Access until ${dj(c.validUntil).format("D MMM YYYY")}. The placement cell can extend it.` : "Access has no end date"} />
                  </List.Item>
                )} />
              ) : (
                <div className="recruiter-profile__empty-colleges"><Typography.Text type="secondary">No college access.</Typography.Text></div>
              )}
            </Card>
          </div>

          <aside className="recruiter-profile__account">
            <Card className="recruiter-profile__card" title="Account">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Work email"><span data-testid="recruiter.profile.email">{user.contactMail || "—"}</span></Descriptions.Item>
                <Descriptions.Item label="Company">{user.companyName || "—"}</Descriptions.Item>
                <Descriptions.Item label="College">{me.user?.collegeName || "—"}</Descriptions.Item>
              </Descriptions>
              {/* The sign-in email is shown once, here, as a fact: as a form field it read "Work email (optional)" and looked
                  editable (UX audit, 19 Oct 2026). Recruiters deal with the college, never "42". */}
              <Typography.Paragraph type="secondary" className="recruiter-profile__managed-note">You sign in with your work email, so it can&apos;t be changed. Your company comes from it; to change the company&apos;s name or logo, ask the placement cell.</Typography.Paragraph>
            </Card>
          </aside>
        </div>
      </PageShell>
    </div>
  );
}
