import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { serverTime } from "@/components/tpo/dj";
import { Alert, DatePicker, Form, Input, Modal, Select, message } from "antd";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { globalSearch } from "@/api/Services/TpoHubService";
import { addFollowUp } from "@/api/Services/TpoService";
import Router from "next/router";

/**
 * Add a follow-up for a recruiter lead at a chosen time. Opens from the calendar already set to the time that was clicked.
 * Props: open, initialAt (dayjs), onClose, onSaved
 */
export default function FollowUpModal({ open, initialAt, onClose, onSaved }) {
  const [form] = Form.useForm();
  const [options, setOptions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const busyRef = useRef(false);
  const searchSeqRef = useRef(0);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ dueAt: initialAt || undefined });
      setOptions([]);
      setSearchError(null);
      setDirty(false);
    }
  }, [open, initialAt, form]);

  useEffect(() => {
    if (!open || !dirty || busyRef.current || typeof window === "undefined") return undefined;
    const beforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const beforeRouteChange = () => {
      if (window.confirm("Discard this follow-up draft?")) return;
      const addressBar = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (addressBar !== Router.asPath) window.history.pushState(null, "", Router.asPath);
      // eslint-disable-next-line no-throw-literal
      throw "Route change aborted to preserve follow-up draft.";
    };
    window.addEventListener("beforeunload", beforeUnload);
    Router.events.on("routeChangeStart", beforeRouteChange);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      Router.events.off("routeChangeStart", beforeRouteChange);
    };
  }, [open, dirty]);

  const find = async (q) => {
    const requestId = ++searchSeqRef.current;
    if (!q || q.trim().length < 2) {
      setOptions([]);
      setSearchError(null);
      return;
    }
    const res = await fetchWithErrorHandling(globalSearch(q));
    if (requestId !== searchSeqRef.current) return;
    if (!res.success || !Array.isArray(res.data?.recruiterLeads)) {
      setOptions([]);
      setSearchError(res?.data?.message || res?.data?.error || "Recruiter search could not be loaded. Type again to retry.");
      return;
    }
    setSearchError(null);
    setOptions(res.data.recruiterLeads.map((l) => ({ value: l.id, label: `${l.name} · ${l.company || ""}` })));
  };

  const save = async (submittedValues) => {
    if (busyRef.current || busy || searchError) return;
    let v = submittedValues;
    try {
      v = v || await form.validateFields();
    } catch (error) {
      if (error?.errorFields) return;
      throw error;
    }
    busyRef.current = true;
    setBusy(true);
    setSaveError("");
    try {
      const res = await fetchWithErrorHandling(addFollowUp(v.recruiterLeadId, { dueAt: serverTime(v.dueAt), note: v.note || null }));
      if (!res.success) {
        const errorMessage = res?.data?.message || res?.data?.error || "Could not save the follow-up";
        setSaveError(errorMessage);
        message.error(errorMessage);
        return;
      }
      setDirty(false);
      message.success("Follow-up added");
      onSaved?.();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const requestClose = () => {
    if (busyRef.current || busy) {
      message.info("Wait for the follow-up to finish saving.");
      return;
    }
    if (!dirty) {
      onClose?.();
      return;
    }
    Modal.confirm({
      title: "Discard this follow-up draft?",
      content: "The recruiter, time or note you entered has not been saved.",
      okText: "Discard",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => { setDirty(false); onClose?.(); },
    });
  };

  return (
    <Modal
      open={open}
      title="New follow-up"
      okText="Add"
      confirmLoading={busy}
      onOk={() => form.submit()}
      onCancel={requestClose}
      okButtonProps={{ disabled: busy || Boolean(searchError) }}
      cancelButtonProps={{ disabled: busy }}
      closable={!busy}
      maskClosable={false}
      keyboard={!busy}
      destroyOnClose
    >
      {searchError && <Alert type="error" showIcon style={{ marginBottom: 12 }} message="Recruiter search unavailable" description={searchError} />}
      {saveError ? <Alert type="error" showIcon message="Follow-up was not saved" description={saveError}
        closable onClose={() => setSaveError("")} style={{ marginBottom: 12 }} /> : null}
      <Form form={form} layout="vertical" onFinish={save} onValuesChange={() => { setSaveError(""); setDirty(true); }}>
        <Form.Item name="recruiterLeadId" label="Recruiter" rules={[{ required: true, message: "Choose a recruiter" }]}>
          <Select showSearch filterOption={false} onSearch={find} options={options} placeholder="Type a name or company" autoFocus />
        </Form.Item>
        <Form.Item
          name="dueAt"
          label="When"
          rules={[
            { required: true, message: "Pick a date and time" },
            { validator: (_, value) => !value || value.isAfter(dayjs()) ? Promise.resolve() : Promise.reject(new Error("Pick a future date and time")) },
          ]}
        >
          <DatePicker
            showTime={{ format: "h:mm A" }}
            format="D MMM YYYY, h:mm A"
            minuteStep={5}
            disabledDate={(current) => current && current.isBefore(dayjs().startOf("day"), "day")}
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item name="note" label="Note (optional)"><Input.TextArea rows={2} /></Form.Item>
      </Form>
    </Modal>
  );
}
