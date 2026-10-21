import DrawerWidget from "../../RightDrawer/DrawerWidget";
import React, { useEffect, useRef, useState } from "react";
import { Input, Form, Modal, Select, message } from "antd";
import Api from "@/api/ApiMethod";
import { useSelector } from "react-redux";
import Router from "next/router";

const CONTENT_SCOPE_OPTIONS = [
  { label: "This class only", value: "CLASS" },
  { label: "Shared to all sections", value: "SHARED" },
];

function getLessonCreateError(error) {
  const rawMessage =
    error?.response?.data?.message ??
    error?.response?.data?.error ??
    error?.message ??
    "";
  const status = error?.response?.status;
  const cleanedMessage = String(rawMessage)
    .replace(/^\d{3}\s+[A-Z_]+\s+/, "")
    .replace(/^"|"$/g, "")
    .trim();

  if (status === 409) {
    return cleanedMessage || "A lesson with this name already exists in this course.";
  }
  return cleanedMessage || "Failed to create lesson. Please try again.";
}

const AddLessonDrawer = (props) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [dirty, setDirty] = useState(false);
  const [contentScope, setContentScope] = useState("CLASS");

  const course = useSelector((state) => state.course);
  const loginUser = useSelector((state) => state.loginUser);

  useEffect(() => {
    if (!props.open || !dirty || submittingRef.current || typeof window === "undefined") return undefined;
    const beforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const beforeRouteChange = () => {
      if (window.confirm("Discard this unsaved lesson draft?")) return;
      const addressBar = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (addressBar !== Router.asPath) window.history.pushState(null, "", Router.asPath);
      // eslint-disable-next-line no-throw-literal
      throw "Route change aborted to preserve unsaved lesson draft.";
    };
    window.addEventListener("beforeunload", beforeUnload);
    Router.events.on("routeChangeStart", beforeRouteChange);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      Router.events.off("routeChangeStart", beforeRouteChange);
    };
  }, [props.open, dirty]);

  function resetAndClose() {
    form.resetFields();
    setContentScope("CLASS");
    setDirty(false);
    props.close();
  }

  function handleClose() {
    if (submittingRef.current) return;
    if (!dirty) {
      resetAndClose();
      return;
    }
    Modal.confirm({
      title: "Discard this lesson draft?",
      content: "Your unsaved lesson name and visibility choice will be lost.",
      okText: "Discard",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: resetAndClose,
    });
  }

  function handleCreate() {
    if (submittingRef.current) return;
    form.validateFields().then(() => {
      const lessonName = form.getFieldValue("Content_Name");
      if (!lessonName?.trim()) return;

      const courseId = props?.adminCourseId || course?.selectedCourseId;
      const courseSlug = props?.adminCourseSlug ?? course?.selectedCourseSlug;

      // This drawer is only ever opened from AdminCourseSyllabus.jsx, which has its OWN
      // "Select class to view" dropdown (adminSelectedClassId) separate from loginUser.classId --
      // unlike the teacher-facing course workspace, loginUser.classId is never kept in sync with
      // it here (that sync only happens in [...courseTab].js). Falling back to loginUser?.classId
      // silently scoped "This class only" lessons to the admin's own unrelated class (often none
      // at all), not the section they'd actually selected in the page above this drawer.
      const targetClassId = props?.adminSelectedClassId > 0 ? props.adminSelectedClassId : (loginUser?.classId || 0);
      const payload = {
        lesson_name: lessonName.trim(),
        course_id: courseId,
        class_id: contentScope === "SHARED" ? 0 : targetClassId,
        ...(courseSlug && { courseSlug }),
        active: true,
        enabled: true,
        sequence: 0,
      };

      submittingRef.current = true;
      setSubmitting(true);
      Api.post("/api/v1/lesson/create", payload)
        .then(() => {
          message.success("Lesson created successfully!");
          resetAndClose();
        })
        .catch((error) => {
          message.error(getLessonCreateError(error));
        })
        .finally(() => {
          submittingRef.current = false;
          setSubmitting(false);
        });
    });
  }

  return (
    <DrawerWidget
      title="Add Lesson"
      onClose={handleClose}
      drawerOpen={props.open}
      maskClosable={false}
      closable={!submitting}
      keyboard={!submitting}
      primaryButtonTitle="Cancel"
      secondaryButtonTitle={submitting ? "Saving..." : "Save"}
      disablePrimary={submitting}
      disableSecondary={submitting}
      secondaryLoading={submitting}
      onClickPrimary={handleClose}
      onClickSecondary={handleCreate}
      buttonJustification="justify-content-sm-end"
      customWidth="400px"
      showFooter={true}
      footerClass="ln-comn-foot"
      size="600px"
    >
      <div className="ln-drawer-body border-0 ln-drawer-body--small">
        <Form
          layout="vertical"
          form={form}
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
          autoComplete="off"
          disabled={submitting}
          onValuesChange={() => setDirty(true)}
        >
          <div className="row">
            <Form.Item
              name="Content_Name"
              label={<label className="ln-lb2">Lesson Name</label>}
              rules={[
                {
                  required: true,
                  message: "Enter lesson name",
                  whitespace: true,
                },
              ]}
              >
              <Input
                className="ln-in2"
                placeholder="Enter lesson name"
                maxLength={255}
              />
            </Form.Item>

            <div className="mb-4 position-relative">
              <label className="ln-lb2">Visibility</label>
              <Form.Item name="contentScope" initialValue="CLASS">
                <Select
                  options={CONTENT_SCOPE_OPTIONS}
                  value={contentScope}
                  onChange={(value) => { setContentScope(value); setDirty(true); }}
                />
              </Form.Item>
            </div>
          </div>
        </Form>
      </div>
    </DrawerWidget>
  );
};

export default React.memo(AddLessonDrawer);
