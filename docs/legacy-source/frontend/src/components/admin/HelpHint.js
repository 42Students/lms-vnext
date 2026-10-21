import { useState } from "react";
import { Button, Modal, Typography } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";

const { Paragraph } = Typography;

/**
 * A field label's explanation, one click away instead of a hover tooltip. Tenant Setup audit: a
 * form with several fields each carrying a long inline tooltip (or worse, a paragraph of prose
 * wedged into the label itself) reads as overwhelming before anyone's typed a single character —
 * and a hover tooltip is unreachable on a touch device in the first place. This renders just a
 * small "?" next to the label; the explanation only appears once someone actually asks for it.
 *
 * Usage: <FormItemLabelWithHelp label="Unique ID" help="A short, permanent code...">
 * or standalone: <HelpHint title="Unique ID / Code">A short, permanent code...</HelpHint>
 */
export default function HelpHint({ title, children, label }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {label ? <span style={{ marginRight: 6 }}>{label}</span> : null}
      <Button
        type="text"
        size="small"
        icon={<QuestionCircleOutlined />}
        aria-label={`What is ${title || label}?`}
        onClick={(e) => {
          // Field labels are often inside a clickable Form.Item — stop this from also toggling
          // whatever the label itself is wired to.
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        style={{ padding: 0, height: "auto", lineHeight: 1, verticalAlign: "middle" }}
      />
      <Modal
        title={title || label}
        open={open}
        onCancel={() => setOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setOpen(false)}>
            Got it
          </Button>,
        ]}
      >
        <Paragraph style={{ marginBottom: 0, whiteSpace: "pre-line" }}>{children}</Paragraph>
      </Modal>
    </>
  );
}

/** A Form.Item label with a HelpHint appended — the common case, so call sites don't repeat the layout. */
export function LabelWithHelp({ label, title, children }) {
  return (
    <span>
      {label} <HelpHint title={title || label}>{children}</HelpHint>
    </span>
  );
}
