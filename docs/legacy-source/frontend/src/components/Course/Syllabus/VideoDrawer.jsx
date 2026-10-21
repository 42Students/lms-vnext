import { Button, DatePicker, Select, message, notification } from "antd";
import Editor from "@/components/Global/Editor/editor";
import { useEffect, useState } from "react";
import { Input, Upload, Form } from "antd";
import { useSelector } from "react-redux";
import { UploadOutlined } from "@ant-design/icons";
import { createLessonContent } from "@/api/Services/courseServices";
import { updateLessonContent } from "@/api/Services/AdminService";
import { uploadFileViaPresign } from "@/utils/uploadToR2";
import DrawerWidget from "@/components/Global/RightDrawer/DrawerWidget";
import { getFileSizeValidator } from "@/utils/helper";

const validContentTypes = ["video/*"];

export default function VideoDrawer({
  open,
  onClose,
  editSelectedVideo = null,
}) {
  const loginUser = useSelector(state => state.loginUser);
  const isTeacherRole = loginUser?.userType === "FACULTY" ? true : false;
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [lessonContent, setLessonContent] = useState(null);

  const key = "updatable";

  useEffect(() => {
    getAssignmentAutofill();
  }, [editSelectedVideo]);

  return (
    <>
      <DrawerWidget
        title={editSelectedVideo ? "Update Video" : "Upload New Video"}
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
              in
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
                    label={<label className="ln-lb2">Video Title</label>}
                    name="contentTitle"
                    rules={[
                      {
                        required: true,
                        message: "Enter Video Title",
                        whitespace: true,
                      },
                    ]}
                  >
                    <Input placeholder="Enter Video Title" className="ln-in2" />
                  </Form.Item>
                </div>

                <div className="row">
                  <Form.Item
                    label={<label className="ln-lb2">Points</label>}
                    name="points"
                    // rules={[
                    //   {
                    //     required: true,
                    //     message: "Enter key point",
                    //     whitespace: true,
                    //   },
                    // ]}
                  >
                    <Input
                      type="number"
                      placeholder="Enter Points"
                      className="ln-in2"
                    />
                  </Form.Item>
                </div>

                <div className="row">
                  <Form.Item
                    label={<label className="ln-lb2">Video</label>}
                    name="video"
                    rules={[
                      {
                        required: true,
                        message: "Upload Video",
                        // Neither the Upload widget's onChange nor a
                        // re-upload ever calls form.setFieldsValue({ video: ... }) on edit — they
                        // only update the `lessonContent` state that ContentSubmit actually sends.
                        // A plain `required`/`type: "object"` check on this field's own (never-set)
                        // value always failed on edit, blocking every title-only save that didn't
                        // re-upload a new file. Validate against the real source of truth instead.
                        validator: async () => {
                          if (!lessonContent) throw new Error("Upload Video");
                        },
                      },
                      () => ({
                        validator: getFileSizeValidator(200),
                      }),
                    ]}
                  >
                    <Upload
                      customRequest={({ file, onSuccess }) => {
                        setTimeout(() => onSuccess("ok"), 0);
                      }}
                      onChange={onFileChange}
                      maxCount={1}
                      accept={validContentTypes.join(",")}
                      beforeUpload={beforeUpload}
                    >
                      <Button
                        className="w-100 ant-custom-upload"
                        icon={<UploadOutlined />}
                      >
                        Choose File
                      </Button>
                    </Upload>
                  </Form.Item>
                </div>
              </div>
            </Form>
          </div>
        </div>
      </DrawerWidget>
    </>
  );

  function getAssignmentAutofill() {
    if (isTeacherRole && editSelectedVideo) {
      form.setFieldsValue({
        ...editSelectedVideo,
        contentTitle: editSelectedVideo?.contentTitle,
        points: editSelectedVideo?.points,
      });
      const stored = editSelectedVideo?.contentDataDTO?.file_dto?.cloud_storage_object;
      setLessonContent(stored ?? null);
    }
  }

  function ContentSubmit() {
    const fileDto =
      lessonContent != null && lessonContent !== ""
        ? {
            size: 0,
            encoding: "",
            mimetype: "",
            field_name: "",
            original_name: "",
            cloud_storage_object: lessonContent,
          }
        : null;
    const contentDataDto = {
      html_content: lessonContent ?? "",
      allow_discussions: "",
      view_after_schedule: true,
      view_before_schedule: true,
      text: "",
      duration: 0,
      due_date: "",
      link: "",
      end_time: "",
      start_time: "",
    };
    if (fileDto) contentDataDto.file_dto = fileDto;

    let NewData = {
      lesson_content_id: editSelectedVideo?.id ? editSelectedVideo?.id : 0,
      faculty_id: loginUser?.id,
      sequence: 0,
      class_id: editSelectedVideo?.classId,
      lesson_id: editSelectedVideo?.lessonId,
      content_type: "VIDEO",
      content_title: form.getFieldValue("contentTitle"),
      content_data_dto: contentDataDto,

      active: true,
      enabled: true,
      points: form.getFieldValue("points"),
    };

    var placement = "bottomLeft";
    // Editing must PUT to /update/{id}: create's validation only accepts a freshly presigned
    // file key, and the existing video's already-stored URL (sent back unchanged when only the
    // title/points changed) always failed it with "Video/file key must be from allowed storage".
    const request = editSelectedVideo?.id
      ? updateLessonContent(editSelectedVideo.id, NewData)
      : createLessonContent(NewData);
    request
      .then(response => {
        messageApi.open({
          type: `success`,
          content: editSelectedVideo
            ? "Video Updated Successfully"
            : "Video Created Successfully",
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
          content: editSelectedVideo ? "Failed To Update" : "Failed To Create",
          duration: 2,
          key,
        });
      });
  }

  function onFileChange(info) {
    switch (info.file.status) {
      case "uploading":
        break;
      case "done":
        const file = info.file.originFileObj;
        uploadFileViaPresign(file, {
          folder: "lesson-content",
          type: "video",
          courseId:
            editSelectedVideo?.courseId ??
            editSelectedVideo?.course_id ??
            loginUser?.courseId ??
            loginUser?.course_id ??
            undefined,
          classId: editSelectedVideo?.classId ?? editSelectedVideo?.class_id ?? undefined,
        })
          // Video now stores a plain public URL, same as every other upload type (PDF, image,
          // etc.) — there is no signing/playback-url step left to resolve a bare key against.
          .then(result => setLessonContent(result.publicUrl))
          .catch(() => {
            messageApi.open({
              key,
              type: "error",
              content: "Server error. Please try uploading again. (Max file size: 200MB)",
              duration: 2,
            });
            setLessonContent("");
          });

        break;

      default:
    }
  }

  function beforeUpload(file) {
    const isValidFileType = file.type.startsWith("video/");
    if (!isValidFileType) {
      message.error(`${file.name} is not a video file`);
    }
    return isValidFileType || Upload.LIST_IGNORE;
  }
}
