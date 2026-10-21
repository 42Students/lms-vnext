import CustomButton from "@/components/Global/Button/button";
import { Space, Row, Col, Input, Button, Modal } from "antd";
import { LinkedinOutlined, GithubOutlined, GlobalOutlined, TwitterOutlined, CodeOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { validateUrlDomain, validateGenericUrl } from "@/utils/urlValidation";
import useChoices, { codingProblem, codingUsername } from "@/hooks/useChoices";

const safeUrlOf = (url) => (url && /^https?:\/\//i.test(url) ? url : null);

export default function SocialProfiles({
  social = {},
  socialEdit,
  setSocialEdit,
  onUpdate,
  isTeacher = false,
}) {
  const [socialData, setSocialData] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const { codingPlatforms } = useChoices();
  const coding = socialData?.codingProfiles || {};
  const setCoding = (platform, value) => {
    setSocialData({ ...socialData, codingProfiles: { ...coding, [platform.value]: value } });
    setErrors({ ...errors, [`coding_${platform.value}`]: codingProblem(platform, value) });
  };
  const codingLinks = (socialData?.codingProfileLinks || []).filter((l) => safeUrlOf(l.url));

  useEffect(() => {
    if (social) {
      setSocialData({ ...social });
      setErrors({}); // Reset errors when social data changes
    }
  }, [social]);

  const requestCancel = () => {
    if (saving) return;
    if (JSON.stringify(socialData || {}) === JSON.stringify(social || {})) {
      setSocialEdit(false);
      return;
    }
    Modal.confirm({
      title: "Discard social-profile changes?",
      content: "Your unsaved profile links will be lost.",
      okText: "Discard changes",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => {
        setSocialData({ ...social });
        setErrors({});
        setSocialEdit(false);
      },
    });
  };

  const validateUrl = (url, type) => {
    if (type === 'linkedin') {
      return validateUrlDomain(url, 'linkedin');
    } else if (type === 'github') {
      return validateUrlDomain(url, 'github');
    } else if (type === 'twitter') {
      return validateUrlDomain(url, 'twitter');
    } else if (type === 'googleScholar') {
      return validateUrlDomain(url, 'googleScholar');
    } else if (type === 'researchGate') {
      return validateUrlDomain(url, 'researchGate');
    } else {
      // Portfolio and other generic URLs
      return validateGenericUrl(url);
    }
  };

  const handleUrlChange = (type, value) => {
    setSocialData({ ...socialData, [type]: value });
    
    // Validate URL
    const validation = validateUrl(value, type);
    if (validation.isValid) {
      setErrors({ ...errors, [type]: '' });
    } else {
      setErrors({ ...errors, [type]: validation.message });
    }
  };

  const hasErrors = () => {
    return Object.values(errors).some(error => error && error.trim() !== '');
  };

  const safeUrl = safeUrlOf;

  const renderLink = (url, icon, label) => {
    const safe = safeUrl(url);
    if (!safe) return null;
    return (
      <a href={safe} target="_blank" rel="noopener noreferrer" className="me-3">
        <Button icon={icon}>{label}</Button>
      </a>
    );
  };

  return (
    <>
      {!socialEdit ? (
        <Space wrap size={[10, 10]}>
          {renderLink(socialData?.linkedIn, <LinkedinOutlined />, "LinkedIn")}
          {!isTeacher && renderLink(socialData?.github, <GithubOutlined />, "GitHub")}
          {!isTeacher && renderLink(socialData?.portfolio, <GlobalOutlined />, "Portfolio")}
          {!isTeacher && renderLink(socialData?.twitter, <TwitterOutlined />, "Twitter")}
          {isTeacher && renderLink(socialData?.googleScholar, <GlobalOutlined />, "Google Scholar")}
          {isTeacher && renderLink(socialData?.researchGate, <GlobalOutlined />, "ResearchGate")}
          {!isTeacher && codingLinks.map((l) => (
            <a key={l.key} href={l.url} target="_blank" rel="noopener noreferrer" className="me-3">
              <Button icon={<CodeOutlined />}>{l.label}: {l.username}</Button>
            </a>
          ))}
          {!socialData?.linkedIn && !socialData?.github && !socialData?.portfolio && !socialData?.twitter && !socialData?.googleScholar && !socialData?.researchGate && codingLinks.length === 0 && (
            <div className="profile-empty-state">No social profiles added</div>
          )}
        </Space>
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <div>
              <Input
                value={socialData?.linkedIn || ''}
                className={errors.linkedIn ? "ln-in2 error" : "ln-in2"}
                placeholder="LinkedIn URL (e.g., https://linkedin.com/in/username)"
                prefix={<LinkedinOutlined />}
                onChange={e => handleUrlChange('linkedIn', e.target.value)}
                onBlur={() => {
                  const validation = validateUrl(socialData?.linkedIn, 'linkedin');
                  if (!validation.isValid) {
                    setErrors({ ...errors, linkedIn: validation.message });
                  }
                }}
              />
              {errors.linkedIn && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                  {errors.linkedIn}
                </div>
              )}
            </div>
          </Col>
          {!isTeacher && (
            <>
              <Col xs={24} sm={12}>
                <div>
                  <Input
                    value={socialData?.github || ''}
                    className={errors.github ? "ln-in2 error" : "ln-in2"}
                    placeholder="GitHub URL (e.g., https://github.com/username)"
                    prefix={<GithubOutlined />}
                    onChange={e => handleUrlChange('github', e.target.value)}
                    onBlur={() => {
                      const validation = validateUrl(socialData?.github, 'github');
                      if (!validation.isValid) {
                        setErrors({ ...errors, github: validation.message });
                      }
                    }}
                  />
                  {errors.github && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                      {errors.github}
                    </div>
                  )}
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div>
                  <Input
                    value={socialData?.portfolio || ''}
                    className={errors.portfolio ? "ln-in2 error" : "ln-in2"}
                    placeholder="Portfolio URL (e.g., https://yourportfolio.com)"
                    prefix={<GlobalOutlined />}
                    onChange={e => handleUrlChange('portfolio', e.target.value)}
                    onBlur={() => {
                      const validation = validateUrl(socialData?.portfolio, 'portfolio');
                      if (!validation.isValid) {
                        setErrors({ ...errors, portfolio: validation.message });
                      }
                    }}
                  />
                  {errors.portfolio && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                      {errors.portfolio}
                    </div>
                  )}
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div>
                  <Input
                    value={socialData?.twitter || ''}
                    className={errors.twitter ? "ln-in2 error" : "ln-in2"}
                    placeholder="Twitter URL (e.g., https://twitter.com/username)"
                    prefix={<TwitterOutlined />}
                    onChange={e => handleUrlChange('twitter', e.target.value)}
                    onBlur={() => {
                      const validation = validateUrl(socialData?.twitter, 'twitter');
                      if (!validation.isValid) {
                        setErrors({ ...errors, twitter: validation.message });
                      }
                    }}
                  />
                  {errors.twitter && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                      {errors.twitter}
                    </div>
                  )}
                </div>
              </Col>
              <Col xs={24}>
                <div className="profile-coding-heading">Coding profiles <span className="profile-coding-heading__hint">your username, or paste your profile link</span></div>
              </Col>
              {codingPlatforms.map((platform) => (
                <Col xs={24} sm={12} key={platform.value}>
                  <Input
                    value={coding[platform.value] || ""}
                    className={errors[`coding_${platform.value}`] ? "ln-in2 error" : "ln-in2"}
                    aria-label={`${platform.label} username`}
                    addonBefore={platform.label}
                    placeholder="username"
                    prefix={<CodeOutlined />}
                    onChange={(e) => setCoding(platform, e.target.value)}
                  />
                  {errors[`coding_${platform.value}`] && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                      {errors[`coding_${platform.value}`]}
                    </div>
                  )}
                </Col>
              ))}
            </>
          )}
          {isTeacher && (
            <>
              <Col xs={24} sm={12}>
                <div>
                  <Input
                    value={socialData?.googleScholar || ''}
                    className={errors.googleScholar ? "ln-in2 error" : "ln-in2"}
                    placeholder="Google Scholar URL (e.g., https://scholar.google.com/citations?user=...)"
                    prefix={<GlobalOutlined />}
                    onChange={e => handleUrlChange('googleScholar', e.target.value)}
                    onBlur={() => {
                      const validation = validateUrl(socialData?.googleScholar, 'googleScholar');
                      if (!validation.isValid) {
                        setErrors({ ...errors, googleScholar: validation.message });
                      }
                    }}
                  />
                  {errors.googleScholar && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                      {errors.googleScholar}
                    </div>
                  )}
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div>
                  <Input
                    value={socialData?.researchGate || ''}
                    className={errors.researchGate ? "ln-in2 error" : "ln-in2"}
                    placeholder="ResearchGate URL (e.g., https://researchgate.net/profile/username)"
                    prefix={<GlobalOutlined />}
                    onChange={e => handleUrlChange('researchGate', e.target.value)}
                    onBlur={() => {
                      const validation = validateUrl(socialData?.researchGate, 'researchGate');
                      if (!validation.isValid) {
                        setErrors({ ...errors, researchGate: validation.message });
                      }
                    }}
                  />
                  {errors.researchGate && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                      {errors.researchGate}
                    </div>
                  )}
                </div>
              </Col>
            </>
          )}
        </Row>
      )}

      {socialEdit && (
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
            disabled={hasErrors() || saving}
            loading={saving}
            onClick={async () => {
              if (hasErrors()) {
                return;
              }
              setSaving(true);
              try {
                // Students: coding profiles go as usernames (a pasted link is reduced to its username); {} clears them.
                const payload = isTeacher ? socialData : {
                  ...socialData,
                  codingProfileLinks: undefined,
                  codingProfiles: Object.fromEntries(codingPlatforms
                    .map((pl) => [pl.value, codingUsername(pl, coding[pl.value])])
                    .filter(([, u]) => u)),
                };
                const saved = await onUpdate(payload);
                if (saved !== false) {
                  setSocialEdit(false);
                  setErrors({});
                }
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
