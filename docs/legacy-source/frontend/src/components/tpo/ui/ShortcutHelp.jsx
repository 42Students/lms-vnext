import { useEffect, useRef, useState } from "react";
import { Modal, Typography } from "antd";
import { CREATE, GO_TO, isTypingTarget, resolveShortcut } from "./shortcuts";

/** Mounts the portal's keyboard shortcuts and the "?" help window. Render once, inside the TPO shell. */
export default function ShortcutHelp({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const prev = useRef({ key: null, at: 0 });

  useEffect(() => {
    const onKey = (e) => {
      const result = resolveShortcut({
        key: e.key, prevKey: prev.current.key, prevAt: prev.current.at,
        modifiers: e.ctrlKey || e.metaKey || e.altKey, typing: isTypingTarget(e.target),
      });
      prev.current = { key: String(e.key || "").toLowerCase(), at: Date.now() };
      if (!result) return;
      if (result.action === "help") { e.preventDefault(); setOpen(true); }
      else if (result.action === "go") { e.preventDefault(); prev.current = { key: null, at: 0 }; onNavigate(result.href); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNavigate]);

  const row = (keys, label) => (
    <div className="tpo-shortcuts__row" key={label}><span>{label}</span><span>{keys.map((k) => <kbd key={k}>{k}</kbd>)}</span></div>
  );
  return (
    <Modal open={open} onCancel={() => setOpen(false)} footer={null} title="Keyboard shortcuts" width={460}>
      <Typography.Text type="secondary">Press a key, then the next one. They do nothing while you are typing in a box.</Typography.Text>
      <div className="tpo-shortcuts">
        <Typography.Text strong>Go to</Typography.Text>
        {GO_TO.map((g) => row(["G", g.key.toUpperCase()], g.label))}
        <Typography.Text strong>Create</Typography.Text>
        {CREATE.map((g) => row(["N", g.key.toUpperCase()], g.label))}
        <Typography.Text strong>Anywhere</Typography.Text>
        {row(["Ctrl", "K"], "Search and jump")}
        {row(["?"], "Show this list")}
        <Typography.Text strong>Reviewing applicants</Typography.Text>
        {row(["S"], "Shortlist")}
        {row(["R"], "Not selected")}
        {row(["←", "→"], "Previous, next student")}
      </div>
    </Modal>
  );
}
