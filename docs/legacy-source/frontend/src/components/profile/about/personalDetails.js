import CustomButton from "@/components/Global/Button/button";
import { Space, Avatar, Row, Col, Input, Select, DatePicker, Modal } from "antd";
import { UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useEffect, useState } from "react";
import useChoices from "@/hooks/useChoices";

dayjs.extend(customParseFormat);

const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const SUPPORTED_FORMATS = ["YYYY-MM-DD", "DD-MM-YYYY", "MM-DD-YYYY", "DD/MM/YYYY", "YYYY/MM/DD"];

export default function PersonalDetails({
  personalDetails = {},
  personalDetailsEdit,
  setPersonalDetailsEdit,
  onUpdate,
}) {
  const { genders } = useChoices();
  const [detailsData, setDetailsData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Don't resync from the prop while the user is actively editing: about.js's own section
    // fetches (Promise.allSettled in loadAllData) can still be in flight when the page first
    // renders, and a slow one resolving after the user has already opened this section and
    // picked a value would otherwise silently overwrite their first edit with the (now-stale)
    // fetched value.
    if (personalDetails && !personalDetailsEdit) {
      setDetailsData({ ...personalDetails });
    }
  }, [personalDetails, personalDetailsEdit]);

  const requestCancel = () => {
    if (saving) return;
    if (JSON.stringify(detailsData || {}) === JSON.stringify(personalDetails || {})) {
      setPersonalDetailsEdit(false);
      return;
    }
    Modal.confirm({
      title: "Discard personal-detail changes?",
      content: "Your unsaved personal-detail edits will be lost.",
      okText: "Discard changes",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => {
        setDetailsData({ ...personalDetails });
        setPersonalDetailsEdit(false);
      },
    });
  };

  const parseDate = (dateString) => {
    if (!dateString || dateString === "string") return null;
    for (const fmt of SUPPORTED_FORMATS) {
      const parsed = dayjs(dateString, fmt, true);
      if (parsed.isValid()) return parsed;
    }
    const fallback = dayjs(dateString);
    return fallback.isValid() ? fallback : null;
  };

  return (
    <>
      {!personalDetailsEdit ? (
        <div className="profile-section-group">
          <div className="profile-section-item">
            <div className="profile-field-label">Gender</div>
            <div className="profile-field-value">
              <span className="bi bi-person me-2" aria-hidden />
              {detailsData?.gender || "Not specified"}
            </div>
          </div>
          <div className="profile-section-item">
            <div className="profile-field-label">Date of Birth</div>
            <div className="profile-field-value">
              <span className="bi bi-gift me-2" aria-hidden />
              {(() => {
                const dobDate = detailsData?.dob ? parseDate(detailsData.dob) : null;
                return dobDate?.isValid() ? dobDate.format("DD-MM-YYYY") : (detailsData?.dob || "Not specified");
              })()}
            </div>
          </div>
          <div className="profile-section-item">
            <div className="profile-field-label">Blood Group</div>
            <div className="profile-field-value">
              <span className="bi bi-droplet me-2" aria-hidden />
              {detailsData?.bloodGroup || "Not specified"}
            </div>
          </div>
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <div className="profile-field-label">Gender</div>
            <Select
              value={detailsData?.gender}
              className="w-100"
              placeholder="Select Gender"
              onChange={value => setDetailsData({ ...detailsData, gender: value })}
              options={genders}
            />
          </Col>
          <Col xs={24} sm={8}>
            <div className="profile-field-label">Date of Birth</div>
            <DatePicker
              value={parseDate(detailsData?.dob)}
              className="w-100"
              placeholder="Select date of birth"
              format="DD-MM-YYYY"
              onChange={(date) => {
                setDetailsData({ ...detailsData, dob: date ? date.format("YYYY-MM-DD") : "" });
              }}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8}>
            <div className="profile-field-label">Blood Group</div>
            <Select
              value={detailsData?.bloodGroup}
              className="w-100"
              placeholder="Select Blood Group"
              onChange={value => setDetailsData({ ...detailsData, bloodGroup: value })}
              options={bloodGroupOptions.map(b => ({ value: b, label: b }))}
            />
          </Col>
        </Row>
      )}

      {personalDetailsEdit && (
        <Row className="profile-section-actions" justify="end">
          <CustomButton
            title="Cancel"
            buttonType="primary"
            disabled={saving}
            onClick={requestCancel}
          />
          <CustomButton
            styleClass="ms-2"
            title="Save"
            buttonType="primary"
            disabled={saving}
            loading={saving}
            onClick={async () => {
              setSaving(true);
              try {
                const saved = await onUpdate(detailsData);
                if (saved !== false) setPersonalDetailsEdit(false);
              } finally {
                setSaving(false);
              }
            }}
          />
        </Row>
      )}
    </>
  );
}
