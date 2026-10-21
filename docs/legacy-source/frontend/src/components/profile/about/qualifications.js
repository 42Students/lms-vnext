import CustomButton from "@/components/Global/Button/button";
import PrivateDocLink from "@/components/profile/PrivateDocLink";
import { Space, Avatar, Row, Col, Input, Checkbox, Select, Button, Popconfirm, message, AutoComplete, InputNumber, Modal } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { getEducationConfig, getGradingTypes, getColleges, getExamConfigs, getExamConfig } from "@/api/Services/ProfileService";
import dynamic from "next/dynamic";
import MarksheetUpload from "./MarksheetUpload";

const RichTextEditor = dynamic(() => import("@/components/Global/RichTextEditor/RichTextEditor"), { ssr: false });
const RichTextDisplay = dynamic(() => import("@/components/Global/RichTextEditor/RichTextDisplay"), { ssr: false });

/** A numeric grade above its own max (9.2 of 10 is fine; 90 of 10 is not). Letter grades are never compared. */
export const gradeAboveMax = (q) => {
  const g = Number(String(q?.grade ?? "").trim());
  const m = Number(String(q?.maxGrade ?? "").trim());
  return Number.isFinite(g) && Number.isFinite(m) && m > 0 && String(q?.grade ?? "").trim() !== "" && g > m;
};

const { Option } = Select;

export default function Qualifications({
  qualifications = [],
  setQualificationParams,
  qualificationParams,
  onAdd,
  onUpdate,
  onDelete,
  saveProfileDetails, // Kept for backward compatibility
}) {
  const [qualificationData, setQualificationData] = useState([]);
  const [newQualification, setNewQualification] = useState({
    isCurrentlyPursuing: false,
    isRecentEducation: false,
  });
  const [errors, setErrors] = useState({});
  const submittingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  
  // Education configuration state
  const [educationConfig, setEducationConfig] = useState(null);
  const [gradingTypes, setGradingTypes] = useState([]);
  const [availablePrograms, setAvailablePrograms] = useState([]);
  const [availableSpecializations, setAvailableSpecializations] = useState([]);
  const [collegeOptions, setCollegeOptions] = useState([]);
  const [collegeSearchLoading, setCollegeSearchLoading] = useState(false);
  const collegeSearchControllerRef = useRef(null);
  
  // Exam configuration state
  const [examConfigs, setExamConfigs] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examConfig, setExamConfig] = useState(null);
  const [examDetails, setExamDetails] = useState({});

  // Load education configuration on mount
  useEffect(() => {
    const loadEducationConfig = async () => {
      try {
        const [configRes, gradingRes, examConfigsRes] = await Promise.all([
          getEducationConfig(),
          getGradingTypes(),
          getExamConfigs()
        ]);
        
        if (configRes?.data?.data) {
          setEducationConfig(configRes.data.data);
        }
        
        if (examConfigsRes?.data?.data) {
          setExamConfigs(examConfigsRes.data.data);
        }
        
        if (gradingRes?.data?.data) {
          setGradingTypes(gradingRes.data.data);
        }
      } catch (error) {
        message.error('Failed to load education data. Please try again.');
      }
    };

    loadEducationConfig();
  }, []);

  // Load colleges for institution autocomplete (with AbortController to cancel stale requests)
  const loadColleges = async (searchQuery = "") => {
    if (collegeSearchControllerRef.current) collegeSearchControllerRef.current.abort();
    collegeSearchControllerRef.current = new AbortController();
    setCollegeSearchLoading(true);
    try {
      const res = await getColleges(searchQuery, { signal: collegeSearchControllerRef.current.signal });
      if (res?.data?.data) {
        const options = res.data.data.map(college => ({
          value: college,
          label: college
        }));
        setCollegeOptions(options);
      }
    } catch (error) {
      if (error.name !== 'AbortError' && error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
        message.error('College search failed');
      }
    } finally {
      setCollegeSearchLoading(false);
    }
  };

  // Load initial colleges on mount
  useEffect(() => {
    loadColleges();
  }, []);

  useEffect(() => {
    qualificationAutofill();
    // Reset edit/add states if list becomes empty after deletion
    if (qualifications && qualifications.length === 0 && (qualificationParams?.editClicked || qualificationParams?.addClicked)) {
      setQualificationParams({ editClicked: false, addClicked: false });
      setNewQualification({ isCurrentlyPursuing: false, isRecentEducation: false });
    }
  }, [qualifications]);

  // Handle education type change - update available programs
  const handleEducationTypeChange = (educationType, isNew = true, index = -1) => {
    if (!educationConfig || !educationType) {
      if (isNew) {
        setAvailablePrograms([]);
        setAvailableSpecializations([]);
      }
      return;
    }

    const educationTypeConfig = educationConfig.educationTypes?.[educationType];
    if (educationTypeConfig && educationTypeConfig.programs) {
      const programs = Object.entries(educationTypeConfig.programs).map(([key, value]) => ({
        key,
        label: value.label,
      }));
      if (isNew) {
        setAvailablePrograms(programs);
        setAvailableSpecializations([]);
      }
    } else {
      if (isNew) {
        setAvailablePrograms([]);
        setAvailableSpecializations([]);
      }
    }
    
    // Reset program and specialization when education type changes
    if (isNew) {
      setNewQualification({
        ...newQualification,
        educationType,
        program: undefined,
        specialization: undefined,
      });
    } else {
      updateQualificationAt(index, {
        educationType,
        program: undefined,
        specialization: undefined,
      });
    }
  };

  // Handle program change - update available specializations
  const handleProgramChange = (program, isNew = true, index = -1, educationType = null) => {
    const currentEducationType = educationType || (isNew ? newQualification.educationType : qualificationData[index]?.educationType);
    
    if (!educationConfig || !currentEducationType || !program) {
      if (isNew) {
        setAvailableSpecializations([]);
      }
      return;
    }

    const educationTypeConfig = educationConfig.educationTypes?.[currentEducationType];
    const programConfig = educationTypeConfig?.programs?.[program];
    
    if (programConfig && programConfig.specializations) {
      if (isNew) {
        setAvailableSpecializations(programConfig.specializations);
      }
      // For edit mode, specializations are handled in render section
    } else {
      if (isNew) {
        setAvailableSpecializations([]);
      }
    }
    
    // Reset specialization when program changes
    if (isNew) {
      setNewQualification({
        ...newQualification,
        program,
        specialization: undefined,
      });
    } else {
      updateQualificationAt(index, {
        program,
        specialization: undefined,
      });
    }
  };

  const isSaveDisabled = () => {
    if (qualificationParams.addClicked) {
      return !newQualification.educationType || !newQualification.institutionName?.trim();
    }
    if (qualificationParams.editClicked) {
      return qualificationData.some(qual => 
        !qual.educationType || !qual.institutionName?.trim()
      );
    }
    return false;
  };

  const handleSave = async () => {
    if (submittingRef.current) return;
    // Validate before saving
    if (qualificationParams.addClicked) {
      if (!newQualification.educationType) {
        setErrors({ educationType: "Education type is required" });
        message.error("Please select education type");
        return;
      }
      if (!newQualification.institutionName || !newQualification.institutionName.trim()) {
        setErrors({ institutionName: "Institution name is required" });
        message.error("Please fill in institution name");
        return;
      }
      if (!newQualification.gradingType) {
        setErrors({ ...(errors || {}), gradingType: "Grading type is required" });
        message.error("Please select grading type");
        return;
      }
      if (!newQualification.grade || !newQualification.grade.trim()) {
        setErrors({ ...(errors || {}), grade: "Grade obtained is required" });
        message.error("Please enter grade obtained");
        return;
      }
      if (!newQualification.maxGrade || !newQualification.maxGrade.trim()) {
        setErrors({ ...(errors || {}), maxGrade: "Max grade is required for job screening" });
        message.error("Please enter max grade (e.g. 10 for CGPA, 100 for Percentage)");
        return;
      }
      // "CGPA: 90 / 10" was saved and shown on a profile (student UX audit, 20 Oct 2026).
      if (gradeAboveMax(newQualification)) {
        setErrors({ ...(errors || {}), grade: "The grade can't be more than the max grade" });
        message.error(`The grade can't be more than ${newQualification.maxGrade}`);
        return;
      }
    }

    if (qualificationParams.editClicked) {
      let hasErrors = false;
      const newErrors = {};
      for (let i = 0; i < qualificationData.length; i++) {
        const q = qualificationData[i];
        if (!q.educationType) {
          newErrors[`educationType_${i}`] = "Education type is required";
          hasErrors = true;
        }
        if (!q.institutionName || !q.institutionName.trim()) {
          newErrors[`institutionName_${i}`] = "Institution name is required";
          hasErrors = true;
        }
        if (!q.gradingType) {
          newErrors[`gradingType_${i}`] = "Grading type is required";
          hasErrors = true;
        }
        if (!q.grade || !q.grade.trim()) {
          newErrors[`grade_${i}`] = "Grade obtained is required";
          hasErrors = true;
        }
        if (!q.maxGrade || !q.maxGrade.trim()) {
          newErrors[`maxGrade_${i}`] = "Max grade is required for job screening";
          hasErrors = true;
        } else if (gradeAboveMax(q)) {
          newErrors[`grade_${i}`] = "The grade can't be more than the max grade";
          hasErrors = true;
        }
      }
      if (hasErrors) {
        setErrors(newErrors);
        message.error("Check the highlighted fields: each needs a grading type, a grade and a max grade, and the grade can't be more than the max.");
        return;
      }
    }

    // Use new granular API approach if callbacks are provided
    submittingRef.current = true;
    setSaving(true);
    try {
      if (onAdd || onUpdate) {
        if (qualificationParams.addClicked) {
          // Handle currently pursuing - clear endYear if checked; send null for empty maxGrade so backend can store/clear
          const qualToSave = {
            ...newQualification,
            endYear: newQualification.isCurrentlyPursuing ? null : newQualification.endYear,
            maxGrade: newQualification.maxGrade || null,
          };
          if (await onAdd(qualToSave) === false) return;
        }
        if (qualificationParams.editClicked) {
          for (let i = 0; i < qualificationData.length; i++) {
            const qualToSave = {
              ...qualificationData[i],
              endYear: qualificationData[i].isCurrentlyPursuing ? null : qualificationData[i].endYear,
              maxGrade: qualificationData[i].maxGrade || null,
            };
            if (await onUpdate(i, qualToSave) === false) return;
          }
        }
        setNewQualification({ isCurrentlyPursuing: false, isRecentEducation: false });
        setErrors({});
        setQualificationParams({ editClicked: false, addClicked: false });
      } else if (saveProfileDetails) {
        // Fallback to old approach (shouldn't be used with new structure)
        message.warning("Please use the new API endpoints for education");
      }
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  };

  // Get education type options
  const getEducationTypeOptions = () => {
    if (!educationConfig || !educationConfig.educationTypes) return [];
    return Object.entries(educationConfig.educationTypes).map(([key, value]) => ({
      value: key,
      label: value.label,
    }));
  };

  // Format display text for qualification
  const getQualificationDisplayText = (qual) => {
    const parts = [];
    if (qual.educationType && educationConfig) {
      const typeLabel = educationConfig.educationTypes?.[qual.educationType]?.label;
      if (typeLabel) parts.push(typeLabel);
    }
    if (qual.program && educationConfig) {
      const programLabel = educationConfig.educationTypes?.[qual.educationType]?.programs?.[qual.program]?.label;
      if (programLabel) parts.push(programLabel);
    }
    if (qual.specialization) {
      parts.push(qual.specialization);
    }
    // Fallback to legacy fields
    if (parts.length === 0) {
      if (qual.degree) parts.push(qual.degree);
      if (qual.field) parts.push(qual.field);
    }
    return parts.join(" - ");
  };

  // Auto-derive which qualification is "most recent" from end year / ongoing status,
  // instead of relying on a manually-toggled flag a student could forget to set (or set on the wrong entry).
  const getMostRecentQualificationIndex = (list) => {
    if (!list || list.length === 0) return -1;
    const pursuing = list
      .map((q, i) => ({ q, i }))
      .filter(({ q }) => q.isCurrentlyPursuing);
    if (pursuing.length > 0) {
      return pursuing.reduce((best, cur) =>
        (Number(cur.q.startYear) || 0) > (Number(best.q.startYear) || 0) ? cur : best
      ).i;
    }
    let bestIndex = -1;
    let bestYear = -Infinity;
    list.forEach((q, i) => {
      const year = Number(q.endYear);
      if (!isNaN(year) && year > bestYear) {
        bestYear = year;
        bestIndex = i;
      }
    });
    return bestIndex;
  };
  const mostRecentQualificationIndex = getMostRecentQualificationIndex(qualificationData);

  return (
    <>
      <Space className="w-100" direction="vertical" size={16}>
        {qualificationParams.addClicked && (
          <div className="profile-avatar-row profile-education-row profile-education-row--edit">
            <Avatar
              shape="square"
              className="bg-white9FC clrFour"
              icon={<i className="bi bi-award"></i>}
            />
            <div className="profile-education-row__content">
              <Row gutter={[12, 12]}>
                {/* Education Type */}
                <Col xs={24} sm={24} md={12}>
                  <div>
                    <div className="mb-1">
                      <span className="fnt-13 clrgray2BB">Education Type</span>
                      <span className="ln-required-asterisk">*</span>
                    </div>
                    <Select
                      className={errors.educationType ? "ln-in2 error" : "ln-in2"}
                      placeholder="Select Education Type"
                      aria-label="Degree type"
                      value={newQualification.educationType}
                      onChange={(value) => {
                        handleEducationTypeChange(value, true);
                        if (errors.educationType) {
                          setErrors({ ...errors, educationType: "" });
                        }
                      }}
                      style={{ width: '100%' }}
                    >
                      {getEducationTypeOptions().map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                    {errors.educationType && (
                      <div className="ln-form-error">
                        {errors.educationType}
                      </div>
                    )}
                  </div>
                </Col>

                {/* Program */}
                {newQualification.educationType && availablePrograms.length > 0 && (
                  <Col xs={24} sm={24} md={12}>
                    <div>
                      <div className="mb-1">
                        <span className="fnt-13 clrgray2BB">Program</span>
                      </div>
                      <Select
                        className="ln-in2"
                        placeholder="Select Program"
                        aria-label="Degree type"
                        value={newQualification.program}
                        onChange={(value) => handleProgramChange(value, true)}
                        style={{ width: '100%' }}
                      >
                        {availablePrograms.map(program => (
                          <Option key={program.key} value={program.key}>
                            {program.label}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </Col>
                )}

                {/* Specialization */}
                {newQualification.program && availableSpecializations.length > 0 && (
                  <Col xs={24} sm={24} md={12}>
                    <div>
                      <div className="mb-1">
                        <span className="fnt-13 clrgray2BB">Specialization</span>
                      </div>
                      <Select
                        className="ln-in2"
                        placeholder="Select Specialization"
                        aria-label="Specialization"
                        value={newQualification.specialization}
                        onChange={(value) => {
                          setNewQualification({ ...newQualification, specialization: value });
                        }}
                        style={{ width: '100%' }}
                      >
                        {availableSpecializations.map((spec, idx) => (
                          <Option key={idx} value={spec}>
                            {spec}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </Col>
                )}

                {/* Institution Name */}
                <Col xs={24} sm={24} md={12}>
                  <div>
                    <div className="mb-1">
                      <span className="fnt-13 clrgray2BB">Institution Name</span>
                      <span className="ln-required-asterisk">*</span>
                    </div>
                    {/* AutoComplete if requiresInstitutionAutocomplete is true (UG/PG), Input for others */}
                    {educationConfig?.educationTypes?.[newQualification.educationType]?.requiresInstitutionAutocomplete ? (
                      <AutoComplete
                        className={errors.institutionName ? "ln-in2 error" : "ln-in2"}
                        placeholder="Search or type institution name"
                        aria-label="Institution name"
                        value={newQualification.institutionName || ""}
                        options={collegeOptions}
                        loading={collegeSearchLoading}
                        onSearch={(value) => {
                          loadColleges(value);
                        }}
                        onChange={(value) => {
                          setNewQualification({ ...newQualification, institutionName: value });
                          if (errors.institutionName) {
                            setErrors({ ...errors, institutionName: "" });
                          }
                        }}
                        onBlur={() => {
                          if (!newQualification.institutionName || !newQualification.institutionName.trim()) {
                            setErrors({ ...errors, institutionName: "Institution name is required" });
                          } else {
                            setErrors({ ...errors, institutionName: "" });
                          }
                        }}
                        allowClear
                        filterOption={false}
                        style={{ width: '100%' }}
                      />
                    ) : (
                      <Input
                        className={errors.institutionName ? "ln-in2 error" : "ln-in2"}
                        placeholder="Enter institution name"
                        aria-label="Institution name"
                        value={newQualification.institutionName || ""}
                        onChange={e => {
                          setNewQualification({ ...newQualification, institutionName: e.target.value });
                          if (errors.institutionName) {
                            setErrors({ ...errors, institutionName: "" });
                          }
                        }}
                        onBlur={() => {
                          if (!newQualification.institutionName || !newQualification.institutionName.trim()) {
                            setErrors({ ...errors, institutionName: "Institution name is required" });
                          } else {
                            setErrors({ ...errors, institutionName: "" });
                          }
                        }}
                      />
                    )}
                    {errors.institutionName && (
                      <div className="ln-form-error">
                        {errors.institutionName}
                      </div>
                    )}
                  </div>
                </Col>

                {/* Start Year - End Year */}
                <Col xs={24} sm={24} md={12}>
                  <Row gutter={12}>
                    <Col span={12}>
                      <div>
                        <div className="mb-1">
                          <span className="fnt-13 clrgray2BB">Start Year</span>
                        </div>
                        <Input
                          className="ln-in2"
                          placeholder="YYYY (e.g., 2020)"
                          aria-label="Start year"
                          maxLength={4}
                          value={newQualification.startYear || ""}
                          onChange={e => {
                            const value = e.target.value.replace(/\D/g, "");
                            setNewQualification({ ...newQualification, startYear: value });
                          }}
                        />
                      </div>
                    </Col>
                    <Col span={12}>
                      <div>
                        <div className="mb-1">
                          <span className="fnt-13 clrgray2BB">End Year</span>
                        </div>
                        <Input
                          className="ln-in2"
                          placeholder="YYYY (e.g., 2024)"
                          aria-label="End year"
                          maxLength={4}
                          disabled={newQualification.isCurrentlyPursuing}
                          value={newQualification.endYear || ""}
                          onChange={e => {
                            const value = e.target.value.replace(/\D/g, "");
                            setNewQualification({ ...newQualification, endYear: value });
                          }}
                        />
                      </div>
                    </Col>
                  </Row>
                </Col>

                {/* Currently Pursuing */}
                <Col xs={24} sm={24} md={12}>
                  <Checkbox
                    checked={newQualification.isCurrentlyPursuing || false}
                    className="ln-in2 ln-circular-checkbox"
                    onChange={e => {
                      setNewQualification({
                        ...newQualification,
                        isCurrentlyPursuing: e.target.checked,
                        endYear: e.target.checked ? null : newQualification.endYear,
                      });
                    }}
                  >
                    Currently Pursuing
                  </Checkbox>
                </Col>

                {/* Grading Type - required */}
                <Col xs={24} sm={24} md={12}>
                  <div>
                    <div className="mb-1">
                      <span className="fnt-13 clrgray2BB">Grading Type</span>
                      <span className="ln-required-asterisk">*</span>
                    </div>
                    <Select
                      className={errors.gradingType ? "ln-in2 error" : "ln-in2"}
                      placeholder="Select Grading Type"
                      value={newQualification.gradingType}
                      onChange={(value) => {
                        setNewQualification({ ...newQualification, gradingType: value });
                        if (errors.gradingType) setErrors({ ...errors, gradingType: "" });
                      }}
                      style={{ width: '100%' }}
                    >
                      {gradingTypes.map(type => (
                        <Option key={type} value={type}>
                          {type}
                        </Option>
                      ))}
                    </Select>
                    {errors.gradingType && <div className="fnt-13 ln-form-error">{errors.gradingType}</div>}
                  </div>
                </Col>

                {/* Max grade - required for job screening */}
                <Col xs={24} sm={24} md={12}>
                  <div>
                    <div className="mb-1">
                      <span className="fnt-13 clrgray2BB">Max grade</span>
                      <span className="ln-required-asterisk">*</span>
                    </div>
                    <Input
                      className={errors.maxGrade ? "ln-in2 error" : "ln-in2"}
                      placeholder={
                        newQualification.gradingType === "CGPA" || newQualification.gradingType === "GPA"
                          ? "e.g. 10"
                          : newQualification.gradingType === "Percentage"
                          ? "e.g. 100"
                          : newQualification.gradingType === "Grade"
                          ? "e.g. 4 or 5"
                          : "e.g. 10 or 100"
                      }
                      value={newQualification.maxGrade ?? ""}
                      onChange={e => {
                        setNewQualification({ ...newQualification, maxGrade: e.target.value.trim() || undefined });
                        if (errors.maxGrade) setErrors({ ...errors, maxGrade: "" });
                      }}
                    />
                    {errors.maxGrade && <div className="fnt-13 ln-form-error">{errors.maxGrade}</div>}
                  </div>
                </Col>

                {/* Grade obtained */}
                <Col xs={24} sm={24} md={12}>
                  <div>
                    <div className="mb-1">
                      <span className="fnt-13 clrgray2BB">Grade obtained</span>
                      <span className="ln-required-asterisk">*</span>
                    </div>
                    <Input
                      className={errors.grade ? "ln-in2 error" : "ln-in2"}
                      placeholder={newQualification.gradingType === "CGPA" ? "e.g., 8.5" : newQualification.gradingType === "Percentage" ? "e.g., 85" : "Enter grade"}
                      value={newQualification.grade || ""}
                      onChange={e => {
                        setNewQualification({ ...newQualification, grade: e.target.value });
                        if (errors.grade) setErrors({ ...errors, grade: "" });
                      }}
                    />
                    {errors.grade && <div className="fnt-13 ln-form-error">{errors.grade}</div>}
                  </div>
                </Col>

                <Col xs={24} sm={24} md={12}>
                  <MarksheetUpload value={newQualification.certificateUpload} onChange={(url) => setNewQualification({ ...newQualification, certificateUpload: url })} />
                </Col>

                {/* Qualifying Exam Selection */}
                <Col xs={24} sm={24} md={12}>
                  <div>
                    <div className="mb-1">
                      <span className="fnt-13 clrgray2BB">Qualifying Exam (Optional)</span>
                    </div>
                    <Select
                      className="ln-in2 w-100"
                      placeholder="Select Qualifying Exam"
                      allowClear
                      value={selectedExam || undefined}
                      onChange={async (examCode) => {
                        setSelectedExam(examCode);
                        setExamDetails({});
                        if (examCode) {
                          try {
                            const res = await getExamConfig(examCode);
                            if (res?.data?.data) {
                              setExamConfig(res.data.data);
                              setNewQualification({
                                ...newQualification,
                                qualifyingExam: examCode,
                                examDetails: {}
                              });
                            }
                          } catch (error) {
                          }
                        } else {
                          setExamConfig(null);
                          setNewQualification({
                            ...newQualification,
                            qualifyingExam: null,
                            examDetails: null
                          });
                        }
                      }}
                    >
                      {examConfigs.map(exam => (
                        <Option key={exam.examCode} value={exam.examCode}>
                          {exam.examName}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </Col>

                {/* Dynamic Exam Fields */}
                {examConfig && examConfig.fields && examConfig.fields.map((field) => (
                  <Col xs={24} sm={24} md={12} key={field.name}>
                    <div>
                      <div className="mb-1">
                        <span className="fnt-13 clrgray2BB">
                          {field.label}
                          {field.required && <span className="ln-required-asterisk">*</span>}
                        </span>
                      </div>
                      {field.type === 'number' && (
                        <InputNumber
                          className="ln-in2 w-100"
                          placeholder={field.placeholder || `Enter ${field.label}`}
                          min={field.min}
                          max={field.max}
                          value={examDetails[field.name] || undefined}
                          onChange={(value) => {
                            const updatedDetails = { ...examDetails, [field.name]: value };
                            setExamDetails(updatedDetails);
                            setNewQualification({
                              ...newQualification,
                              examDetails: updatedDetails
                            });
                          }}
                        />
                      )}
                      {field.type === 'text' && (
                        <Input
                          className="ln-in2"
                          placeholder={field.placeholder || `Enter ${field.label}`}
                          value={examDetails[field.name] || ""}
                          onChange={(e) => {
                            const updatedDetails = { ...examDetails, [field.name]: e.target.value };
                            setExamDetails(updatedDetails);
                            setNewQualification({
                              ...newQualification,
                              examDetails: updatedDetails
                            });
                          }}
                        />
                      )}
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          </div>
        )}
        
        {/* Display Qualifications (sorted: recent first, then by start year) */}
        {!qualificationParams.addClicked && qualificationData?.length === 0 && (
          <div className="profile-empty-state">
            No education details added yet. Add your latest qualification to complete this section.
          </div>
        )}
        {qualificationData?.length > 0 &&
          qualificationData.map((qualification, index) => (
            <div className={`profile-avatar-row profile-education-row${qualificationParams?.editClicked ? " profile-education-row--edit" : ""}`} key={index}>
              <Avatar
                shape="square"
                className="bg-white9FC clrFour"
                icon={<i className="bi bi-award"></i>}
              />
              {qualificationParams?.editClicked ? (
                <div className="profile-education-row__content">
                  <Row gutter={[12, 12]}>
                    {/* Education Type */}
                    <Col xs={24} sm={24} md={12}>
                      <div>
                        <div className="mb-1">
                          <span className="fnt-13 clrgray2BB">Education Type</span>
                          <span className="ln-required-asterisk">*</span>
                        </div>
                        <Select
                          className={errors[`educationType_${index}`] ? "ln-in2 error" : "ln-in2"}
                          placeholder="Select Education Type"
                          aria-label="Degree type"
                          value={qualification.educationType}
                          onChange={(value) => {
                            handleEducationTypeChange(value, false, index);
                            if (errors[`educationType_${index}`]) {
                              setErrors({ ...errors, [`educationType_${index}`]: "" });
                            }
                          }}
                          style={{ width: '100%' }}
                        >
                          {getEducationTypeOptions().map(option => (
                            <Option key={option.value} value={option.value}>
                              {option.label}
                            </Option>
                          ))}
                        </Select>
                        {errors[`educationType_${index}`] && (
                          <div className="ln-form-error">
                            {errors[`educationType_${index}`]}
                          </div>
                        )}
                      </div>
                    </Col>

                    {/* Program */}
                    {qualification.educationType && educationConfig && (
                      <Col xs={24} sm={24} md={12}>
                        <div>
                          <div className="mb-1">
                            <span className="fnt-13 clrgray2BB">Program</span>
                          </div>
                          <Select
                            className="ln-in2"
                            placeholder="Select Program"
                            aria-label="Degree type"
                            value={qualification.program}
                            onChange={(value) => handleProgramChange(value, false, index, qualification.educationType)}
                            style={{ width: '100%' }}
                          >
                            {(() => {
                              const typeConfig = educationConfig.educationTypes?.[qualification.educationType];
                              const programs = typeConfig?.programs ? Object.entries(typeConfig.programs).map(([key, value]) => ({
                                key,
                                label: value.label,
                              })) : [];
                              return programs.map(program => (
                                <Option key={program.key} value={program.key}>
                                  {program.label}
                                </Option>
                              ));
                            })()}
                          </Select>
                        </div>
                      </Col>
                    )}

                    {/* Specialization */}
                    {qualification.program && qualification.educationType && educationConfig && (
                      <Col xs={24} sm={24} md={12}>
                        <div>
                          <div className="mb-1">
                            <span className="fnt-13 clrgray2BB">Specialization</span>
                          </div>
                          <Select
                            className="ln-in2"
                            placeholder="Select Specialization"
                            aria-label="Specialization"
                            value={qualification.specialization}
                            onChange={(value) => editQualification(index, "specialization", value)}
                            style={{ width: '100%' }}
                          >
                            {(() => {
                              const typeConfig = educationConfig.educationTypes?.[qualification.educationType];
                              const programConfig = typeConfig?.programs?.[qualification.program];
                              const specializations = programConfig?.specializations || [];
                              return specializations.map((spec, idx) => (
                                <Option key={idx} value={spec}>
                                  {spec}
                                </Option>
                              ));
                            })()}
                          </Select>
                        </div>
                      </Col>
                    )}

                    {/* Institution Name */}
                    <Col xs={24} sm={24} md={12}>
                      <div>
                        <div className="mb-1">
                          <span className="fnt-13 clrgray2BB">Institution Name</span>
                          <span className="ln-required-asterisk">*</span>
                        </div>
                        {/* AutoComplete if requiresInstitutionAutocomplete is true (UG/PG), Input for others */}
                        {educationConfig?.educationTypes?.[qualification.educationType]?.requiresInstitutionAutocomplete ? (
                          <AutoComplete
                            className={errors[`institutionName_${index}`] ? "ln-in2 error" : "ln-in2"}
                            placeholder="Search or type institution name"
                            aria-label="Institution name"
                            value={qualification.institutionName || ""}
                            options={collegeOptions}
                            loading={collegeSearchLoading}
                            onSearch={(value) => {
                              loadColleges(value);
                            }}
                            onChange={(value) => {
                              editQualification(index, "institutionName", value);
                              if (errors[`institutionName_${index}`]) {
                                setErrors({ ...errors, [`institutionName_${index}`]: "" });
                              }
                            }}
                            onBlur={() => {
                              if (!qualification.institutionName || !qualification.institutionName.trim()) {
                                setErrors({ ...errors, [`institutionName_${index}`]: "Institution name is required" });
                              } else {
                                setErrors({ ...errors, [`institutionName_${index}`]: "" });
                              }
                            }}
                            allowClear
                            filterOption={false}
                            style={{ width: '100%' }}
                          />
                        ) : (
                          <Input
                            className={errors[`institutionName_${index}`] ? "ln-in2 error" : "ln-in2"}
                            placeholder="Enter institution name"
                            aria-label="Institution name"
                            value={qualification.institutionName || ""}
                            onChange={e => {
                              editQualification(index, "institutionName", e.target.value);
                              if (errors[`institutionName_${index}`]) {
                                setErrors({ ...errors, [`institutionName_${index}`]: "" });
                              }
                            }}
                            onBlur={() => {
                              if (!qualification.institutionName || !qualification.institutionName.trim()) {
                                setErrors({ ...errors, [`institutionName_${index}`]: "Institution name is required" });
                              } else {
                                setErrors({ ...errors, [`institutionName_${index}`]: "" });
                              }
                            }}
                          />
                        )}
                        {errors[`institutionName_${index}`] && (
                          <div className="ln-form-error">
                            {errors[`institutionName_${index}`]}
                          </div>
                        )}
                      </div>
                    </Col>

                    {/* Start Year - End Year */}
                    <Col xs={24} sm={24} md={12}>
                      <Row gutter={12}>
                        <Col span={12}>
                          <div>
                            <div className="mb-1">
                              <span className="fnt-13 clrgray2BB">Start Year</span>
                            </div>
                            <Input
                              className="ln-in2"
                              placeholder="YYYY"
                              aria-label="Start year"
                              maxLength={4}
                              value={qualification.startYear || ""}
                              onChange={e => {
                                const value = e.target.value.replace(/\D/g, "");
                                editQualification(index, "startYear", value);
                              }}
                            />
                          </div>
                        </Col>
                        <Col span={12}>
                          <div>
                            <div className="mb-1">
                              <span className="fnt-13 clrgray2BB">End Year</span>
                            </div>
                            <Input
                              className="ln-in2"
                              placeholder="YYYY"
                              aria-label="End year"
                              maxLength={4}
                              disabled={qualification.isCurrentlyPursuing}
                              value={qualification.endYear || ""}
                              onChange={e => {
                                const value = e.target.value.replace(/\D/g, "");
                                editQualification(index, "endYear", value);
                              }}
                            />
                          </div>
                        </Col>
                      </Row>
                    </Col>

                    {/* Currently Pursuing */}
                    <Col xs={24} sm={24} md={12}>
                      <Checkbox
                        checked={qualification.isCurrentlyPursuing || false}
                        className="ln-in2 ln-circular-checkbox"
                        onChange={e => {
                          editQualification(index, "isCurrentlyPursuing", e.target.checked);
                          if (e.target.checked) {
                            editQualification(index, "endYear", null);
                          }
                        }}
                      >
                        Currently Pursuing
                      </Checkbox>
                    </Col>

                    {/* Grading Type - required */}
                    <Col xs={24} sm={24} md={12}>
                      <div>
                        <div className="mb-1">
                          <span className="fnt-13 clrgray2BB">Grading Type</span>
                          <span className="ln-required-asterisk">*</span>
                        </div>
                        <Select
                          className={errors[`gradingType_${index}`] ? "ln-in2 error" : "ln-in2"}
                          placeholder="Select Grading Type"
                          value={qualification.gradingType}
                          onChange={(value) => {
                            editQualification(index, "gradingType", value);
                            if (errors[`gradingType_${index}`]) setErrors({ ...errors, [`gradingType_${index}`]: "" });
                          }}
                          style={{ width: '100%' }}
                        >
                          {gradingTypes.map(type => (
                            <Option key={type} value={type}>
                              {type}
                            </Option>
                          ))}
                        </Select>
                        {errors[`gradingType_${index}`] && <div className="fnt-13 ln-form-error">{errors[`gradingType_${index}`]}</div>}
                      </div>
                    </Col>

                    {/* Max grade - required */}
                    <Col xs={24} sm={24} md={12}>
                      <div>
                        <div className="mb-1">
                          <span className="fnt-13 clrgray2BB">Max grade</span>
                          <span className="ln-required-asterisk">*</span>
                        </div>
                        <Input
                          className={errors[`maxGrade_${index}`] ? "ln-in2 error" : "ln-in2"}
                          placeholder={
                            qualification.gradingType === "CGPA" || qualification.gradingType === "GPA"
                              ? "e.g. 10"
                              : qualification.gradingType === "Percentage"
                              ? "e.g. 100"
                              : "e.g. 10 or 100"
                          }
                          value={qualification.maxGrade ?? ""}
                          onChange={e => {
                            editQualification(index, "maxGrade", e.target.value.trim() || undefined);
                            if (errors[`maxGrade_${index}`]) setErrors({ ...errors, [`maxGrade_${index}`]: "" });
                          }}
                        />
                        {errors[`maxGrade_${index}`] && <div className="fnt-13 ln-form-error">{errors[`maxGrade_${index}`]}</div>}
                      </div>
                    </Col>

                    {/* Grade obtained */}
                    <Col xs={24} sm={24} md={12}>
                      <div>
                        <div className="mb-1">
                          <span className="fnt-13 clrgray2BB">Grade obtained</span>
                          <span className="ln-required-asterisk">*</span>
                        </div>
                        <Input
                          className={errors[`grade_${index}`] ? "ln-in2 error" : "ln-in2"}
                          placeholder={qualification.gradingType === "CGPA" ? "e.g., 8.5" : qualification.gradingType === "Percentage" ? "e.g., 85" : "Enter grade"}
                          value={qualification.grade || ""}
                          onChange={e => {
                            editQualification(index, "grade", e.target.value);
                            if (errors[`grade_${index}`]) setErrors({ ...errors, [`grade_${index}`]: "" });
                          }}
                        />
                        {errors[`grade_${index}`] && <div className="fnt-13 ln-form-error">{errors[`grade_${index}`]}</div>}
                      </div>
                    </Col>

                    <Col xs={24} sm={24} md={12}>
                      <MarksheetUpload value={qualification.certificateUpload} onChange={(url) => editQualification(index, "certificateUpload", url)} />
                    </Col>

                    {/* Qualifying Exam Selection - Edit Mode */}
                    <Col xs={24} sm={24} md={12}>
                      <div>
                        <div className="mb-1">
                          <span className="fnt-13 clrgray2BB">Qualifying Exam (Optional)</span>
                        </div>
                        <Select
                          className="ln-in2 w-100"
                          placeholder="Select Qualifying Exam"
                          allowClear
                          value={qualification.qualifyingExam || undefined}
                          onChange={async (examCode) => {
                            if (examCode) {
                              try {
                                const res = await getExamConfig(examCode);
                                if (res?.data?.data) {
                                  const updatedQual = { ...qualification, qualifyingExam: examCode, examDetails: qualification.examDetails || {} };
                                  editQualification(index, "qualifyingExam", examCode);
                                  if (!qualification.examDetails) {
                                    editQualification(index, "examDetails", {});
                                  }
                                }
                              } catch (error) {
                              }
                            } else {
                              editQualification(index, "qualifyingExam", null);
                              editQualification(index, "examDetails", null);
                            }
                          }}
                        >
                          {examConfigs.map(exam => (
                            <Option key={exam.examCode} value={exam.examCode}>
                              {exam.examName}
                            </Option>
                          ))}
                        </Select>
                      </div>
                    </Col>

                    {/* Dynamic Exam Fields - Edit Mode */}
                    {qualification.qualifyingExam && (() => {
                      const examConfig = examConfigs.find(e => e.examCode === qualification.qualifyingExam);
                      if (!examConfig) return null;
                      return examConfig.fields.map((field) => (
                        <Col xs={24} sm={24} md={12} key={field.name}>
                          <div>
                            <div className="mb-1">
                              <span className="fnt-13 clrgray2BB">
                                {field.label}
                                {field.required && <span className="ln-required-asterisk">*</span>}
                              </span>
                            </div>
                            {field.type === 'number' && (
                              <InputNumber
                                className="ln-in2 w-100"
                                placeholder={field.placeholder || `Enter ${field.label}`}
                                min={field.min}
                                max={field.max}
                                value={qualification.examDetails?.[field.name] || undefined}
                                onChange={(value) => {
                                  const updatedDetails = { ...(qualification.examDetails || {}), [field.name]: value };
                                  editQualification(index, "examDetails", updatedDetails);
                                }}
                              />
                            )}
                            {field.type === 'text' && (
                              <Input
                                className="ln-in2"
                                placeholder={field.placeholder || `Enter ${field.label}`}
                                value={qualification.examDetails?.[field.name] || ""}
                                onChange={(e) => {
                                  const updatedDetails = { ...(qualification.examDetails || {}), [field.name]: e.target.value };
                                  editQualification(index, "examDetails", updatedDetails);
                                }}
                              />
                            )}
                          </div>
                        </Col>
                      ));
                    })()}

                    {/* Delete Button */}
                    <Col xs={24}>
                      {onDelete && (
                        <Popconfirm
                          title="Delete this education entry?"
                          description="This can't be undone."
                          onConfirm={() => onDelete(index)}
                          okText="Delete"
                          okButtonProps={{ danger: true }}
                          cancelText="Cancel"
                        >
                          <Button danger icon={<DeleteOutlined />}>
                            Delete Education
                          </Button>
                        </Popconfirm>
                      )}
                    </Col>
                  </Row>
                </div>
              ) : (
                <div className="profile-education-row__content">
                  <Row justify="space-between" align="top" gutter={[12, 8]} className="profile-education-row__display">
                    <Col flex="1 1 240px">
                      <Space direction="vertical" size={4}>
                        {index === mostRecentQualificationIndex && (
                          <span className="profile-education-row__badge">
                            Most Recent
                          </span>
                        )}
                        <div className="profile-education-row__title">
                          {getQualificationDisplayText(qualification) || "Education details"}
                        </div>
                        {qualification.institutionName && (
                          <div className="profile-education-row__meta">
                            <i className="bi bi-building me-1"></i>
                            {qualification.institutionName}
                          </div>
                        )}
                        {(qualification.grade && qualification.gradingType) && (
                          <div className="profile-education-row__meta">
                            {qualification.gradingType}: {qualification.maxGrade ? `${qualification.grade} / ${qualification.maxGrade}` : qualification.grade}
                          </div>
                        )}
                        <div className="profile-education-row__meta">
                          {qualification.certificateUpload
                            ? <>Marksheet attached · <PrivateDocLink value={qualification.certificateUpload}>View</PrivateDocLink></>
                            : "No marksheet yet"}
                        </div>
                        {qualification.qualifyingExam && (
                          <div className="profile-education-row__meta">
                            <i className="bi bi-award me-1"></i>
                            {qualification.qualifyingExam}
                            {qualification.examDetails && Object.keys(qualification.examDetails).length > 0 && (
                              <span className="ms-1">
                                {Object.entries(qualification.examDetails)
                                  .filter(([_, value]) => value !== null && value !== undefined && value !== '')
                                  .map(([key, value]) => {
                                    // Format field names nicely
                                    const fieldLabel = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();
                                    return `${fieldLabel}: ${value}`;
                                  })
                                  .join(', ')}
                              </span>
                            )}
                          </div>
                        )}
                      </Space>
                    </Col>
                    <Col className="profile-education-row__years">
                      {qualification.startYear && (
                        <>
                          {qualification.startYear}
                          {qualification.endYear ? ` - ${qualification.endYear}` : qualification.isCurrentlyPursuing ? " - Present" : ""}
                        </>
                      )}
                    </Col>
                  </Row>
                </div>
              )}
            </div>
          ))}
      </Space>

      {(qualificationParams?.editClicked || qualificationParams?.addClicked) && (
        <Row className="profile-section-actions" justify="end">
          <CustomButton
            title="Cancel"
            buttonType="primary"
            disabled={saving}
            onClick={() => Modal.confirm({
              title: "Discard education changes?",
              content: "Your unsaved education and exam details will be lost.",
              okText: "Discard changes",
              okButtonProps: { danger: true },
              cancelText: "Keep editing",
              onOk: () => {
                if (qualifications?.length > 0) qualificationAutofill();
                setNewQualification({ isCurrentlyPursuing: false, isRecentEducation: false });
                setSelectedExam(null);
                setExamConfig(null);
                setExamDetails({});
                setErrors({});
                setQualificationParams({ ...qualificationParams, editClicked: false, addClicked: false });
              },
            })}
          />
          <CustomButton
            styleClass="ms-2"
            title="Save"
            buttonType="primary"
            disabled={saving || isSaveDisabled()}
            loading={saving}
            onClick={handleSave}
          />
        </Row>
      )}
    </>
  );

  function qualificationAutofill() {
    if (qualifications?.length > 0) {
      // Qualifications are already sorted by backend (recent first, then by start year)
      let pastQual = [...qualifications];
      pastQual = pastQual?.map(qual => {
        return {
          ...qual,
          isCurrentlyPursuing: qual.isCurrentlyPursuing || (!qual.endYear && qual.startYear),
        };
      });
      setQualificationData(pastQual);
    } else {
      setQualificationData([]);
    }
  }

  function updateQualificationAt(index, patch) {
    setQualificationData(prev => {
      if (!Array.isArray(prev) || index < 0 || index >= prev.length) return prev;
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function editQualification(index, key, value) {
    if (key === "educationType") {
      handleEducationTypeChange(value, false, index);
    } else if (key === "program") {
      handleProgramChange(value, false, index);
    } else {
      updateQualificationAt(index, { [key]: value });
    }
  }
}
