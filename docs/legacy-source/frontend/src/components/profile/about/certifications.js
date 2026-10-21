import CustomButton from "@/components/Global/Button/button";
import { DatePicker, Space, Avatar, Row, Col, Input, Button, Popconfirm, Upload, message, Modal } from "antd";
import { UploadOutlined, DeleteOutlined, LinkOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { validateGenericUrl } from "@/utils/urlValidation";
const { TextArea } = Input;

const RichTextEditor = dynamic(() => import("@/components/Global/RichTextEditor/RichTextEditor"), { ssr: false });
const RichTextDisplay = dynamic(() => import("@/components/Global/RichTextEditor/RichTextDisplay"), { ssr: false });

export default function Certifications({
  certifications = [],
  certificationParams,
  setCertificationParams,
  onAdd,
  onUpdate,
  onDelete,
}) {
  const [certificationData, setCertificationData] = useState([]);
  const [newCertification, setNewCertification] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const submittingRef = useRef(false);
  // Tracks the previous list length so the empty-list reset below only fires on a genuine
  // deletion-emptied-the-list transition, not on every render where the list happens to be
  // empty -- including the very first one, before the initial fetch has even resolved.
  const prevCertificationsLengthRef = useRef(certifications.length);

  const safeUrl = (url) => {
    if (!url) return null;
    try {
      const u = new URL(url);
      return (u.protocol === 'http:' || u.protocol === 'https:') ? url : null;
    } catch { return null; }
  };

  useEffect(() => {
    if (certifications) {
      setCertificationData([...certifications]);
    } else {
      setCertificationData([]);
    }
    // Reset edit/add states if list becomes empty after deletion (a real transition from >0 to
    // 0 items) -- NOT whenever the list merely happens to be empty on render, which is also true
    // on the very first load for a user with no certifications yet, and would otherwise silently
    // close an already-opened add form and wipe whatever the user had started typing the moment
    // that (still-empty) initial fetch resolves.
    const prevLength = prevCertificationsLengthRef.current;
    const nowEmpty = certifications && certifications.length === 0;
    if (nowEmpty && prevLength > 0 && (certificationParams?.editClicked || certificationParams?.addClicked)) {
      setCertificationParams({ editClicked: false, addClicked: false });
      setNewCertification({});
    }
    prevCertificationsLengthRef.current = certifications ? certifications.length : 0;
  }, [certifications]);

  const isSaveDisabled = () => {
    if (certificationParams.addClicked) {
      const hasNameError = !newCertification.name || !newCertification.name.trim();
      const hasUrlError = !!errors.certificateLink;
      return hasNameError || hasUrlError;
    }
    if (certificationParams.editClicked) {
      const hasNameErrors = certificationData.some(cert => !cert.name || !cert.name.trim());
      const hasUrlErrors = Object.keys(errors).some(key => 
        key.startsWith('certificateLink_') && errors[key]
      );
      return hasNameErrors || hasUrlErrors;
    }
    return false;
  };

  return (
    <>
      <Space className="w-100" direction="vertical" size={16}>
        {certificationParams?.addClicked && (
          <div className="d-flex gap-3">
            <Avatar shape="square" className="bg-white9FC clrFour" icon={<i className="bi bi-award"></i>} />
            <div className="w-100">
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={24} md={12}>
                  <div>
                    <div className="mb-1">
                      <span className="fnt-13 clrgray2BB">Certification Name</span>
                      <span className="ln-required-asterisk">*</span>
                    </div>
                    <Input
                      className={errors.name ? "ln-in2 error" : "ln-in2"}
                      placeholder="Certification Name"
                      aria-label="Certification name"
                      value={newCertification.name || ""}
                      onChange={e => {
                        setNewCertification({ ...newCertification, name: e.target.value });
                        if (errors.name) {
                          setErrors({ ...errors, name: "" });
                        }
                      }}
                      onBlur={() => {
                        if (!newCertification.name || !newCertification.name.trim()) {
                          setErrors({ ...errors, name: "Certification name is required" });
                        } else {
                          setErrors({ ...errors, name: "" });
                        }
                      }}
                    />
                    {errors.name && (
                      <div className="ln-form-error">
                        {errors.name}
                      </div>
                    )}
                  </div>
                </Col>
                <Col xs={24} sm={24} md={12}>
                  <div>
                    <div className="mb-1">
                      <span className="fnt-13 clrgray2BB">Issuing Authority</span>
                    </div>
                    <Input
                      className="ln-in2"
                      placeholder="e.g., AWS, Google"
                      aria-label="Issuing authority"
                      value={newCertification.authority || ""}
                      onChange={e => setNewCertification({ ...newCertification, authority: e.target.value })}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <DatePicker
                    className="ln-in2 w-100"
                    placeholder="Certification Date"
                    aria-label="Issue date"
                    onChange={(date, dateString) => setNewCertification({ ...newCertification, certificationDate: dateString })}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <DatePicker
                    className="ln-in2 w-100"
                    placeholder="Validity Date"
                    aria-label="Expiry date"
                    onChange={(date, dateString) => setNewCertification({ ...newCertification, validityDate: dateString })}
                  />
                </Col>
                <Col xs={24} sm={24} md={12}>
                  <div>
                    <Input
                      className={errors.certificateLink ? "ln-in2 error" : "ln-in2"}
                      placeholder="Certificate Link (e.g., https://example.com/certificate)"
                      aria-label="Credential URL"
                      prefix={<LinkOutlined />}
                      value={newCertification.certificateLink || ''}
                      onChange={e => {
                        setNewCertification({ ...newCertification, certificateLink: e.target.value });
                        if (errors.certificateLink) {
                          setErrors({ ...errors, certificateLink: '' });
                        }
                      }}
                      onBlur={() => {
                        if (newCertification.certificateLink && newCertification.certificateLink.trim()) {
                          const validation = validateGenericUrl(newCertification.certificateLink);
                          if (!validation.isValid) {
                            setErrors({ ...errors, certificateLink: validation.message });
                          } else {
                            setErrors({ ...errors, certificateLink: '' });
                          }
                        }
                      }}
                    />
                    {errors.certificateLink && (
                      <div className="ln-form-error">
                        {errors.certificateLink}
                      </div>
                    )}
                  </div>
                </Col>
                <Col span={24}>
                  <RichTextEditor
                    value={newCertification?.description || ""}
                    onChange={(content) => setNewCertification({ ...newCertification, description: content })}
                    placeholder="Enter description (supports bullet points, formatting, etc.)"
                    height={250}
                  />
                </Col>
              </Row>
            </div>
          </div>
        )}

        {certificationData?.map((cert, index) => (
          <div className="d-flex gap-3" key={index}>
            <Avatar shape="square" className="bg-white9FC clrFour" icon={<i className="bi bi-award"></i>} />
            {certificationParams?.editClicked ? (
              <div className="w-100">
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={24} md={12}>
                    <div>
                      <div className="mb-1">
                        <span className="fnt-13 clrgray2BB">Certification Name</span>
                        <span className="ln-required-asterisk">*</span>
                      </div>
                      <Input
                        value={cert?.name || ""}
                        className={errors[`name_${index}`] ? "ln-in2 error" : "ln-in2"}
                        placeholder="Certification Name"
                        aria-label="Certification name"
                        onChange={e => {
                          const updated = [...certificationData];
                          updated[index].name = e.target.value;
                          setCertificationData(updated);
                          if (errors[`name_${index}`]) {
                            setErrors({ ...errors, [`name_${index}`]: "" });
                          }
                        }}
                        onBlur={() => {
                          if (!cert?.name || !cert.name.trim()) {
                            setErrors({ ...errors, [`name_${index}`]: "Certification name is required" });
                          } else {
                            setErrors({ ...errors, [`name_${index}`]: "" });
                          }
                        }}
                      />
                      {errors[`name_${index}`] && (
                        <div className="ln-form-error">
                          {errors[`name_${index}`]}
                        </div>
                      )}
                    </div>
                  </Col>
                  <Col xs={24} sm={24} md={12}>
                    <div>
                      <div className="mb-1">
                        <span className="fnt-13 clrgray2BB">Issuing Authority</span>
                      </div>
                      <Input
                        value={cert?.authority}
                        className="ln-in2"
                        placeholder="e.g., AWS, Google"
                        aria-label="Issuing authority"
                        onChange={e => {
                          const updated = [...certificationData];
                          updated[index].authority = e.target.value;
                          setCertificationData(updated);
                        }}
                      />
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <DatePicker
                      value={cert?.certificationDate ? dayjs(cert.certificationDate) : null}
                      className="ln-in2 w-100"
                      placeholder="Certification Date"
                      aria-label="Issue date"
                      onChange={(date, dateString) => {
                        const updated = [...certificationData];
                        updated[index].certificationDate = dateString;
                        setCertificationData(updated);
                      }}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <DatePicker
                      value={cert?.validityDate ? dayjs(cert.validityDate) : null}
                      className="ln-in2 w-100"
                      placeholder="Validity Date"
                      aria-label="Expiry date"
                      onChange={(date, dateString) => {
                        const updated = [...certificationData];
                        updated[index].validityDate = dateString;
                        setCertificationData(updated);
                      }}
                    />
                  </Col>
                  <Col xs={24} sm={24} md={12}>
                    <div>
                      <Input
                        value={cert?.certificateLink || ''}
                        className={errors[`certificateLink_${index}`] ? "ln-in2 error" : "ln-in2"}
                        placeholder="Certificate Link (e.g., https://example.com/certificate)"
                        aria-label="Credential URL"
                        prefix={<LinkOutlined />}
                        onChange={e => {
                          const updated = [...certificationData];
                          updated[index].certificateLink = e.target.value;
                          setCertificationData(updated);
                          if (errors[`certificateLink_${index}`]) {
                            setErrors({ ...errors, [`certificateLink_${index}`]: '' });
                          }
                        }}
                        onBlur={() => {
                          if (cert?.certificateLink && cert.certificateLink.trim()) {
                            const validation = validateGenericUrl(cert.certificateLink);
                            if (!validation.isValid) {
                              setErrors({ ...errors, [`certificateLink_${index}`]: validation.message });
                            } else {
                              setErrors({ ...errors, [`certificateLink_${index}`]: '' });
                            }
                          }
                        }}
                      />
                      {errors[`certificateLink_${index}`] && (
                        <div className="ln-form-error">
                          {errors[`certificateLink_${index}`]}
                        </div>
                      )}
                    </div>
                  </Col>
                  <Col span={24}>
                    <RichTextEditor
                      value={cert?.description || ""}
                      onChange={(content) => {
                        const updated = [...certificationData];
                        updated[index].description = content;
                        setCertificationData(updated);
                      }}
                      placeholder="Enter description (supports bullet points, formatting, etc.)"
                      height={250}
                    />
                  </Col>
                  <Col span={24}>
                    <Popconfirm
                      title="Delete this certification?"
                      description="This can't be undone."
                      onConfirm={() => onDelete && onDelete(index)}
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                      cancelText="Cancel"
                    >
                      <Button danger icon={<DeleteOutlined />}>
                        Delete Certification
                      </Button>
                    </Popconfirm>
                  </Col>
                </Row>
              </div>
            ) : (
              <div className="w-100">
                <Row justify="space-between" align="top">
                  <Col>
                    <div className="ln-lto-bold clrB517" style={{ fontSize: "16px" }}>
                      {cert?.name}
                    </div>
                    <div className="fnt-1 clrgray2BB ln-lto-reg">{cert?.authority}</div>
                  </Col>
                  <Col className="fnt-13 clrgray7AE ln-lto-reg">
                    {cert?.certificationDate && dayjs(cert.certificationDate).format('MMM YYYY')}
                    {cert?.validityDate && ` - Valid till ${dayjs(cert.validityDate).format('MMM YYYY')}`}
                  </Col>
                </Row>
                <div className="ln-lto-reg clrFour my-2">
                  <RichTextDisplay content={cert?.description} />
                </div>
                {cert?.certificateLink && safeUrl(cert.certificateLink) && (
                  <a href={safeUrl(cert.certificateLink)} target="_blank" rel="noopener noreferrer" aria-label="View credential">
                    <Button size="small" icon={<LinkOutlined />}>View Certificate</Button>
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
        {!certificationParams?.addClicked && certificationData?.length === 0 && (
          <div className="profile-empty-state">No certifications added</div>
        )}
      </Space>

      {(certificationParams?.editClicked || certificationParams?.addClicked) && (
        <Row className="profile-section-actions" justify="end">
          <CustomButton
            title="Cancel"
            buttonType="primary"
            disabled={saving}
            onClick={() => Modal.confirm({
              title: "Discard certification changes?",
              content: "Your unsaved certification details will be lost.",
              okText: "Discard changes",
              okButtonProps: { danger: true },
              cancelText: "Keep editing",
              onOk: () => {
                setCertificationData([...certifications]);
                setNewCertification({});
                setErrors({});
                setCertificationParams({ editClicked: false, addClicked: false });
              },
            })}
          />
          <CustomButton
            styleClass="ms-2"
            title="Save"
            buttonType="primary"
            disabled={saving}
            loading={saving}
            onClick={async () => {
              if (submittingRef.current || saving) return;
              submittingRef.current = true;
              setSaving(true);
              try {
                if (certificationParams.addClicked) {
                  if (errors.certificateLink) {
                    message.error("Please fix URL validation errors before saving");
                    return;
                  }
                  if (newCertification.validityDate && newCertification.certificationDate) {
                    if (dayjs(newCertification.validityDate).isBefore(dayjs(newCertification.certificationDate))) {
                      message.error('Expiry date must be after issue date');
                      return;
                    }
                  }
                  if (newCertification.name) {
                    if (await onAdd(newCertification) === false) return;
                  }
                }
                if (certificationParams.editClicked) {
                  const hasUrlErrors = Object.keys(errors).some(key =>
                    key.startsWith('certificateLink_') && errors[key]
                  );
                  if (hasUrlErrors) {
                    message.error("Please fix URL validation errors before saving");
                    return;
                  }
                  for (let i = 0; i < certificationData.length; i++) {
                    const cert = certificationData[i];
                    if (cert.validityDate && cert.certificationDate) {
                      if (dayjs(cert.validityDate).isBefore(dayjs(cert.certificationDate))) {
                        message.error(`Expiry date must be after issue date for certification "${cert.name || i + 1}"`);
                        return;
                      }
                    }
                    if (await onUpdate(i, cert) === false) return;
                  }
                }
                setNewCertification({});
                setErrors({});
                setCertificationParams({ editClicked: false, addClicked: false });
              } finally {
                submittingRef.current = false;
                setSaving(false);
              }
            }}
          />
        </Row>
      )}
    </>
  );
}
