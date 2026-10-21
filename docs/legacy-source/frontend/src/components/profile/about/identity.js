import CustomButton from "@/components/Global/Button/button";
import UploadFromLinkButton from "@/components/Global/Upload/UploadFromLinkButton";
import { Avatar, Row, Col, Input, Upload, Button, message, Tag, Modal } from "antd";
import { UploadOutlined, IdcardOutlined, SafetyCertificateOutlined, CheckCircleOutlined, FileOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import PrivateDocLink from "@/components/profile/PrivateDocLink";

const safeHref = (url) => {
  if (!url) return '#';
  try { const u = new URL(url); return (u.protocol === 'http:' || u.protocol === 'https:') ? url : '#'; }
  catch { return '#'; }
};

export default function Identity({
  identity = {},
  identityEdit,
  setIdentityEdit,
  onUpdate,
  onFileUpload,
  onLinkUpload,
  userId,
}) {
  const [identityData, setIdentityData] = useState({});
  const [uploading, setUploading] = useState({ aadhaar: false, pan: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (identity) {
      setIdentityData({ ...identity });
    }
  }, [identity]);

  const requestCancel = () => {
    if (saving || uploading.aadhaar || uploading.pan) return;
    if (JSON.stringify(identityData || {}) === JSON.stringify(identity || {})) {
      setIdentityEdit(false);
      return;
    }
    Modal.confirm({
      title: "Discard identity changes?",
      content: "Your unsaved identity-number edits will be lost.",
      okText: "Discard changes",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => {
        setIdentityData({ ...identity });
        setIdentityEdit(false);
      },
    });
  };

  const maskNumber = (num, showLast = 4) => {
    if (!num) return "";
    const str = num.toString().replace(/[-\s]/g, "");
    if (str.length <= showLast) return str;
    return "*".repeat(str.length - showLast) + str.slice(-showLast);
  };

  const handleFileUpload = async (file, type) => {
    if (!onFileUpload) {
      message.error("File upload not configured");
      return false;
    }
    const isAllowedType = ["application/pdf", "image/jpeg", "image/png"].includes(file?.type);
    const isAllowedSize = file?.size / 1024 / 1024 <= 10;
    if (!isAllowedType) {
      message.error("Upload a PDF, JPG, or PNG document");
      return false;
    }
    if (!isAllowedSize) {
      message.error("Document must be 10 MB or smaller");
      return false;
    }
    
    setUploading(prev => ({ ...prev, [type]: true }));
    try {
      await onFileUpload(file, type);
      return false;
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const getFileName = (url) => {
    if (!url) return "";
    try {
      const parts = url.split("/");
      return parts[parts.length - 1].substring(0, 20) + "...";
    } catch {
      return "Document";
    }
  };

  return (
    <>
      <div className="profile-identity-list">
        {/* Aadhaar Section */}
        <div className="profile-avatar-row profile-identity-row">
          <Avatar shape="square" className="bg-white9FC clrFour" icon={<IdcardOutlined />} />
          {!identityEdit ? (
            <div className="profile-identity-row__content">
              <div className="profile-field-label">Aadhaar Number</div>
              <div className="profile-field-value">
                {identityData?.aadhaarNumber ? maskNumber(identityData.aadhaarNumber) : "Not specified"}
              </div>
              {identityData?.aadhaarUpload ? (
                <PrivateDocLink value={identityData.aadhaarUpload} userId={userId}>
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    <FileOutlined /> View Document
                  </Tag>
                </PrivateDocLink>
              ) : (
                <Tag color="default">No document uploaded</Tag>
              )}
            </div>
          ) : (
            <div className="profile-identity-row__content profile-identity-row__content--edit">
              <Row gutter={[12, 12]} className="w-100">
                <Col xs={24} sm={12}>
                  <Input
                    value={identityData?.aadhaarNumber}
                    className="ln-in2"
                    placeholder="Aadhaar Number (XXXX-XXXX-XXXX)"
                    maxLength={14}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
                      const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1-");
                      setIdentityData({ ...identityData, aadhaarNumber: formatted });
                    }}
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <div className="d-flex flex-wrap gap-2">
                    <Upload
                      beforeUpload={file => {
                        return handleFileUpload(file, "aadhaar");
                      }}
                      showUploadList={false}
                      accept=".pdf,.jpg,.jpeg,.png"
                    >
                      <Button
                        icon={<UploadOutlined />}
                        loading={uploading.aadhaar}
                        type={identityData?.aadhaarUpload ? "default" : "primary"}
                      >
                        {identityData?.aadhaarUpload ? "Re-upload Aadhaar" : "Upload Aadhaar"}
                      </Button>
                    </Upload>
                    {onLinkUpload && (
                      <UploadFromLinkButton
                        folder="identity-docs"
                        type="generic"
                        userId={userId}
                        onImported={(result) => onLinkUpload(result, "aadhaar")}
                      >
                        Drive link
                      </UploadFromLinkButton>
                    )}
                  </div>
                </Col>
              </Row>
              {identityData?.aadhaarUpload && (
                <div className="profile-identity-row__uploaded">
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    Uploaded: <PrivateDocLink value={identityData.aadhaarUpload} userId={userId}>{getFileName(identityData.aadhaarUpload)}</PrivateDocLink>
                  </Tag>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PAN Section */}
        <div className="profile-avatar-row profile-identity-row">
          <Avatar shape="square" className="bg-white9FC clrFour" icon={<SafetyCertificateOutlined />} />
          {!identityEdit ? (
            <div className="profile-identity-row__content">
              <div className="profile-field-label">PAN Number</div>
              <div className="profile-field-value">
                {identityData?.panNumber ? maskNumber(identityData.panNumber, 4) : "Not specified"}
              </div>
              {identityData?.panUpload ? (
                <PrivateDocLink value={identityData.panUpload} userId={userId}>
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    <FileOutlined /> View Document
                  </Tag>
                </PrivateDocLink>
              ) : (
                <Tag color="default">No document uploaded</Tag>
              )}
            </div>
          ) : (
            <div className="profile-identity-row__content profile-identity-row__content--edit">
              <Row gutter={[12, 12]} className="w-100">
                <Col xs={24} sm={12}>
                  <Input
                    value={identityData?.panNumber}
                    className="ln-in2"
                    placeholder="PAN Number (ABCDE1234F)"
                    maxLength={10}
                    onChange={e => setIdentityData({ ...identityData, panNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <div className="d-flex flex-wrap gap-2">
                    <Upload
                      beforeUpload={file => {
                        return handleFileUpload(file, "pan");
                      }}
                      showUploadList={false}
                      accept=".pdf,.jpg,.jpeg,.png"
                    >
                      <Button
                        icon={<UploadOutlined />}
                        loading={uploading.pan}
                        type={identityData?.panUpload ? "default" : "primary"}
                      >
                        {identityData?.panUpload ? "Re-upload PAN" : "Upload PAN"}
                      </Button>
                    </Upload>
                    {onLinkUpload && (
                      <UploadFromLinkButton
                        folder="identity-docs"
                        type="generic"
                        userId={userId}
                        onImported={(result) => onLinkUpload(result, "pan")}
                      >
                        Drive link
                      </UploadFromLinkButton>
                    )}
                  </div>
                </Col>
              </Row>
              {identityData?.panUpload && (
                <div className="profile-identity-row__uploaded">
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    Uploaded: <PrivateDocLink value={identityData.panUpload} userId={userId}>{getFileName(identityData.panUpload)}</PrivateDocLink>
                  </Tag>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {identityEdit && (
        <Row className="profile-section-actions" justify="end">
          <CustomButton
            title="Cancel"
            buttonType="primary"
            disabled={saving || uploading.aadhaar || uploading.pan}
            onClick={requestCancel}
          />
          <CustomButton
            styleClass="ms-2"
            title="Save"
            buttonType="primary"
            onClick={async () => {
              const aadhaar = identityData?.aadhaarNumber?.replace(/[-\s]/g, "");
              if (aadhaar && !/^\d{12}$/.test(aadhaar)) {
                message.error("Aadhaar number must be 12 digits");
                return;
              }
              const pan = identityData?.panNumber?.trim();
              if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(pan)) {
                message.error("PAN must be in format ABCDE1234F");
                return;
              }
              setSaving(true);
              try {
                const saved = await onUpdate({
                  ...identityData,
                  aadhaarNumber: aadhaar || null,
                  panNumber: pan ? pan.toUpperCase() : null,
                });
                if (saved !== false) setIdentityEdit(false);
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving || uploading.aadhaar || uploading.pan}
            loading={saving}
          />
        </Row>
      )}
    </>
  );
}
