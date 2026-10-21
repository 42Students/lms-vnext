import { useCallback, useEffect, useRef, useState } from "react";
import { serverTime } from "@/components/tpo/dj";
import { useRouter } from "next/router";
import { Badge, Button, DatePicker, Dropdown, Form, Input, Modal, Select, Space, Typography, message } from "antd";
import { BellOutlined, MessageOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import TpoBellPanel from "./TpoBellPanel";
import TpoCommandPalette from "./TpoCommandPalette";
import ShortcutHelp from "./ui/ShortcutHelp";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getCounts, globalSearch } from "@/api/Services/TpoHubService";
import { addFollowUp } from "@/api/Services/TpoService";

/**
 * The TPO top bar (TPO V1 - Locked.docx §1): a record finder (Ctrl+K: students, recruiters, companies, drives; never pages, the sidebar does that), + New (RecruiterLead, Drive, Follow-up), Messages and the Bell.
 */
export default function TpoTopBar() {
  const router = useRouter();
  const [unread, setUnread] = useState({ bell: 0, messages: 0 });
  const [followOpen, setFollowOpen] = useState(false);
  const [recruiterLeadOptions, setRecruiterLeadOptions] = useState([]);
  const [followBusy, setFollowBusy] = useState(false);
  const [followForm] = Form.useForm();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen(true); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Two numbers from one light call. The bell number is this person's own unread count.
  const loadCounts = useCallback(async () => {
    const c = await fetchWithErrorHandling(getCounts());
    if (c.success && c.data) setUnread({ bell: Number(c.data.bell) || 0, messages: Number(c.data.messages) || 0 });
  }, []);
  // Every 30 seconds while the tab is in view; a background tab is skipped and catches up the moment it is looked at again.
  useEffect(() => {
    loadCounts();
    const tick = () => { if (document.visibilityState !== "hidden") loadCounts(); };
    const i = setInterval(tick, 30000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(i); document.removeEventListener("visibilitychange", tick); };
  }, [loadCounts]);

  // BE-0101: an older search finishing late can't replace the options for the newer text (a follow-up could land on the wrong recruiter).
  const recruiterSearchSeq = useRef(0);
  const findRecruiterLeads = async (q) => {
    const seq = ++recruiterSearchSeq.current;
    if (!q || q.trim().length < 2) { setRecruiterLeadOptions([]); return; }
    const res = await fetchWithErrorHandling(globalSearch(q));
    if (seq !== recruiterSearchSeq.current) return;
    setRecruiterLeadOptions((res.data?.recruiterLeads || []).map((l) => ({ value: l.id, label: `${l.name} · ${l.company || ""}` })));
  };
  const saveFollowUp = async () => {
    const v = await followForm.validateFields();
    setFollowBusy(true);
    const res = await fetchWithErrorHandling(addFollowUp(v.recruiterLeadId, { dueAt: serverTime(v.dueAt), note: v.note || null }));
    setFollowBusy(false);
    if (!res.success) { message.error(res?.data?.message || res?.data?.error || "Could not save the follow-up"); return; }
    message.success("Follow-up added. It shows on the calendar.");
    setFollowOpen(false); followForm.resetFields();
  };

  // SHELL-12: on a company's own page, +New leads with actions scoped to that company (prefilled,
  // one click closer) instead of the same generic three items everywhere. Every other page keeps
  // the full menu — this only narrows when there's a specific company already in view.
  const companyContext = router.pathname === "/tpo/companies" && typeof router.query.name === "string" ? router.query.name : null;
  const newMenu = { items: companyContext ? [
    { key: "recruiterLead", label: `New recruiter lead for ${companyContext}`, onClick: () => router.push(`/tpo/recruiters?add=1&company=${encodeURIComponent(companyContext)}`) },
    { key: "drive", label: `New drive for ${companyContext}`, onClick: () => router.push(`/tpo/drives/new?company=${encodeURIComponent(companyContext)}`) },
    { type: "divider" },
    { key: "follow", label: "Follow-up", onClick: () => setFollowOpen(true) },
  ] : [
    { key: "recruiterLead", label: "Recruiter lead", onClick: () => router.push("/tpo/recruiters?add=1") },
    { key: "drive", label: "Drive", onClick: () => router.push("/tpo/drives/new") },
    { key: "follow", label: "Follow-up", onClick: () => setFollowOpen(true) },
  ] };

  // SHELL-10: was "col-4" (capped to 33% of the header), which packed Season + 220px search +
  // New + Messages + Bell into too little room and forced wrapping. A dedicated command-bar
  // class gives it room to grow instead of fighting the generic header's column width.
  return (
    <div className="ln-glob-sch tpo-command-bar" data-testid="tpo.topbar">
      {/* A trigger, not the search itself: it opens the finder, which looks up a person or a record and opens it. */}
      <button
        type="button"
        className="tpo-command-bar__search"
        onClick={() => setPaletteOpen(true)}
        data-testid="tpo.command-palette.trigger"
        aria-label="Find a student, recruiter, company or drive"
      >
        <SearchOutlined aria-hidden="true" />
        <span>Find a student, recruiter or company</span>
        <kbd>Ctrl K</kbd>
      </button>

      <div className="tpo-command-bar__actions">
        <Dropdown menu={newMenu} trigger={["click"]}>
          <Button className="tpo-command-bar__new" size="small" type="primary" icon={<PlusOutlined />}>New</Button>
        </Dropdown>
        <Badge count={unread.messages} size="small">
          <Button className="tpo-command-bar__icon-btn" size="small" icon={<MessageOutlined />} aria-label="Messages" onClick={() => router.push("/tpo/messages")} />
        </Badge>
        <Badge count={unread.bell} size="small">
          <Button className="tpo-command-bar__icon-btn" size="small" icon={<BellOutlined />} aria-label="Notifications" onClick={() => setBellOpen(true)} />
        </Badge>
      </div>
      <ShortcutHelp onNavigate={(href) => router.push(href)} />
      <TpoBellPanel open={bellOpen} onClose={() => setBellOpen(false)} onNavigate={(href) => router.push(href)} onChanged={loadCounts} />
      <TpoCommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onNavigate={(href) => router.push(href)} />
      <Modal open={followOpen} title="New follow-up" okText="Add" confirmLoading={followBusy} onOk={saveFollowUp} onCancel={() => setFollowOpen(false)} destroyOnClose>
        <Form form={followForm} layout="vertical">
          <Form.Item name="recruiterLeadId" label="Recruiter" rules={[{ required: true, message: "Choose a recruiter" }]}><Select showSearch filterOption={false} onSearch={findRecruiterLeads} options={recruiterLeadOptions} placeholder="Type a name or company" /></Form.Item>
          <Form.Item name="dueAt" label="When" rules={[{ required: true, message: "Pick a date and time" }]}><DatePicker showTime style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="note" label="Note (optional)"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
