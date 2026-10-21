import { Card, Row, Col, Button, Dropdown, Image, Popconfirm } from "antd";
import Link from "next/link";
import { useRouter } from "next/router";

const dropdownPositionStyle = {
  right: "10px",
  top: "10px",
};

export default function CoursesGrid({ onAction, courses = [] }) {
  const { pathname } = useRouter();

  function onCardAction(e, course) {
    e.domEvent?.preventDefault?.();
    if (e.key === "delete") return; // handled by Popconfirm
    onAction(course, e.key);
  }

  return (
    <Row gutter={[16, 16]} wrap={true} className="mt-3">
      {courses.map(course => {
        const courseIdentifier = course.slug || course.key;
        const menuItems = [
          {
            key: "edit",
            label: "Edit Course",
            icon: <i className="bi bi-pencil" aria-hidden="true" />,
          },
          {
            key: "assign",
            label: "Assign Teacher",
            icon: <i className="bi bi-person-plus" aria-hidden="true" />,
          },
          {
            key: "delete",
            label: (
              <Popconfirm
                title="Delete this course?"
                description="This action cannot be undone."
                onConfirm={(e) => { e?.stopPropagation?.(); onAction(course, "delete"); }}
                onCancel={(e) => e?.stopPropagation?.()}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true, size: "large" }}
                cancelButtonProps={{ size: "large" }}
                placement="left"
              >
                <span
                  style={{ color: "#cf1322", display: "block", width: "100%" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Delete Course
                </span>
              </Popconfirm>
            ),
            icon: <i className="bi bi-trash" aria-hidden="true" style={{ color: "#cf1322" }} />,
            danger: true,
          },
        ];

        return (
          <Col
            key={course.key}
            sm={{ span: 12 }}
            md={{ span: 12 }}
            lg={{ span: 8 }}
          >
            <Link href={`${pathname}/${courseIdentifier}`}>
              <div className="position-relative">
                <div className="position-absolute" style={dropdownPositionStyle}>
                  <Dropdown
                    arrow
                    className="bg-white"
                    menu={{
                      items: menuItems,
                      onClick: e => onCardAction(e, course),
                    }}
                    trigger={["click"]}
                    placement="bottomRight"
                  >
                    <Button
                      className="border-0 bg-transparent clrgray7AE shadow-none outline-none"
                      icon={<i className="bi bi-three-dots" aria-hidden="true" />}
                      aria-label={`Actions for ${course.title}`}
                      onClick={(e) => e.preventDefault()}
                    />
                  </Dropdown>
                </div>
                <Card
                  className="p-3"
                  bordered={false}
                  styles={{ body: { paddingLeft: 0, paddingRight: 0, paddingBottom: 0 } }}
                  cover={
                    <Image
                      alt={`Cover image for ${course.title}`}
                      preview={false}
                      src={course.image}
                    />
                  }
                >
                  <Card.Meta
                    title={
                      <div className="ln-lto-bold clrb517 text-truncate" title={course.title}>
                        {course.title || ""}
                      </div>
                    }
                    description={
                      <div className="ln-lto-reg clrFour text-truncate" title={course.description}>
                        {course.description || ""}
                      </div>
                    }
                    className="mb-3"
                  />
                  <div className="ln-lto-reg clrgray7AE">
                    <i className="bi bi-calendar pe-2" aria-hidden="true" />
                    Added on{" "}
                    {Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    }).format(new Date(course.addedOn))}
                  </div>
                </Card>
              </div>
            </Link>
          </Col>
        );
      })}
    </Row>
  );
}
