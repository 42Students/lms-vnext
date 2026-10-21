import CustomButton from "@/components/Global/Button/button";
import { useEffect, useState } from "react";
import {
  DatePicker,
  Space,
  Avatar,
  Row,
  Col,
  Form,
  Input,
  Radio,
  Checkbox,
  Modal,
} from "antd";
import { useSelector } from "react-redux";
const { TextArea } = Input;

export default function Contacts({
  userDetails,
  contactsEdit,
  setContactsEdit,
  saveProfileDetails,
}) {
  const [contactsData, setContactsData] = useState({ ...userDetails });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const loginUser = useSelector(state => state.loginUser);
  const isLearner = loginUser?.userType === "LEARNER";
  const contactSnapshot = (value) => JSON.stringify({
    contactMobile: value?.contactMobile || "",
    contactPhone: value?.contactPhone || "",
    contactMail: value?.contactMail || "",
  });
  const requestCancel = () => {
    if (saving) return;
    if (contactSnapshot(contactsData) === contactSnapshot(userDetails)) {
      setContactsEdit(false);
      return;
    }
    Modal.confirm({
      title: "Discard contact changes?",
      content: "Your unsaved contact edits will be lost.",
      okText: "Discard changes",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => {
        setContactsData({ ...userDetails });
        setErrors({});
        setContactsEdit(false);
      },
    });
  };

  useEffect(() => {
    setContactsData(userDetails);
    setErrors({});
  }, [userDetails]);

  // Format phone number for display (e.g., 9876543210 -> +91-98765-43210)
  const formatPhoneNumber = (phone) => {
    if (!phone || phone === "string") return "";
    // Remove any non-digits
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) {
      return `+91-${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return phone;
  };

  // Validate phone number format
  const validatePhone = (phone, isMobile = true) => {
    if (!phone || phone.trim() === "") {
      return isMobile ? "Primary mobile number is required" : null;
    }
    const digits = phone.replace(/\D/g, "");
    if (isMobile) {
      if (digits.length !== 10) {
        return "Mobile number must be exactly 10 digits";
      }
    } else {
      if (digits.length < 10 || digits.length > 15) {
        return "Phone number must be 10-15 digits";
      }
    }
    return null;
  };

  // Validate email format (contactMail is optional, but if present it must be a real email —
  // this field previously had no client or server-side format validation at all).
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validateEmail = (emailValue) => {
    if (!emailValue || emailValue.trim() === "" || emailValue === "string") return null;
    return EMAIL_REGEX.test(emailValue.trim()) ? null : "Enter a valid email address";
  };


  return (
    <>
      <div className="profile-contact-list ln-lto-reg ln-cont-pf">
        <div className="profile-avatar-row profile-contact-row">
          <Avatar
            shape="square"
            className="bg-white9FC clrFour"
            icon={<i className="bi bi-phone"></i>}
          />
          {!contactsEdit ? (
            <div className="profile-contact-row__content">
              <div className="profile-field-label">Primary Mobile</div>
              <div className="profile-field-value">
                {(contactsData.contactMobile &&
                  contactsData.contactMobile !== "string" &&
                  formatPhoneNumber(contactsData.contactMobile)) || "Not specified"}
              </div>
              {(contactsData.contactPhone &&
                contactsData.contactPhone !== "string" &&
                contactsData.contactPhone !== contactsData.contactMobile) && (
                <>
                  <div className="profile-field-label profile-contact-row__sub-label">
                    <i className="bi bi-telephone" style={{ marginRight: '4px' }}></i>
                    Alternate Phone
                  </div>
                  <div className="profile-field-value">
                    {formatPhoneNumber(contactsData.contactPhone)}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="profile-contact-row__content profile-contact-row__content--edit">
              <div>
                <Input
                  value={
                    contactsData.contactMobile &&
                    contactsData.contactMobile !== "string" &&
                    contactsData.contactMobile
                  }
                  className={errors.contactMobile ? "ln-in2 error" : "ln-in2"}
                  placeholder="Primary Mobile Number (10 digits)"
                  maxLength={10}
                  inputMode="tel"
                  autoComplete="tel"
                  onChange={e => {
                    const value = e.target.value.replace(/\D/g, ""); // Only digits
                    editContact("contactMobile", value);
                    const error = validatePhone(value, true);
                    setErrors(prev => ({ ...prev, contactMobile: error }));
                  }}
                  onBlur={() => {
                    const error = validatePhone(contactsData.contactMobile, true);
                    setErrors(prev => ({ ...prev, contactMobile: error }));
                  }}
                />
                {errors.contactMobile && (
                  <div className="ln-form-error">
                    {errors.contactMobile}
                  </div>
                )}
              </div>
              <div>
                <Input
                  value={
                    contactsData.contactPhone &&
                    contactsData.contactPhone !== "string" &&
                    contactsData.contactPhone
                  }
                  className={errors.contactPhone ? "ln-in2 error" : "ln-in2"}
                  placeholder="Alternate Phone (Optional, 10-15 digits)"
                  maxLength={15}
                  inputMode="tel"
                  autoComplete="tel-national"
                  onChange={e => {
                    const value = e.target.value.replace(/\D/g, ""); // Only digits
                    editContact("contactPhone", value);
                    const error = validatePhone(value, false);
                    let finalError = error;
                    // Check if alternate equals primary
                    if (value && value === contactsData.contactMobile) {
                      finalError = "Alternate phone cannot be same as primary mobile";
                    }
                    setErrors(prev => ({ ...prev, contactPhone: finalError }));
                  }}
                  onBlur={() => {
                    const error = validatePhone(contactsData.contactPhone, false);
                    let finalError = error;
                    if (contactsData.contactPhone && contactsData.contactPhone === contactsData.contactMobile) {
                      finalError = "Alternate phone cannot be same as primary mobile";
                    }
                    setErrors(prev => ({ ...prev, contactPhone: finalError }));
                  }}
                />
                {errors.contactPhone && (
                  <div className="ln-form-error">
                    {errors.contactPhone}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="profile-avatar-row profile-contact-row">
          <Avatar
            shape="square"
            className="bg-white9FC clrFour"
            icon={<i className="bi bi-envelope-at"></i>}
          />
          {!contactsEdit ? (
            <div className="profile-contact-row__content">
              <div className="profile-field-label">Contact Email</div>
              <div className="profile-field-value">
                {(contactsData.contactMail &&
                  contactsData.contactMail !== "string" &&
                  contactsData.contactMail) || "Not specified"}
              </div>
            </div>
          ) : (
            <div>
              <Input
                value={
                  contactsData.contactMail &&
                  contactsData.contactMail !== "string" &&
                  contactsData.contactMail
                }
                className={errors.contactMail ? "ln-in2 error" : "ln-in2"}
                placeholder="Contact Email"
                aria-label="Contact Email"
                type="email"
                inputMode="email"
                autoComplete="email"
                onChange={e => {
                  const value = e.target.value;
                  editContact("contactMail", value);
                  setErrors(prev => ({ ...prev, contactMail: validateEmail(value) }));
                }}
                onBlur={() => {
                  setErrors(prev => ({ ...prev, contactMail: validateEmail(contactsData.contactMail) }));
                }}
              />
              {errors.contactMail && (
                <div className="ln-form-error">
                  {errors.contactMail}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {contactsEdit && (
        <Row className="profile-section-actions" justify="end">
          <CustomButton
            title={"Cancel"}
            buttonType={"primary"}
            disabled={saving}
            onClick={requestCancel}
          />
          <CustomButton
            styleClass={"ms-2"}
            title={"Save"}
            buttonType={"primary"}
            disabled={saving}
            loading={saving}
            onClick={async () => {
              // Validate before saving
              const mobileError = validatePhone(contactsData?.contactMobile, true);
              const phoneError = validatePhone(contactsData?.contactPhone, false);
              const mailError = validateEmail(contactsData?.contactMail);
              let phoneFinalError = phoneError;

              if (contactsData?.contactPhone && contactsData?.contactPhone === contactsData?.contactMobile) {
                phoneFinalError = "Alternate phone cannot be same as primary mobile";
              }

              if (mobileError || phoneFinalError || mailError) {
                setErrors({
                  contactMobile: mobileError,
                  contactPhone: phoneFinalError,
                  contactMail: mailError,
                });
                return;
              }

              setErrors({});
              setSaving(true);
              try {
                const saved = await saveProfileDetails({
                  contact_mail: contactsData?.contactMail,
                  contact_mobile: contactsData?.contactMobile,
                  contact_phone: contactsData?.contactPhone || null,
                });
                if (saved !== false) setContactsEdit(false);
              } finally {
                setSaving(false);
              }
            }}
          />
        </Row>
      )}
    </>
  );

  function editContact(key, value) {
    setContactsData({ ...contactsData, [key]: value });
  }
}
