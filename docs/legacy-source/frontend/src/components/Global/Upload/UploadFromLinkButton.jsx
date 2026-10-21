import React, { useId, useRef, useState } from "react";
import { Alert, Button, Input, Modal, message } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import { importFileFromUrl } from "@/api/Services/AdminService";

function UploadFromLinkButton({
  children = "Upload from Drive link",
  folder,
  type = "generic",
  userId,
  courseId,
  classId,
  lessonContentId,
  onImported,
  onUploadingChange,
  buttonProps = {},
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [importError, setImportError] = useState(null);
  const importRef = useRef(false);
  const urlInputId = useId();
  const urlHintId = `${urlInputId}-hint`;
  const urlErrorId = `${urlInputId}-error`;

  const handleImport = async () => {
    if (importRef.current || loading) return;
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      message.error("Paste a Google Drive file link");
      return;
    }
    importRef.current = true;
    setImportError(null);
    setLoading(true);
    try {
      // Let parent forms block their final submit throughout the actual import.
      onUploadingChange?.(true);
      const result = await importFileFromUrl({ url: cleanUrl, folder, type, userId, courseId, classId, lessonContentId });
      await onImported?.(result);
      message.success("Imported and uploaded successfully");
      setUrl("");
      setOpen(false);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Could not import this link";
      setImportError(errorMessage);
      message.error(errorMessage);
    } finally {
      importRef.current = false;
      setLoading(false);
      onUploadingChange?.(false);
    }
  };

  return (
    <>
      <Button icon={<LinkOutlined />} onClick={() => { setImportError(null); setOpen(true); }} {...buttonProps}>
        {children}
      </Button>
      <Modal
        title="Add from Google Drive"
        open={open}
        onOk={handleImport}
        okText="Import"
        confirmLoading={loading}
        onCancel={() => {
          if (loading) return;
          setImportError(null);
          setOpen(false);
        }}
        closable={!loading}
        maskClosable={!loading}
        keyboard={!loading}
        destroyOnClose
      >
        {importError ? (
          <Alert
            id={urlErrorId}
            type="error"
            showIcon
            message="Import failed"
            description={importError}
            style={{ marginBottom: 12 }}
          />
        ) : null}
        <label htmlFor={urlInputId} className="sr-only">
          Google Drive file link
        </label>
        <Input
          id={urlInputId}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Paste a Google Drive share link"
          disabled={loading}
          aria-invalid={Boolean(importError)}
          aria-describedby={importError ? `${urlErrorId} ${urlHintId}` : urlHintId}
        />
        <div id={urlHintId} style={{ marginTop: 8, color: "#6b7280", fontSize: 12 }}>
          Paste a Google Drive link to add the file to your submission.
        </div>
      </Modal>
    </>
  );
}

export default UploadFromLinkButton;
