import CustomButton from "@/components/Global/Button/button";
import { DatePicker, Space, Avatar, Row, Col, Input, Tag, Upload, Button, Popconfirm, message, Modal } from "antd";
import { PlusOutlined, GithubOutlined, GlobalOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { validateUrlDomain, validateGenericUrl } from "@/utils/urlValidation";

const safeHref = (url) => {
  if (!url) return '#';
  try { const u = new URL(url); return (u.protocol === 'http:' || u.protocol === 'https:') ? url : '#'; }
  catch { return '#'; }
};
const { TextArea } = Input;

const RichTextEditor = dynamic(() => import("@/components/Global/RichTextEditor/RichTextEditor"), { ssr: false });
const RichTextDisplay = dynamic(() => import("@/components/Global/RichTextEditor/RichTextDisplay"), { ssr: false });

export default function Projects({
  projects = [],
  projectParams,
  setProjectParams,
  onAdd,
  onUpdate,
  onDelete,
}) {
  const submittingRef = useRef(false);
  const [projectData, setProjectData] = useState([]);
  const [newProject, setNewProject] = useState({
    skillsUsed: [],
  });
  const [newSkill, setNewSkill] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (projects) {
      setProjectData([...projects]);
    } else {
      setProjectData([]);
    }
    // Reset edit/add states if list becomes empty after deletion
    if (projects && projects.length === 0 && (projectParams?.editClicked || projectParams?.addClicked)) {
      setProjectParams({ editClicked: false, addClicked: false });
      setNewProject({ skillsUsed: [] });
    }
  }, [projects]);

  const handleAddSkill = (isNew = true, index = -1) => {
    const trimmed = (newSkill || '').trim();
    if (!trimmed || trimmed.length > 100) return;
    // Strip any HTML tags
    const plain = trimmed.replace(/<[^>]*>/g, '');
    if (!plain) return;
    if (isNew) {
      if (newProject.skillsUsed?.includes(plain)) return; // no duplicates
      setNewProject({
        ...newProject,
        skillsUsed: [...(newProject.skillsUsed || []), plain],
      });
    } else if (index >= 0) {
      if (projectData[index]?.skillsUsed?.includes(plain)) return; // no duplicates
      const updated = [...projectData];
      updated[index].skillsUsed = [...(updated[index].skillsUsed || []), plain];
      setProjectData(updated);
    }
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove, isNew = true, index = -1) => {
    if (isNew) {
      setNewProject({
        ...newProject,
        skillsUsed: newProject.skillsUsed.filter(s => s !== skillToRemove),
      });
    } else if (index >= 0) {
      const updated = [...projectData];
      updated[index].skillsUsed = updated[index].skillsUsed.filter(s => s !== skillToRemove);
      setProjectData(updated);
    }
  };

  const validateProject = (project, isNew = false, index = -1) => {
    const newErrors = { ...errors };
    const errorKey = isNew ? 'name' : `name_${index}`;
    if (!project.name || !project.name.trim()) {
      newErrors[errorKey] = "Project name is required";
    } else {
      delete newErrors[errorKey];
    }
    
    // Validate GitHub URL
    const githubKey = isNew ? 'githubUrl' : `githubUrl_${index}`;
    if (project.githubUrl && project.githubUrl.trim()) {
      const githubValidation = validateUrlDomain(project.githubUrl, 'github');
      if (!githubValidation.isValid) {
        newErrors[githubKey] = githubValidation.message;
      } else {
        delete newErrors[githubKey];
      }
    } else {
      delete newErrors[githubKey];
    }
    
    // Validate Live URL
    const liveKey = isNew ? 'liveUrl' : `liveUrl_${index}`;
    if (project.liveUrl && project.liveUrl.trim()) {
      const liveValidation = validateGenericUrl(project.liveUrl);
      if (!liveValidation.isValid) {
        newErrors[liveKey] = liveValidation.message;
      } else {
        delete newErrors[liveKey];
      }
    } else {
      delete newErrors[liveKey];
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).filter(key => newErrors[key]).length === 0;
  };

  const isSaveDisabled = () => {
    if (projectParams.addClicked) {
      const hasNameError = !newProject.name || !newProject.name.trim();
      const hasUrlErrors = errors.githubUrl || errors.liveUrl;
      return hasNameError || !!hasUrlErrors;
    }
    if (projectParams.editClicked) {
      const hasNameErrors = projectData.some(project => !project.name || !project.name.trim());
      const hasUrlErrors = Object.keys(errors).some(key => 
        (key.startsWith('githubUrl_') || key.startsWith('liveUrl_')) && errors[key]
      );
      return hasNameErrors || hasUrlErrors;
    }
    return false;
  };

  return (
    <>
      <Space className="w-100" direction="vertical" size={16}>
        {projectParams?.addClicked && (
          <div className="d-flex gap-3">
            <Avatar shape="square" className="bg-white9FC clrFour" icon={<i className="bi bi-code-square"></i>} />
            <div className="w-100">
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={24} md={12}>
                  <div>
                    <div className="mb-1">
                      <span className="fnt-13 clrgray2BB">Project Name</span>
                      <span className="ln-required-asterisk">*</span>
                    </div>
                    <Input
                      className={errors.name ? "ln-in2 error" : "ln-in2"}
                      placeholder="Project Name"
                      value={newProject.name || ""}
                      onChange={e => {
                        setNewProject({ ...newProject, name: e.target.value });
                        if (errors.name) {
                          setErrors({ ...errors, name: "" });
                        }
                      }}
                      onBlur={() => validateProject(newProject, true)}
                    />
                    {errors.name && (
                      <div className="ln-form-error">
                        {errors.name}
                      </div>
                    )}
                  </div>
                </Col>
                <Col xs={24} sm={24} md={6}>
                  <div>
                    <div className="mb-1">
                      <span className="fnt-13 clrgray2BB">GitHub URL</span>
                    </div>
                    <Input
                      className={errors.githubUrl ? "ln-in2 error" : "ln-in2"}
                      placeholder="https://github.com/username/repo"
                      prefix={<GithubOutlined />}
                      value={newProject.githubUrl || ''}
                      onChange={e => {
                        setNewProject({ ...newProject, githubUrl: e.target.value });
                        if (errors.githubUrl) {
                          setErrors({ ...errors, githubUrl: '' });
                        }
                      }}
                      onBlur={() => validateProject(newProject, true)}
                    />
                    {errors.githubUrl && (
                      <div className="ln-form-error">
                        {errors.githubUrl}
                      </div>
                    )}
                  </div>
                </Col>
                <Col xs={24} sm={24} md={6}>
                  <div>
                    <div className="mb-1">
                      <span className="fnt-13 clrgray2BB">Live URL</span>
                    </div>
                    <Input
                      className={errors.liveUrl ? "ln-in2 error" : "ln-in2"}
                      placeholder="https://yourproject.com"
                      prefix={<GlobalOutlined />}
                      value={newProject.liveUrl || ''}
                      onChange={e => {
                        setNewProject({ ...newProject, liveUrl: e.target.value });
                        if (errors.liveUrl) {
                          setErrors({ ...errors, liveUrl: '' });
                        }
                      }}
                      onBlur={() => validateProject(newProject, true)}
                    />
                    {errors.liveUrl && (
                      <div className="ln-form-error">
                        {errors.liveUrl}
                      </div>
                    )}
                  </div>
                </Col>
                <Col span={24}>
                  <RichTextEditor
                    value={newProject?.description || ""}
                    onChange={(content) => setNewProject({ ...newProject, description: content })}
                    placeholder="Enter project description (supports bullet points, formatting, etc.)"
                    height={250}
                  />
                </Col>
                <Col span={24}>
                  <div className="mb-2">Skills Used:</div>
                  <Space wrap>
                    {newProject.skillsUsed?.map((skill, i) => (
                      <Tag key={i} closable onClose={() => handleRemoveSkill(skill, true)}>
                        {skill}
                      </Tag>
                    ))}
                    <Input
                      style={{ width: 100 }}
                      size="small"
                      placeholder="Add skill"
                      value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                      onPressEnter={() => handleAddSkill(true)}
                    />
                    <Button size="small" onClick={() => handleAddSkill(true)} icon={<PlusOutlined />} />
                  </Space>
                </Col>
              </Row>
            </div>
          </div>
        )}

        {projectData?.map((project, index) => (
          <div className="d-flex gap-3" key={index}>
            <Avatar shape="square" className="bg-white9FC clrFour" icon={<i className="bi bi-code-square"></i>} />
            {projectParams?.editClicked ? (
              <div className="w-100">
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={24} md={12}>
                    <div>
                      <div className="mb-1">
                        <span className="fnt-13 clrgray2BB">Project Name</span>
                        <span className="ln-required-asterisk">*</span>
                      </div>
                      <Input
                        value={project?.name || ""}
                        className={errors[`name_${index}`] ? "ln-in2 error" : "ln-in2"}
                        placeholder="Project Name"
                        onChange={e => {
                          const updated = [...projectData];
                          updated[index].name = e.target.value;
                          setProjectData(updated);
                          if (errors[`name_${index}`]) {
                            setErrors({ ...errors, [`name_${index}`]: "" });
                          }
                        }}
                        onBlur={() => validateProject(project, false, index)}
                      />
                      {errors[`name_${index}`] && (
                        <div className="ln-form-error">
                          {errors[`name_${index}`]}
                        </div>
                      )}
                    </div>
                  </Col>
                  <Col xs={24} sm={24} md={6}>
                    <div>
                      <div className="mb-1">
                        <span className="fnt-13 clrgray2BB">GitHub URL</span>
                      </div>
                      <Input
                        value={project?.githubUrl || ''}
                        className={errors[`githubUrl_${index}`] ? "ln-in2 error" : "ln-in2"}
                        placeholder="https://github.com/username/repo"
                        prefix={<GithubOutlined />}
                        onChange={e => {
                          const updated = [...projectData];
                          updated[index].githubUrl = e.target.value;
                          setProjectData(updated);
                          if (errors[`githubUrl_${index}`]) {
                            setErrors({ ...errors, [`githubUrl_${index}`]: '' });
                          }
                        }}
                        onBlur={() => validateProject(project, false, index)}
                      />
                      {errors[`githubUrl_${index}`] && (
                        <div className="ln-form-error">
                          {errors[`githubUrl_${index}`]}
                        </div>
                      )}
                    </div>
                  </Col>
                  <Col xs={24} sm={24} md={6}>
                    <div>
                      <div className="mb-1">
                        <span className="fnt-13 clrgray2BB">Live URL</span>
                      </div>
                      <Input
                        value={project?.liveUrl || ''}
                        className={errors[`liveUrl_${index}`] ? "ln-in2 error" : "ln-in2"}
                        placeholder="https://yourproject.com"
                        prefix={<GlobalOutlined />}
                        onChange={e => {
                          const updated = [...projectData];
                          updated[index].liveUrl = e.target.value;
                          setProjectData(updated);
                          if (errors[`liveUrl_${index}`]) {
                            setErrors({ ...errors, [`liveUrl_${index}`]: '' });
                          }
                        }}
                        onBlur={() => validateProject(project, false, index)}
                      />
                      {errors[`liveUrl_${index}`] && (
                        <div className="ln-form-error">
                          {errors[`liveUrl_${index}`]}
                        </div>
                      )}
                    </div>
                  </Col>
                  <Col span={24}>
                    <RichTextEditor
                      value={project?.description || ""}
                      onChange={(content) => {
                        const updated = [...projectData];
                        updated[index].description = content;
                        setProjectData(updated);
                      }}
                      placeholder="Enter project description (supports bullet points, formatting, etc.)"
                      height={250}
                    />
                  </Col>
                  <Col span={24}>
                    <Space wrap>
                      {project.skillsUsed?.map((skill, i) => (
                        <Tag key={i} closable onClose={() => handleRemoveSkill(skill, false, index)}>
                          {skill}
                        </Tag>
                      ))}
                      <Input
                        style={{ width: 100 }}
                        size="small"
                        placeholder="Add skill"
                        value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        onPressEnter={() => handleAddSkill(false, index)}
                      />
                    </Space>
                  </Col>
                  <Col span={24}>
                    <Popconfirm
                      title="Delete this project?"
                      description="This can't be undone."
                      onConfirm={() => onDelete && onDelete(index)}
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                      cancelText="Cancel"
                    >
                      <Button danger icon={<DeleteOutlined />} aria-label={`Delete project ${project.name || index + 1}`}>
                        Delete Project
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
                      {project?.name}
                    </div>
                    <Space className="mt-2">
                      {project?.githubUrl && (
                        <a href={safeHref(project.githubUrl)} target="_blank" rel="noopener noreferrer">
                          <Tag icon={<GithubOutlined />} color="default">GitHub</Tag>
                        </a>
                      )}
                      {project?.liveUrl && (
                        <a href={safeHref(project.liveUrl)} target="_blank" rel="noopener noreferrer">
                          <Tag icon={<GlobalOutlined />} color="blue">Live Demo</Tag>
                        </a>
                      )}
                    </Space>
                  </Col>
                </Row>
                <div className="ln-lto-reg clrFour my-2">
                  <RichTextDisplay content={project?.description} />
                </div>
                <Space wrap>
                  {(Array.isArray(project.skillsUsed) ? project.skillsUsed : [])
                    .filter(s => typeof s === 'string')
                    .map((skill, i) => <Tag key={i} color="purple">{skill}</Tag>)}
                </Space>
              </div>
            )}
          </div>
        ))}
        {!projectParams?.addClicked && projectData?.length === 0 && (
          <div className="profile-empty-state">No projects added</div>
        )}
      </Space>

      {(projectParams?.editClicked || projectParams?.addClicked) && (
        <Row className="profile-section-actions" justify="end">
          <CustomButton
            title="Cancel"
            buttonType="primary"
            disabled={saving}
            onClick={() => Modal.confirm({
              title: "Discard project changes?",
              content: "Your unsaved project details will be lost.",
              okText: "Discard changes",
              okButtonProps: { danger: true },
              cancelText: "Keep editing",
              onOk: () => {
                setProjectData([...projects]);
                setNewProject({ skillsUsed: [] });
                setErrors({});
                setProjectParams({ editClicked: false, addClicked: false });
              },
            })}
          />
          <CustomButton
            styleClass="ms-2"
            title="Save"
            buttonType="primary"
            disabled={isSaveDisabled() || saving}
            loading={saving}
            onClick={async () => {
              if (submittingRef.current || saving) return;
              submittingRef.current = true;
              setSaving(true);
              try {
                if (projectParams.addClicked) {
                  if (!validateProject(newProject, true)) {
                    message.error("Please fix all validation errors before saving");
                    return;
                  }
                  if (await onAdd(newProject) === false) return;
                }
                if (projectParams.editClicked) {
                  let hasErrors = false;
                  for (let i = 0; i < projectData.length; i++) {
                    if (!validateProject(projectData[i], false, i)) {
                      hasErrors = true;
                    }
                  }
                  if (hasErrors) {
                    message.error("Please fix all validation errors before saving");
                    return;
                  }
                  for (let i = 0; i < projectData.length; i++) {
                    if (await onUpdate(i, projectData[i]) === false) return;
                  }
                }
                setNewProject({ skillsUsed: [] });
                setErrors({});
                setProjectParams({ editClicked: false, addClicked: false });
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
