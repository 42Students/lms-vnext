import CustomButton from "@/components/Global/Button/button";
import { Space, Avatar, Input, Row, Col, Select, Button, message, DatePicker, Modal } from "antd";
import { DatabaseOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { validateGenericUrl } from "@/utils/urlValidation";
const { TextArea } = Input;

const VALUE_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Yes/No" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL/Website" },
  { value: "date", label: "Date" },
  { value: "phone", label: "Phone Number" },
  { value: "textarea", label: "Long Text" },
];

export default function Metadata({
  metadata = {},
  metadataEdit,
  setMetadataEdit,
  onUpdate,
}) {
  const [metadataItems, setMetadataItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const detectType = (value) => {
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "string") {
      // Try to detect type from string value
      if (value.match(/^\d{4}-\d{2}-\d{2}/) || value.match(/^\d{2}\/\d{2}\/\d{4}/)) return "date";
      if (value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return "email";
      if (value.match(/^https?:\/\//) || value.match(/^www\./)) return "url";
      if (value.match(/^[\d\s\-\+\(\)]+$/) && value.replace(/\D/g, '').length >= 10) return "phone";
      if (value.length > 100) return "textarea";
    }
    return "text";
  };

  useEffect(() => {
    if (metadata?.metadata && typeof metadata.metadata === 'object') {
      // Convert object to array of key-value pairs
      const items = Object.entries(metadata.metadata).map(([key, value]) => {
        const type = detectType(value);
        
        return {
          key,
          value: type === "date" && value ? dayjs(value).format("YYYY-MM-DD") : String(value),
          type,
        };
      });
      setMetadataItems(items);
    } else {
      setMetadataItems([]);
    }
  }, [metadata]);

  const handleAddField = () => {
    setMetadataItems([
      ...metadataItems,
      { key: "", value: "", type: "text" },
    ]);
  };

  const handleRemoveField = (index) => {
    const updated = metadataItems.filter((_, i) => i !== index);
    setMetadataItems(updated);
  };

  const handleFieldChange = (index, field, newValue) => {
    const updated = [...metadataItems];
    updated[index] = { ...updated[index], [field]: newValue };
    
    // Reset value when type changes
    if (field === "type") {
      updated[index].value = "";
      // Clear error when type changes
      setErrors({ ...errors, [`url_${index}`]: '' });
    }
    
    // Validate URL when value changes for URL type
    if (field === "value" && updated[index].type === "url" && newValue && newValue.trim()) {
      const validation = validateGenericUrl(newValue);
      if (!validation.isValid) {
        setErrors({ ...errors, [`url_${index}`]: validation.message });
      } else {
        setErrors({ ...errors, [`url_${index}`]: '' });
      }
    } else if (field === "value" && updated[index].type === "url" && (!newValue || !newValue.trim())) {
      // Clear error if URL field is cleared
      setErrors({ ...errors, [`url_${index}`]: '' });
    }
    
    setMetadataItems(updated);
  };

  const convertValue = (value, type) => {
    if (!value) return value;
    
    if (type === "number") {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    } else if (type === "boolean") {
      return value === "true" || value === "yes" || value === "1";
    } else if (type === "date") {
      // Store date as ISO string
      return value;
    }
    // For text, email, url, phone, textarea - store as string
    return String(value);
  };

  const metadataSnapshot = () => {
    const original = metadata?.metadata && typeof metadata.metadata === "object"
      ? metadata.metadata
      : {};
    return JSON.stringify(original);
  };

  const currentSnapshot = () => {
    const value = {};
    metadataItems.forEach((item) => {
      if (item.key?.trim()) value[item.key.trim()] = convertValue(item.value, item.type);
    });
    return JSON.stringify(value);
  };

  const handleSave = async () => {
    // Validate all fields have keys
    const emptyKeys = metadataItems.filter(item => !item.key.trim());
    if (emptyKeys.length > 0) {
      message.error("Please fill in all field names");
      return;
    }

    // Check for duplicate keys
    const keys = metadataItems.map(item => item.key.trim().toLowerCase());
    const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
    if (duplicates.length > 0) {
      message.error("Field names must be unique");
      return;
    }

    // Validate URL fields
    const urlErrors = Object.keys(errors).filter(key => key.startsWith('url_') && errors[key]);
    if (urlErrors.length > 0) {
      message.error("Please fix URL validation errors before saving");
      return;
    }

    // Convert to object
    const metadataObj = {};
    metadataItems.forEach(item => {
      if (item.key.trim()) {
        metadataObj[item.key.trim()] = convertValue(item.value, item.type);
      }
    });

    setSaving(true);
    try {
      const saved = await onUpdate({ metadata: metadataObj });
      if (saved !== false) {
        setMetadataEdit(false);
        setErrors({});
      }
    } finally {
      setSaving(false);
    }
  };

  const resetAndClose = () => {
    // Reset to original data
    if (metadata?.metadata && typeof metadata.metadata === 'object') {
      const items = Object.entries(metadata.metadata).map(([key, value]) => {
        const type = detectType(value);
        
        return {
          key,
          value: type === "date" && value ? dayjs(value).format("YYYY-MM-DD") : String(value),
          type,
        };
      });
      setMetadataItems(items);
    } else {
      setMetadataItems([]);
    }
    setErrors({});
    setMetadataEdit(false);
  };

  const handleCancel = () => {
    if (saving) return;
    if (currentSnapshot() === metadataSnapshot()) {
      resetAndClose();
      return;
    }
    Modal.confirm({
      title: "Discard additional-information changes?",
      content: "Your unsaved custom fields will be lost.",
      okText: "Discard changes",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: resetAndClose,
    });
  };

  return (
    <>
      <Space className="w-100" direction="vertical" size={24}>
        <div className="profile-avatar-row">
          <Avatar shape="square" className="bg-white9FC clrFour" icon={<DatabaseOutlined />} />
          {!metadataEdit ? (
            <Space direction="vertical" size={8} className="w-100">
              <div className="profile-field-label">Additional Information</div>
              {metadataItems.length > 0 ? (
                <div className="w-100">
                  {metadataItems.map((item, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        marginBottom: '16px', 
                        padding: '12px 16px', 
                        backgroundColor: '#f8fafc', 
                        borderRadius: '6px',
                        border: '1px solid #e8e8e8'
                      }}
                    >
                      <div className="profile-field-label" style={{ marginBottom: '6px' }}>
                        {item.key}
                      </div>
                      <div className="profile-field-value">
                        {item.type === "boolean" 
                          ? (item.value === "true" || item.value === "yes" || item.value === "1" ? "Yes" : "No")
                          : item.type === "date" && item.value
                          ? dayjs(item.value).format("DD-MM-YYYY")
                          : item.value || "Not specified"
                        }
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="profile-empty-state">
                  Add things like certifications, portfolio links, or other details. Click Edit, then add a label (e.g. Certification) and the value. You can add more than one.
                </div>
              )}
            </Space>
          ) : (
            <div className="w-100">
              <Space direction="vertical" size={16} className="w-100">
                <div className="clrgray2BB fnt-13">Additional Information</div>
                <div className="fnt-12 clrgray2BB" style={{ marginBottom: '8px', lineHeight: 1.5 }}>
                  Give each item a label and a value. Examples: Label = &quot;Certification&quot;, Value = &quot;AWS Certified&quot;; or Label = &quot;Portfolio&quot;, Value = your link.
                </div>
                
                {metadataItems.length > 0 && (
                  <Space direction="vertical" size={16} className="w-100">
                    {metadataItems.map((item, index) => (
                      <div 
                        key={index} 
                        style={{ 
                          padding: '16px', 
                          border: '1px solid #d9d9d9', 
                          borderRadius: '6px',
                          backgroundColor: '#fafafa'
                        }}
                      >
                        {item.type === "textarea" ? (
                          // Full width layout for textarea
                          <Space direction="vertical" size={12} className="w-100">
                            <Row gutter={[12, 12]}>
                              <Col xs={24} sm={10}>
                                <Input
                                  placeholder="e.g. Certification, Portfolio link"
                                  value={item.key}
                                  onChange={e => handleFieldChange(index, "key", e.target.value)}
                                  className="ln-in2"
                                />
                              </Col>
                              <Col xs={24} sm={8}>
                                <Select
                                  className="w-100"
                                  value={item.type}
                                  onChange={value => handleFieldChange(index, "type", value)}
                                  options={VALUE_TYPES}
                                />
                              </Col>
                              <Col xs={24} sm={6}>
                                <Button
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleRemoveField(index)}
                                  style={{ width: '100%' }}
                                >
                                  Remove
                                </Button>
                              </Col>
                            </Row>
                            <TextArea
                              className="ln-in2"
                              rows={3}
                              placeholder="Enter long text"
                              value={item.value}
                              onChange={e => handleFieldChange(index, "value", e.target.value)}
                            />
                          </Space>
                        ) : (
                          // Regular layout for other field types
                          <Row gutter={[12, 12]} align="middle">
                            <Col xs={24} sm={8} md={7}>
                              <Input
                                placeholder="e.g. Certification, Portfolio link"
                                value={item.key}
                                onChange={e => handleFieldChange(index, "key", e.target.value)}
                                className="ln-in2"
                              />
                            </Col>
                            <Col xs={24} sm={6} md={5}>
                              <Select
                                className="w-100"
                                value={item.type}
                                onChange={value => handleFieldChange(index, "type", value)}
                                options={VALUE_TYPES}
                              />
                            </Col>
                            <Col xs={24} sm={8} md={10}>
                              {item.type === "boolean" ? (
                                <Select
                                  className="w-100"
                                  value={item.value}
                                  onChange={value => handleFieldChange(index, "value", value)}
                                  placeholder="Select"
                                  options={[
                                    { value: "true", label: "Yes" },
                                    { value: "false", label: "No" },
                                  ]}
                                />
                              ) : item.type === "date" ? (
                                <DatePicker
                                  className="w-100"
                                  value={item.value ? dayjs(item.value) : null}
                                  onChange={(date) => handleFieldChange(index, "value", date ? date.format("YYYY-MM-DD") : "")}
                                  format="YYYY-MM-DD"
                                  placeholder="Select date"
                                />
                              ) : (
                                <div>
                                  <Input
                                    type={item.type === "number" ? "number" : 
                                          item.type === "email" ? "email" : 
                                          item.type === "url" ? "url" : 
                                          item.type === "phone" ? "tel" : "text"}
                                    placeholder={
                                      item.type === "number" ? "Enter number" :
                                      item.type === "email" ? "Enter email address" :
                                      item.type === "url" ? "Enter website URL (e.g., https://example.com)" :
                                      item.type === "phone" ? "Enter phone number" :
                                      "Enter value"
                                    }
                                    value={item.value}
                                    onChange={e => handleFieldChange(index, "value", e.target.value)}
                                    onBlur={() => {
                                      if (item.type === "url" && item.value && item.value.trim()) {
                                        const validation = validateGenericUrl(item.value);
                                        if (!validation.isValid) {
                                          setErrors({ ...errors, [`url_${index}`]: validation.message });
                                        }
                                      }
                                    }}
                                    className={errors[`url_${index}`] ? "ln-in2 error" : "ln-in2"}
                                  />
                                  {errors[`url_${index}`] && (
                                    <div className="ln-form-error">
                                      {errors[`url_${index}`]}
                                    </div>
                                  )}
                                </div>
                              )}
                            </Col>
                            <Col xs={24} sm={2} md={2}>
                              <Button
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleRemoveField(index)}
                                style={{ width: '100%' }}
                                title="Remove field"
                              />
                            </Col>
                          </Row>
                        )}
                      </div>
                    ))}
                  </Space>
                )}

                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={handleAddField}
                  style={{ width: '100%', height: '40px', marginTop: '8px' }}
                >
                  Add Field
                </Button>
              </Space>
            </div>
          )}
        </div>
      </Space>

      {metadataEdit && (
        <Row className="profile-section-actions" justify="end">
          <CustomButton
            title="Cancel"
            buttonType="primary"
            disabled={saving}
            onClick={handleCancel}
          />
          <CustomButton
            styleClass="ms-2"
            title="Save"
            buttonType="primary"
            disabled={saving}
            loading={saving}
            onClick={handleSave}
          />
        </Row>
      )}
    </>
  );
}
