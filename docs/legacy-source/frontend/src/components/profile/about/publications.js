import CustomButton from "@/components/Global/Button/button";
import { Space, Avatar, Row, Col, Input, Button, Popconfirm, Tag, message, Modal } from "antd";
import { DeleteOutlined, LinkOutlined, BookOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { validateGenericUrl } from "@/utils/urlValidation";
const { TextArea } = Input;

const RichTextEditor = dynamic(() => import("@/components/Global/RichTextEditor/RichTextEditor"), { ssr: false });
const RichTextDisplay = dynamic(() => import("@/components/Global/RichTextEditor/RichTextDisplay"), { ssr: false });

export default function Publications({
  publications = [],
  publicationParams,
  setPublicationParams,
  onAdd,
  onUpdate,
  onDelete,
}) {
  const [publicationData, setPublicationData] = useState([]);
  const [newPublication, setNewPublication] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (publications) {
      setPublicationData([...publications]);
    } else {
      setPublicationData([]);
    }
    // Reset edit/add states if list becomes empty after deletion
    if (publications && publications.length === 0 && (publicationParams?.editClicked || publicationParams?.addClicked)) {
      setPublicationParams({ editClicked: false, addClicked: false });
      setNewPublication({});
    }
  }, [publications]);

  return (
    <>
      <Space className="w-100" direction="vertical" size={16}>
        {publicationParams?.addClicked && (
          <div className="d-flex gap-3">
            <Avatar shape="square" className="bg-white9FC clrFour" icon={<BookOutlined />} />
            <div className="w-100">
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={24} md={12}>
                  <Input
                    className="ln-in2"
                    placeholder="Publication Title"
                    onChange={e => setNewPublication({ ...newPublication, title: e.target.value })}
                  />
                </Col>
                <Col xs={24} sm={24} md={12}>
                  <Input
                    className="ln-in2"
                    placeholder="Journal/Conference Name"
                    onChange={e => setNewPublication({ ...newPublication, journal: e.target.value })}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Input
                    className="ln-in2"
                    placeholder="Year"
                    onChange={e => setNewPublication({ ...newPublication, year: e.target.value })}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Input
                    className="ln-in2"
                    placeholder="DOI"
                    onChange={e => setNewPublication({ ...newPublication, doi: e.target.value })}
                  />
                </Col>
                <Col xs={24} sm={24} md={12}>
                  <Input
                    className="ln-in2"
                    placeholder="Authors (comma-separated)"
                    onChange={e => setNewPublication({ ...newPublication, authors: e.target.value })}
                  />
                </Col>
                <Col xs={24} sm={24} md={12}>
                  <div>
                    <Input
                      className={errors.link ? "ln-in2 error" : "ln-in2"}
                      placeholder="Publication Link (e.g., https://example.com/publication)"
                      prefix={<LinkOutlined />}
                      value={newPublication.link || ''}
                      onChange={e => {
                        setNewPublication({ ...newPublication, link: e.target.value });
                        if (errors.link) {
                          setErrors({ ...errors, link: '' });
                        }
                      }}
                      onBlur={() => {
                        if (newPublication.link && newPublication.link.trim()) {
                          const validation = validateGenericUrl(newPublication.link);
                          if (!validation.isValid) {
                            setErrors({ ...errors, link: validation.message });
                          } else {
                            setErrors({ ...errors, link: '' });
                          }
                        }
                      }}
                    />
                    {errors.link && (
                      <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                        {errors.link}
                      </div>
                    )}
                  </div>
                </Col>
                <Col span={24}>
                  <RichTextEditor
                    value={newPublication?.description || ""}
                    onChange={(content) => setNewPublication({ ...newPublication, description: content })}
                    placeholder="Enter description/abstract (supports bullet points, formatting, etc.)"
                    height={250}
                  />
                </Col>
              </Row>
            </div>
          </div>
        )}

        {publicationData?.map((pub, index) => (
          <div className="d-flex gap-3" key={index}>
            <Avatar shape="square" className="bg-white9FC clrFour" icon={<BookOutlined />} />
            {publicationParams?.editClicked ? (
              <div className="w-100">
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={24} md={12}>
                    <Input
                      value={pub?.title}
                      className="ln-in2"
                      placeholder="Title"
                      onChange={e => {
                        const updated = [...publicationData];
                        updated[index].title = e.target.value;
                        setPublicationData(updated);
                      }}
                    />
                  </Col>
                  <Col xs={24} sm={24} md={12}>
                    <Input
                      value={pub?.journal}
                      className="ln-in2"
                      placeholder="Journal"
                      onChange={e => {
                        const updated = [...publicationData];
                        updated[index].journal = e.target.value;
                        setPublicationData(updated);
                      }}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Input
                      value={pub?.year}
                      className="ln-in2"
                      placeholder="Year"
                      onChange={e => {
                        const updated = [...publicationData];
                        updated[index].year = e.target.value;
                        setPublicationData(updated);
                      }}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Input
                      value={pub?.doi}
                      className="ln-in2"
                      placeholder="DOI"
                      onChange={e => {
                        const updated = [...publicationData];
                        updated[index].doi = e.target.value;
                        setPublicationData(updated);
                      }}
                    />
                  </Col>
                  <Col xs={24} sm={24} md={12}>
                    <Input
                      value={pub?.authors}
                      className="ln-in2"
                      placeholder="Authors"
                      onChange={e => {
                        const updated = [...publicationData];
                        updated[index].authors = e.target.value;
                        setPublicationData(updated);
                      }}
                    />
                  </Col>
                  <Col xs={24} sm={24} md={12}>
                    <div>
                      <Input
                        value={pub?.link || ''}
                        className={errors[`link_${index}`] ? "ln-in2 error" : "ln-in2"}
                        placeholder="Publication Link (e.g., https://example.com/publication)"
                        prefix={<LinkOutlined />}
                        onChange={e => {
                          const updated = [...publicationData];
                          updated[index].link = e.target.value;
                          setPublicationData(updated);
                          if (errors[`link_${index}`]) {
                            setErrors({ ...errors, [`link_${index}`]: '' });
                          }
                        }}
                        onBlur={() => {
                          if (pub?.link && pub.link.trim()) {
                            const validation = validateGenericUrl(pub.link);
                            if (!validation.isValid) {
                              setErrors({ ...errors, [`link_${index}`]: validation.message });
                            } else {
                              setErrors({ ...errors, [`link_${index}`]: '' });
                            }
                          }
                        }}
                      />
                      {errors[`link_${index}`] && (
                        <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                          {errors[`link_${index}`]}
                        </div>
                      )}
                    </div>
                  </Col>
                  <Col span={24}>
                    <RichTextEditor
                      value={pub?.description || ""}
                      onChange={(content) => {
                        const updated = [...publicationData];
                        updated[index].description = content;
                        setPublicationData(updated);
                      }}
                      placeholder="Enter description/abstract (supports bullet points, formatting, etc.)"
                      height={250}
                    />
                  </Col>
                  <Col span={24}>
                    <Popconfirm
                      title="Delete this publication?"
                      description="This can't be undone."
                      onConfirm={() => onDelete && onDelete(index)}
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                      cancelText="Cancel"
                    >
                      <Button danger icon={<DeleteOutlined />}>
                        Delete Publication
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
                      {pub?.title}
                    </div>
                    <div className="fnt-1 clrgray2BB ln-lto-reg">{pub?.journal}</div>
                    {pub?.authors && (
                      <div className="fnt-13 clrgray7AE ln-lto-reg">Authors: {pub.authors}</div>
                    )}
                  </Col>
                  <Col className="fnt-13 clrgray7AE ln-lto-reg">
                    {pub?.year}
                  </Col>
                </Row>
                <div className="ln-lto-reg clrFour my-2">
                  <RichTextDisplay content={pub?.description} />
                </div>
                <Space>
                  {pub?.link && (
                    <a href={pub.link} target="_blank" rel="noopener noreferrer">
                      <Button size="small" icon={<LinkOutlined />}>View Publication</Button>
                    </a>
                  )}
                  {pub?.doi && <Tag color="blue">DOI: {pub.doi}</Tag>}
                </Space>
              </div>
            )}
          </div>
        ))}
      </Space>

      {(publicationParams?.editClicked || publicationParams?.addClicked) && (
        <Row className="mt-3 w-100" justify="end">
          <CustomButton
            title="Cancel"
            buttonType="primary"
            disabled={saving}
            onClick={() => Modal.confirm({
              title: "Discard publication changes?",
              content: "Your unsaved publication details will be lost.",
              okText: "Discard changes",
              okButtonProps: { danger: true },
              cancelText: "Keep editing",
              onOk: () => {
                setPublicationData([...publications]);
                setNewPublication({});
                setErrors({});
                setPublicationParams({ editClicked: false, addClicked: false });
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
                if (publicationParams.addClicked) {
                  if (errors.link) {
                    message.error("Please fix URL validation errors before saving");
                    return;
                  }
                  if (newPublication.title) {
                    if (await onAdd(newPublication) === false) return;
                  }
                }
                if (publicationParams.editClicked) {
                  const hasUrlErrors = Object.keys(errors).some(
                    (key) => key.startsWith("link_") && errors[key]
                  );
                  if (hasUrlErrors) {
                    message.error("Please fix URL validation errors before saving");
                    return;
                  }
                  for (let i = 0; i < publicationData.length; i++) {
                    if (await onUpdate(i, publicationData[i]) === false) return;
                  }
                }
                setNewPublication({});
                setErrors({});
                setPublicationParams({ editClicked: false, addClicked: false });
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
