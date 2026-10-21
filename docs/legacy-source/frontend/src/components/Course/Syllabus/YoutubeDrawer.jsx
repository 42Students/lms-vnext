import { message } from "antd";
import Editor from "@/components/Global/Editor/editor";
import { extractYouTubeId, toYouTubeEmbedUrl } from "@/utils/youtubeLink";
import { useEffect, useState } from "react";
import { Input, Form } from "antd";
import { useSelector } from "react-redux";
import { createLessonContent } from "@/api/Services/courseServices";
import DrawerWidget from "@/components/Global/RightDrawer/DrawerWidget";
export default function YoutubeDrawer({
  open,
  onClose,
  editSelectedYoutube = null,
}) {
  const loginUser = useSelector(state => state.loginUser);
  const isTeacherRole = loginUser?.userType == "FACULTY" ? true : false;
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [lessonContent, setLessonContent] = useState(null);
  const [YouTubeLink, setYouTubeLink] = useState("");

  const key = "updatable";

  useEffect(() => {
    getAssignmentAutofill();
  }, [editSelectedYoutube]);

  return (
    <>
      <DrawerWidget
        title={
          editSelectedYoutube ? "Update Youtube Video" : "New Youtube Video"
        }
        drawerOpen={open}
        onClose={() => {
          onClose();
        }}
        primaryButtonTitle={"Cancel"}
        secondaryButtonTitle={"Submit"}
        onClickPrimary={() => {
          onClose();
        }}
        customWidth={600}
        onClickSecondary={() => {
          form.validateFields().then(res => {
            ContentSubmit();
          });
        }}
        buttonJustification={"justify-content-end"}
        showFooter
        footerClass={"ln-comn-foot"}
      >
        <div className="ln-drawer-body">
          {contextHolder}
          <div className="row">
            <Form
              form={form}
              layout="vertical"
              name="basic"
              labelCol={{
                span: 100,
              }}
              wrapperCol={{
                span: 100,
              }}
              autoComplete="off"
            >
              <div className="ln-com-drw">
                <div className="row">
                  {" "}
                  <Form.Item
                    label={
                      <label className="ln-lb2">Youtube Video Title</label>
                    }
                    name="contentTitle"
                    rules={[
                      {
                        required: true,
                        message: "Enter Content Title",
                        whitespace: true,
                      },
                    ]}
                  >
                    <Input
                      placeholder="Enter Youtube Video Title"
                      className="ln-in2"
                    />
                  </Form.Item>
                </div>

                <div className="row">
                  <Form.Item
                    label={<label className="ln-lb2">Points</label>}
                    name="points"
                    rules={[
                      {
                        type: 'number',
                        min: 0,
                        max: 1000,
                        message: 'Points must be between 0 and 1000',
                        transform: (value) => value ? Number(value) : undefined,
                      },
                    ]}
                  >
                    <Input
                      type="number"
                      placeholder="Enter Points"
                      className="ln-in2"
                      min={0}
                      max={1000}
                    />
                  </Form.Item>
                </div>

                <div className="row">
                  <Form.Item
                    label={<label className="ln-lb2">Youtube Video Link</label>}
                    name="youtubeLink"
                    rules={[
                      {
                        required: true,
                        message: "Enter youtube link",
                        whitespace: true,
                      },
                      {
                      validator: (_, value) =>
                        !value || extractYouTubeId(value)
                          ? Promise.resolve()
                          : Promise.reject(new Error("Paste a YouTube video link (watch, youtu.be or Shorts)")),
                    },
                    ]}
                  >
                    <Input onChange={formatYoutubelink} />
                  </Form.Item>
                </div>
              </div>
            </Form>
          </div>
        </div>
      </DrawerWidget>
    </>
  );

  function formatYoutubelink(e) {
    const embed = toYouTubeEmbedUrl(e.target.value);
    if (!embed && String(e.target.value || "").trim()) {
      form.setFields([{ name: "youtubeLink", errors: ["Invalid YouTube URL"] }]);
    }
    setYouTubeLink(embed);
  }

  function getAssignmentAutofill() {
    if (isTeacherRole && editSelectedYoutube) {
      const existingLink =
        editSelectedYoutube?.contentDataDTO?.link ||
        editSelectedYoutube?.contentDataDTO?.html_content ||
        editSelectedYoutube?.contentDataDTO?.file_dto?.cloud_storage_object;
      form.setFieldsValue({
        contentTitle: editSelectedYoutube?.contentTitle,
        points: editSelectedYoutube?.points,
        youtubeLink: existingLink,
      });
      setYouTubeLink(existingLink ?? "");
      setLessonContent(existingLink ?? null);
    }
  }

  function ContentSubmit() {
    let NewData = {
      lesson_content_id: editSelectedYoutube?.id ? editSelectedYoutube?.id : 0,
      faculty_id: loginUser?.id,
      sequence: 0,
      class_id: editSelectedYoutube?.classId,
      lesson_id: editSelectedYoutube?.lessonId,
      content_type: "YOUTUBE",
      content_title: form.getFieldValue("contentTitle"),
      content_data_dto: {
        file_dto: {
          size: 0,
          encoding: "",
          mimetype: "",
          field_name: "",
          original_name: "",
          cloud_storage_object: YouTubeLink,
        },
        html_content: YouTubeLink || lessonContent,
        allow_discussions: "",
        view_after_schedule: true,
        view_before_schedule: true,
        text: "",
        duration: 0,
        due_date: "",
        link: YouTubeLink || lessonContent,
        end_time: "",
        start_time: "",
      },

      active: true,
      enabled: true,
      points: form.getFieldValue("points"),
    };

    var placement = "bottomLeft";
    createLessonContent(NewData)
      .then(response => {
        messageApi.open({
          type: `success`,
          content: editSelectedYoutube
            ? "YouTube Video Updated Successfully"
            : "YouTube Video Created Successfully",
          duration: 2,
          key,
        });
        setTimeout(() => {
          form.resetFields();
          onClose();
        }, 1000);
      })
      .catch(error => {
        messageApi.open({
          type: `error`,
          content: editSelectedYoutube
            ? "Failed To Update"
            : "Failed To Create",
          duration: 2,
          key,
        });
      });
  }
}
