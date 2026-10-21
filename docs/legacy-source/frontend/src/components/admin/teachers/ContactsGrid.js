import { data } from "@data/admin/teachers";
import { Table, Dropdown, Button } from "antd";

// TODO: Replace mock data with API data

const menuItems = [
  // {
  //   key: "view",
  //   label: <div>View</div>,
  //   title: "View",
  // },
  {
    key: "edit",
    label: <div>Edit</div>,
    title: "Edit",
  },
  {
    key: "delete",
    label: <div>Delete</div>,
    title: "Delete",
  },
  {
    key: "createAnnouncement",
    label: <div>Contact Faculty</div>,
    title: "Create Announcement",
  },
];

const ContactsGrid = ({ onSelection, facultyList, children }) => {
  const columns = [
    {
      title: "First Name",
      dataIndex: "firstName",
      key: "firstName",
    },
    {
      title: "Last Name",
      dataIndex: "lastName",
      key: "lastName",
    },
    {
      title: "Birth Date",
      dataIndex: "birthDate",
      key: "birthDate",
    },
    {
      title: "Phone",
      dataIndex: "contactMobile",
      key: "mobile",
    },
    {
      title: "Mail",
      dataIndex: "contactMail",
      key: "mail",
    },
    {
      title: "Actions",
      key: "action",
      dataIndex: "action",
      width: 80,
      render: (_, row) => {
        function onClick(item) {
          onSelection(row, item.key);
        }
        return (
          <Dropdown menu={{ items: menuItems, onClick }} trigger={["click"]}>
            <Button
              className="border-0 bg-transparent"
              aria-label="Open actions menu"
              icon={<i className="bi bi-three-dots"></i>}
            ></Button>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className="ln-module__body">
      <div className="scroll-container scroll-container--courselanding mb-3">
        {/* <div className="pb-md-2 d-flex">
          <button
            className="ln-btn-normal d-flex align-items-center"
            onClick={() => router.push("/college-admin/departments")}
          >
            <ArrowLeftOutlined
              style={{
                fontSize: "16px",
                color: "rgba(0, 0, 0, 0.88)",
              }}
            />
            <span className="fnt-13 d-inline-block fw-600 ms-3 black">
              &nbsp;Back
            </span>
          </button>
        </div> */}
        <div className="ln-exams ln-module-card mb-3">
          <div className="ln-module-card__head  mb-3">
            <div className="ln-card-subtitle">
              <span
                style={{
                  width: "12px",
                  height: "19px",
                  background: "rgb(237 183 159)",
                  marginRight: "12px",
                }}
              ></span>
              <h6 className="fw-600 mb-0 fnt-16">All Faculty</h6>
            </div>
            {/* {children} */}
          </div>
          <Table
            className="ln-table"
            dataSource={facultyList}
            columns={columns}
            pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Total ${total} teachers` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ContactsGrid;
