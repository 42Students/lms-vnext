import CustomButton from "@/components/Global/Button/button";
import { Avatar, Row, Col, Input, Modal } from "antd";
import { HomeOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
const { TextArea } = Input;

export default function Address({
  address = {},
  addressEdit,
  setAddressEdit,
  onUpdate,
}) {
  const [addressData, setAddressData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (address && !addressEdit) {
      setAddressData({ ...address });
    }
  }, [address, addressEdit]);

  const requestCancel = () => {
    if (saving) return;
    if (JSON.stringify(addressData || {}) === JSON.stringify(address || {})) {
      setAddressEdit(false);
      return;
    }
    Modal.confirm({
      title: "Discard address changes?",
      content: "Your unsaved address edits will be lost.",
      okText: "Discard changes",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => {
        setAddressData({ ...address });
        setAddressEdit(false);
      },
    });
  };

  return (
    <>
      <div className="w-100">
        {/* Current Address */}
        <div className="profile-avatar-row">
          <Avatar shape="square" className="bg-white9FC clrFour" icon={<HomeOutlined />} />
          {!addressEdit ? (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="profile-field-label">Current Address</div>
              <div className="profile-field-value">
                {addressData?.currentAddress || "Not specified"}
              </div>
              <div className="profile-field-value">
                {[addressData?.city, addressData?.state, addressData?.pincode].filter(Boolean).join(", ") || "Not specified"}
              </div>
            </div>
          ) : (
            <div className="w-100" style={{ flex: 1 }}>
              <TextArea
                value={addressData?.currentAddress}
                className="ln-in2"
                rows={2}
                placeholder="Current Address"
                onChange={e => setAddressData({ ...addressData, currentAddress: e.target.value })}
              />
              {/* The backend only stores one city/state/pincode (AddressDTO has no
                  current-vs-permanent split), so this scopes it explicitly to the current
                  address instead of leaving it ambiguous which address it belongs to. */}
              <Row gutter={[12, 12]} className="mt-2">
                <Col xs={24} sm={8}>
                  <Input
                    value={addressData?.city}
                    className="ln-in2"
                    placeholder="City"
                    onChange={e => setAddressData({ ...addressData, city: e.target.value })}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Input
                    value={addressData?.state}
                    className="ln-in2"
                    placeholder="State"
                    onChange={e => setAddressData({ ...addressData, state: e.target.value })}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Input
                    value={addressData?.pincode}
                    className="ln-in2"
                    placeholder="Pincode"
                    onChange={e => setAddressData({ ...addressData, pincode: e.target.value })}
                  />
                </Col>
              </Row>
            </div>
          )}
        </div>

        {/* Permanent Address */}
        <div className="profile-avatar-row">
          <Avatar shape="square" className="bg-white9FC clrFour" icon={<EnvironmentOutlined />} />
          {!addressEdit ? (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="profile-field-label">Permanent Address</div>
              <div className="profile-field-value">
                {addressData?.permanentAddress || "Not specified"}
              </div>
            </div>
          ) : (
            <div className="w-100">
              <TextArea
                value={addressData?.permanentAddress}
                className="ln-in2"
                rows={2}
                placeholder="Permanent Address"
                onChange={e => setAddressData({ ...addressData, permanentAddress: e.target.value })}
              />
            </div>
          )}
        </div>
      </div>

      {addressEdit && (
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
                const saved = await onUpdate(addressData);
                if (saved !== false) setAddressEdit(false);
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
