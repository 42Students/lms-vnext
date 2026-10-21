import DrawerWidget from "@/components/Global/RightDrawer/DrawerWidget";
import { Drawer, message } from "antd";
import { Input, Form } from "antd";

const HomeEditDrawer = ({ close, open }) => {
  const { TextArea } = Input;
  const [form] = Form.useForm();

  const handleSave = () => {
    form.validateFields().then((values) => {
      message.info("Course info update is not yet implemented.");
      close();
    });
  };

  return (
    <>
      <DrawerWidget
        title="Course Information"
        closable={true}
        placement="right"
        customWidth={352}
        onClose={close}
        drawerOpen={open}
        primaryButtonTitle={"Cancel"}
        secondaryButtonTitle={"Save"}
        onClickPrimary={close}
        onClickSecondary={handleSave}
        showFooter
      >
        <div className="ln-drawer-body">
          <div className="ln-drawer-content h-100">
            <Form form={form} className="h-100 ln-ant-form">
              <div className="d-flex flex-column h-100">
                <div className="mb-4">
                  <label className="ln-lb2">Course title</label>
                  <Form.Item
                    name="Course_title"
                    rules={[
                      {
                        required: true,
                        message: "Enter Course name",
                        whitespace: true,
                      },
                    ]}
                  >
                    <Input placeholder="Course title" />
                  </Form.Item>
                </div>

                <div className="mb-4">
                  <label className="ln-lb2">Course info</label>
                  <Form.Item
                    name="Course_info"
                    rules={[
                      {
                        required: true,
                        message: "Enter Course info",
                        whitespace: false,
                      },
                    ]}
                  >
                    <TextArea
                      placeholder="Enter Course Info"
                      style={{
                        height: 200,
                      }}
                    />
                  </Form.Item>
                </div>
              </div>
            </Form>
          </div>
        </div>
      </DrawerWidget>
    </>
  );
};
export default HomeEditDrawer;
