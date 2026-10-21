import CustomButton from "@/components/Global/Button/button";
import { DatePicker, Space, Avatar, Row, Col, Input, Checkbox, Button, Popconfirm, message, Select, Modal } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
const { TextArea } = Input;
const { Option } = Select;
const monthFormat = "MMM/YYYY";

const RichTextEditor = dynamic(() => import("@/components/Global/RichTextEditor/RichTextEditor"), { ssr: false });
const RichTextDisplay = dynamic(() => import("@/components/Global/RichTextEditor/RichTextDisplay"), { ssr: false });

export function stringValueCheck(entity) {
  if (entity && entity !== "string" && entity !== " ") {
    return true;
  } else {
    return false;
  }
}

export default function Experiences({
  experiences = [],
  experienceParams,
  setExperienceParams,
  onAdd,
  onUpdate,
  onDelete,
  saveProfileDetails, // Kept for backward compatibility
}) {
  const [experienceData, setExperienceData] = useState([]);
  const [newExperience, setNewExperience] = useState({
    currentlyWorkHere: true,
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  // Tracks the previous list length so the empty-list reset below only fires on a genuine
  // deletion-emptied-the-list transition, not on every render where the list happens to be
  // empty -- including the very first one, before the initial fetch has even resolved (about.js
  // loads every section in parallel; a slow one can still be in flight after the user has
  // already opened this section's add form and started typing).
  const prevExperiencesLengthRef = useRef(experiences.length);

  useEffect(() => {
    experienceAutofill();
    // Reset edit/add states if list becomes empty after deletion (a real >0 -> 0 transition).
    const prevLength = prevExperiencesLengthRef.current;
    const nowEmpty = experiences && experiences.length === 0;
    if (nowEmpty && prevLength > 0 && (experienceParams?.editClicked || experienceParams?.addClicked)) {
      setExperienceParams({ editClicked: false, addClicked: false });
      setNewExperience({ currentlyWorkHere: true });
    }
    prevExperiencesLengthRef.current = experiences ? experiences.length : 0;
  }, [experiences]);

  const isSaveDisabled = () => {
    if (experienceParams.addClicked) {
      return !newExperience.organization || !newExperience.organization.trim() || isSaving;
    }
    if (experienceParams.editClicked) {
      return experienceData.some(exp => !exp.organization || !exp.organization.trim()) || isSaving;
    }
    return isSaving;
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // Validate before saving
      if (experienceParams.addClicked) {
        if (!newExperience.organization || !newExperience.organization.trim()) {
          setErrors({ organization: "Organization name is required" });
        message.error("Please fill in all required fields");
        return;
      }
      if (newExperience.from && newExperience.to &&
          dayjs(newExperience.to, monthFormat).isBefore(dayjs(newExperience.from, monthFormat))) {
        setErrors({ to: "End date cannot be before start date" });
        message.error("End date cannot be before start date");
        return;
      }
    }
    if (experienceParams.editClicked) {
      let hasErrors = false;
      const newErrors = {};
      for (let i = 0; i < experienceData.length; i++) {
        if (!experienceData[i].organization || !experienceData[i].organization.trim()) {
          newErrors[`organization_${i}`] = "Organization name is required";
          hasErrors = true;
        }
        const { from, to } = experienceData[i];
        if (from && to && dayjs(to, monthFormat).isBefore(dayjs(from, monthFormat))) {
          newErrors[`to_${i}`] = "End date cannot be before start date";
          hasErrors = true;
        }
      }
      if (hasErrors) {
        setErrors(newErrors);
        message.error("Please fill in all required fields");
        return;
      }
    }

    // Use new granular API approach if callbacks are provided
    if (onAdd || onUpdate) {
      if (experienceParams.addClicked && newExperience.organization) {
        let tempNewExp = { ...newExperience };
        delete tempNewExp["currentlyWorkHere"];
        if (await onAdd(tempNewExp) === false) return;
      }
      if (experienceParams.editClicked) {
        for (let i = 0; i < experienceData.length; i++) {
          let tempExp = { ...experienceData[i] };
          delete tempExp["currentlyWorkHere"];
          if (await onUpdate(i, tempExp) === false) return;
        }
      }
      setNewExperience({ currentlyWorkHere: true });
      setErrors({});
      setExperienceParams({ editClicked: false, addClicked: false });
    } else if (saveProfileDetails) {
      // Fallback to old approach
      let tempNewExp = { ...newExperience };
      delete tempNewExp["currentlyWorkHere"];
      let tempPastExperience = experienceData.map(experience => {
        let tempExp = { ...experience };
        delete tempExp["currentlyWorkHere"];
        return tempExp;
      });
      saveProfileDetails({
        experiences: [tempNewExp, ...tempPastExperience],
      }).then(res => {
        if (res) {
          experienceAutofill();
          setNewExperience({ currentlyWorkHere: true });
          setExperienceParams({ editClicked: false, addClicked: false });
        }
      });
    }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Space className="w-100" direction="vertical" size={16}>
        {experienceParams.addClicked && (
          <div className="d-flex gap-3">
            <div>
              <Avatar
                shape="square"
                className="bg-white9FC clrFour"
                icon={<i className="bi bi-bank"></i>}
              />
            </div>
            <div className="w-100">
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={24} md={12}>
                  <div>
                    <div className="mb-1">
                      <span className="fnt-13 clrgray2BB">Organization Name</span>
                      <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                    </div>
                    <Input
                      className={errors.organization ? "ln-in2 error" : "ln-in2"}
                      placeholder="Organization Name"
                      aria-label="Organization name"
                      value={newExperience.organization || ""}
                      onChange={e => {
                        setNewExperience({
                          ...newExperience,
                          organization: e.target.value,
                        });
                        if (errors.organization) {
                          setErrors({ ...errors, organization: "" });
                        }
                      }}
                      onBlur={() => {
                        if (!newExperience.organization || !newExperience.organization.trim()) {
                          setErrors({ ...errors, organization: "Organization name is required" });
                        } else {
                          setErrors({ ...errors, organization: "" });
                        }
                      }}
                    />
                    {errors.organization && (
                      <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                        {errors.organization}
                      </div>
                    )}
                  </div>
                </Col>

                <Col xs={24} sm={24} md={12}>
                  <div>
                    <div className="mb-1">
                      <span className="fnt-13 clrgray2BB">Designation</span>
                    </div>
                    <Input
                      className="ln-in2"
                      placeholder="Designation"
                      aria-label="Job title or designation"
                      value={newExperience.designation || ""}
                      onChange={e => {
                        setNewExperience({
                          ...newExperience,
                          designation: e.target.value,
                        });
                      }}
                    />
                  </div>
                </Col>

                <Col xs={24} sm={24} md={12}>
                  <div>
                    <div className="mb-1">
                      <span className="fnt-13 clrgray2BB">Experience Type</span>
                    </div>
                    <Select
                      className="ln-in2 w-100"
                      placeholder="Select Experience Type"
                      value={newExperience.experienceType || undefined}
                      onChange={value => {
                        setNewExperience({
                          ...newExperience,
                          experienceType: value,
                        });
                      }}
                      allowClear
                    >
                      <Option value="Full-time">Full-time</Option>
                      <Option value="Part-time">Part-time</Option>
                      <Option value="Internship">Internship</Option>
                      <Option value="Contract">Contract</Option>
                      <Option value="Freelance">Freelance</Option>
                      <Option value="Other">Other</Option>
                    </Select>
                  </div>
                </Col>

                <Col xs={24} sm={24} md={12}>
                  <div>
                    <div className="mb-1">
                      <span className="fnt-13 clrgray2BB">Location</span>
                    </div>
                    <Input
                      className="ln-in2"
                      placeholder="Location"
                      value={newExperience.location || ""}
                      onChange={e => {
                        setNewExperience({
                          ...newExperience,
                          location: e.target.value,
                        });
                      }}
                    />
                  </div>
                </Col>

                <Col xs={24} sm={24} md={12}>
                  <Row gutter={12}>
                    <Col span={12}>
                      <DatePicker
                        format={monthFormat}
                        picker="month"
                        className="ln-in2 w-100"
                        placeholder="Start Date"
                        aria-label="Start date"
                        onChange={(date, dateString) => {
                          setNewExperience({
                            ...newExperience,
                            from: dateString,
                          });
                        }}
                      />
                    </Col>
                    <Col span={12}>
                      <DatePicker
                        format={monthFormat}
                        picker="month"
                        className="ln-in2 w-100"
                        placeholder="End Date"
                        aria-label="End date"
                        disabled={newExperience?.currentlyWorkHere}
                        onChange={(date, dateString) => {
                          setNewExperience({
                            ...newExperience,
                            to: dateString,
                          });
                        }}
                      />
                    </Col>
                  </Row>
                </Col>

                <Col xs={24} sm={24} md={12}>
                  <Checkbox
                    checked={newExperience?.currentlyWorkHere}
                    className="ln-in2 ln-circular-checkbox"
                    onChange={e => {
                      setNewExperience({
                        ...newExperience,
                        currentlyWorkHere: e.target.checked,
                        // Checking "Present" disables the End Date picker but previously left any
                        // already-entered end date in place; since currentlyWorkHere itself is
                        // never sent to the backend (it infers "currently working" from `to` being
                        // empty), the stale end date would silently override "Present" on save.
                        ...(e.target.checked ? { to: undefined } : {}),
                      });
                    }}
                  >
                    Present
                  </Checkbox>
                </Col>

                <Col xs={24} sm={24} md={12}>
                  <Checkbox
                    checked={newExperience?.isPaid || false}
                    className="ln-in2 ln-circular-checkbox"
                    onChange={e => {
                      setNewExperience({
                        ...newExperience,
                        isPaid: e.target.checked,
                        // Clear salary if unchecked
                        salary: e.target.checked ? newExperience.salary : undefined,
                      });
                    }}
                  >
                    Is it a paid job?
                  </Checkbox>
                </Col>

                {newExperience?.isPaid && (
                  <Col xs={24} sm={24} md={12}>
                    <Input
                      className="ln-in2"
                      placeholder="Salary/Compensation (e.g., 5 LPA, $50k/year, ₹30k/month)"
                      value={newExperience.salary || ""}
                      onChange={e => {
                        const val = e.target.value.replace(/[<>"'`]/g, '');
                        setNewExperience({
                          ...newExperience,
                          salary: val,
                        });
                      }}
                    />
                  </Col>
                )}
              </Row>
              <div className="my-3">
                <RichTextEditor
                  value={newExperience?.description || ""}
                  onChange={(content) => {
                    setNewExperience({
                      ...newExperience,
                      description: content,
                    });
                  }}
                  placeholder="Enter description (supports bullet points, formatting, etc.)"
                  height={250}
                />
              </div>
            </div>
          </div>
        )}
        
        {experienceData?.length > 0 &&
          experienceData?.map(
            (experience, index) =>
              stringValueCheck(experience?.organization) && (
                <div className="d-flex gap-3" key={index}>
                  <div>
                    <Avatar
                      shape="square"
                      className="bg-white9FC clrFour"
                      icon={<i className="bi bi-bank"></i>}
                    />
                  </div>
                  {experienceParams?.editClicked &&
                  stringValueCheck(experience?.organization) ? (
                    <div className="w-100">
                      <Row gutter={[12, 12]}>
                        <Col xs={24} sm={24} md={12}>
                          <div>
                            <div className="mb-1">
                              <span className="fnt-13 clrgray2BB">Organization Name</span>
                              <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                            </div>
                            <Input
                              value={experience?.organization || ""}
                              className={errors[`organization_${index}`] ? "ln-in2 error" : "ln-in2"}
                              placeholder="Organization Name"
                      aria-label="Organization name"
                              onChange={e => {
                                editExperience(index, "organization", e.target.value);
                                if (errors[`organization_${index}`]) {
                                  setErrors({ ...errors, [`organization_${index}`]: "" });
                                }
                              }}
                              onBlur={() => {
                                if (!experience?.organization || !experience.organization.trim()) {
                                  setErrors({ ...errors, [`organization_${index}`]: "Organization name is required" });
                                } else {
                                  setErrors({ ...errors, [`organization_${index}`]: "" });
                                }
                              }}
                            />
                            {errors[`organization_${index}`] && (
                              <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                                {errors[`organization_${index}`]}
                              </div>
                            )}
                          </div>
                        </Col>
                        <Col xs={24} sm={24} md={12}>
                          <div>
                            <div className="mb-1">
                              <span className="fnt-13 clrgray2BB">Designation</span>
                            </div>
                            <Input
                              value={stringValueCheck(experience?.designation) && experience?.designation}
                              className="ln-in2"
                              placeholder="Designation"
                              aria-label="Job title or designation"
                              onChange={e => {
                                editExperience(index, "designation", e.target.value);
                              }}
                            />
                          </div>
                        </Col>
                        <Col xs={24} sm={24} md={12}>
                          <div>
                            <div className="mb-1">
                              <span className="fnt-13 clrgray2BB">Experience Type</span>
                            </div>
                            <Select
                              className="ln-in2 w-100"
                              placeholder="Select Experience Type"
                              value={experience?.experienceType || undefined}
                              onChange={value => {
                                editExperience(index, "experienceType", value);
                              }}
                              allowClear
                            >
                              <Option value="Full-time">Full-time</Option>
                              <Option value="Part-time">Part-time</Option>
                              <Option value="Internship">Internship</Option>
                              <Option value="Contract">Contract</Option>
                              <Option value="Freelance">Freelance</Option>
                              <Option value="Other">Other</Option>
                            </Select>
                          </div>
                        </Col>
                        <Col xs={24} sm={24} md={12}>
                          <div>
                            <div className="mb-1">
                              <span className="fnt-13 clrgray2BB">Location</span>
                            </div>
                            <Input
                              value={experience?.location}
                              className="ln-in2"
                              placeholder="Location"
                              onChange={e => {
                                editExperience(index, "location", e.target.value);
                              }}
                            />
                          </div>
                        </Col>
                        <Col xs={24} sm={24} md={12}>
                          <Row gutter={12}>
                            <Col span={12}>
                              <DatePicker
                                value={experience?.from ? dayjs(experience?.from, monthFormat) : null}
                                format={monthFormat}
                                picker="month"
                                className="ln-in2 w-100"
                                placeholder="Start Date"
                                aria-label="Start date"
                                onChange={(date, dateString) => {
                                  editExperience(index, "from", dateString);
                                }}
                              />
                            </Col>
                            <Col span={12}>
                              <DatePicker
                                value={experience?.to ? dayjs(experience?.to, monthFormat) : null}
                                format={monthFormat}
                                picker="month"
                                disabled={experience?.currentlyWorkHere}
                                className="ln-in2 w-100"
                                placeholder="End Date"
                                aria-label="End date"
                                onChange={(date, dateString) => {
                                  editExperience(index, "to", dateString);
                                }}
                              />
                            </Col>
                          </Row>
                        </Col>
                        <Col xs={24} sm={24} md={12}>
                          <Checkbox
                            checked={experience?.currentlyWorkHere}
                            className="ln-in2 ln-circular-checkbox"
                            onChange={e => {
                              editExperience(index, "currentlyWorkHere", e.target.checked);
                              // See matching comment in the "add" form above: clear the stale end
                              // date so it can't silently override "Present" once currentlyWorkHere
                              // is stripped out of the save payload.
                              if (e.target.checked) {
                                editExperience(index, "to", undefined);
                              }
                            }}
                          >
                            Present
                          </Checkbox>
                        </Col>

                        <Col xs={24} sm={24} md={12}>
                          <Checkbox
                            checked={experience?.isPaid || false}
                            className="ln-in2 ln-circular-checkbox"
                            onChange={e => {
                              editExperience(index, "isPaid", e.target.checked);
                              // Clear salary if unchecked
                              if (!e.target.checked) {
                                editExperience(index, "salary", undefined);
                              }
                            }}
                          >
                            Is it a paid job?
                          </Checkbox>
                        </Col>

                        {experience?.isPaid && (
                          <Col xs={24} sm={24} md={12}>
                            <Input
                              className="ln-in2"
                              placeholder="Salary/Compensation (e.g., 5 LPA, $50k/year, ₹30k/month)"
                              value={experience?.salary || ""}
                              onChange={e => {
                                const val = e.target.value.replace(/[<>"'`]/g, '');
                                editExperience(index, "salary", val);
                              }}
                            />
                          </Col>
                        )}
                      </Row>
                      <div className="my-3">
                        <RichTextEditor
                          value={stringValueCheck(experience?.description) ? experience?.description : ""}
                          onChange={(content) => {
                            editExperience(index, "description", content);
                          }}
                          placeholder="Enter description (supports bullet points, formatting, etc.)"
                          height={250}
                        />
                      </div>
                      {onDelete && (
                        <Popconfirm
                          title="Delete this experience?"
                          description="This can't be undone."
                          onConfirm={() => onDelete(index)}
                          okText="Delete"
                          okButtonProps={{ danger: true }}
                          cancelText="Cancel"
                        >
                          <Button danger icon={<DeleteOutlined />}>
                            Delete Experience
                          </Button>
                        </Popconfirm>
                      )}
                    </div>
                  ) : (
                    <>
                      {stringValueCheck(experience?.organization) && (
                        <div className="w-100">
                          <Row justify={"space-between"} align={"top"}>
                            <Col>
                              <Space direction="vertical">
                                <div
                                  className="ln-lto-bold clrB517"
                                  style={{ lineHeight: "16px", fontSize: "16px" }}
                                >
                                  {experience?.organization}
                                </div>
                                <div className="fnt-1 clrgray2BB ln-lto-reg">
                                  {stringValueCheck(experience?.designation) && experience?.designation}
                                  {experience?.experienceType && ` · ${experience.experienceType}`}
                                </div>
                                {experience?.location && (
                                  <div className="fnt-13 clrgray7AE ln-lto-reg">
                                    <i className="bi bi-geo-alt me-1"></i>{experience.location}
                                  </div>
                                )}
                                {(experience?.isPaid || experience?.salary) && (
                                  <div className="fnt-13 clrgray7AE ln-lto-reg">
                                    {experience?.isPaid && experience?.salary ? (
                                      <><i className="bi bi-currency-dollar me-1"></i>Paid · {experience.salary}</>
                                    ) : experience?.isPaid ? (
                                      <><i className="bi bi-currency-dollar me-1"></i>Paid</>
                                    ) : null}
                                  </div>
                                )}
                              </Space>
                            </Col>
                            <Col className="fnt-13 clrgray7AE ln-lto-reg">
                              {stringValueCheck(experience?.from) && experience?.from}
                              -
                              {stringValueCheck(experience?.to)
                                ? experience?.to
                                : experience?.to !== "string" && "Present"}
                            </Col>
                          </Row>
                          <div className="ln-lto-reg clrFour my-2">
                            <RichTextDisplay content={experience.description} />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
          )}
      </Space>

      {(experienceParams?.editClicked || experienceParams?.addClicked) && (
        <Row className="mt-2 w-100" justify="end">
          <CustomButton
            title={"Cancel"}
            buttonType={"primary"}
            disabled={isSaving}
            onClick={() => Modal.confirm({
              title: "Discard experience changes?",
              content: "Your unsaved experience edits will be lost.",
              okText: "Discard changes",
              okButtonProps: { danger: true },
              cancelText: "Keep editing",
              onOk: () => {
                experiences?.length > 0 && experienceAutofill();
                setNewExperience({ currentlyWorkHere: true });
                setErrors({});
                setExperienceParams({ ...experienceParams, editClicked: false, addClicked: false });
              },
            })}
          />
          <CustomButton
            styleClass={"ms-2"}
            title={"Save"}
            buttonType={"primary"}
            disabled={isSaveDisabled()}
            loading={isSaving}
            onClick={handleSave}
          />
        </Row>
      )}
    </>
  );

  function experienceAutofill() {
    if (experiences?.length > 0) {
      let pastExp = [...experiences];
      pastExp = pastExp?.map(exp => {
        if (!exp?.to) {
          return { ...exp, currentlyWorkHere: true };
        } else {
          return { ...exp, currentlyWorkHere: false };
        }
      });
      setExperienceData(pastExp);
    } else {
      setExperienceData([]);
    }
  }

  function editExperience(index, key, value) {
    // Functional updater — several onChange handlers above (Present/isPaid checkboxes) call this
    // twice synchronously in one event (once for the toggled field, once to clear a dependent
    // field). Building the next array from the `experienceData` closure instead of the latest
    // state meant the second call silently overwrote the first call's update before a re-render
    // ever happened — e.g. checking "Present" cleared the end date but the checkbox itself never
    // visibly checked.
    setExperienceData((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  }
}
