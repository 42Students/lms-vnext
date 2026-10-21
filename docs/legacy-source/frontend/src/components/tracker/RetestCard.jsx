import { useState } from "react";
import { Button, Input, message } from "antd";
import { retestBugReport } from "@/api/Services/BugTrackerService";

const { TextArea } = Input;

export default function RetestCard({ issue, onRetested }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState("");

  if (!issue || issue.status !== "READY_FOR_RETEST") return null;

  const submit = async (result) => {
    if (saving) return;
    setSaving(result);
    try {
      const updated = await retestBugReport(issue.publicId, result, note);
      onRetested?.(updated);
      message.success(result === "PASS" ? "Retest passed — issue closed" : "Retest failed — issue reopened");
    } catch (error) {
      message.error(error?.message || "Retest result could not be saved.");
    } finally {
      setSaving("");
    }
  };

  return (
    <section className="tracker-retest-card">
      <div>
        <p className="tracker-eyebrow">Ready for retest</p>
        <h2>Does it work now?</h2>
        <p>Check the same flow once more. One click sends it back to engineering or closes it.</p>
      </div>

      <TextArea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        autoSize={{ minRows: 2, maxRows: 4 }}
        maxLength={1000}
        placeholder="Optional note — what did you observe?"
      />

      <div className="tracker-retest-actions">
        <Button
          danger
          disabled={Boolean(saving)}
          loading={saving === "FAIL"}
          onClick={() => submit("FAIL")}
        >
          Still broken
        </Button>
        <Button
          type="primary"
          disabled={Boolean(saving)}
          loading={saving === "PASS"}
          onClick={() => submit("PASS")}
        >
          Works now
        </Button>
      </div>
    </section>
  );
}
