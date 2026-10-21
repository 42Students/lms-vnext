import React, { useEffect } from "react";
import { Modal } from "antd";

function ProjectModalShell({ children, bodyStyle = { padding: 20 }, className, title = null, width = 1120, open, onCancel, ...props }) {
  // AntD's built-in Escape handling doesn't reliably fire for these modals (rc-dialog's
  // keydown listener sits on .ant-modal-wrap, which isn't always what ends up focused) —
  // wire it explicitly so Escape always closes, matching every other modal convention.
  useEffect(() => {
    if (!open || !onCancel) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onCancel(event);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  return (
    <Modal
      title={title}
      width={width}
      footer={null}
      bodyStyle={bodyStyle}
      destroyOnClose
      className={className}
      open={open}
      onCancel={onCancel}
      // AntD portals modals to document.body by default, which is a real DOM sibling of (not a
      // descendant of) the page's ".learn-projects" wrapper — so every one of this module's
      // scoped SCSS rules (all nested under ".learn-projects { ... }") silently never matched any
      // modal's content, no matter how carefully those rules were written. Rendering into
      // ".learn-projects" itself keeps the DOM nesting intact so the existing scoped styles apply;
      // ".learn-projects" uses overflow, not a transform/filter, so the modal's own
      // position: fixed overlay still escapes it and covers the full viewport as expected.
      getContainer={() => document.querySelector(".learn-projects") || document.body}
      {...props}
    >
      {children}
    </Modal>
  );
}

export default ProjectModalShell;
