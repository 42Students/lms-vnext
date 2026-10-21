import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import InThisCourseSection from "@/components/Course/Home/InThisCourseSection";
import CourseTeachersPanel from "@/components/admin/courses/CourseTeachersPanel";
const HomeEditor = dynamic(() => import("@/pages/Dashboard/course/Home/HomeEditDrawer"), { ssr: false });

const contentStyle = {
  margin: 0,
  textAlign: "center",
  background: "#dcf3fe",
};

const AdminCourseHome = ({ goback }) => {
  const [open, setOpen] = useState(false);
  const loginUser = useSelector(state => state.loginUser);
  const isTeacherRole = loginUser?.userType == "FACULTY" ? true : false;
  const router = useRouter();
  const course = useSelector(state => state.course.currAdminCourse);
  return (
    <div className="ln-module__body">
      <div className="scroll-container scroll-container--courselanding">
        <div className="ln-module-card mb-3">
          <div className="pb-md-2 d-flex justify-content-end">
            <button
              className="ln-btn-normal d-flex align-items-center"
              onClick={() => router.push("/college-admin/courses")}
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
          </div>
          <div className="ln-card-detail__body">
            {isTeacherRole && (
              <>
                {/* <div className="ln-course-head mb-4 mt-0">
                  <Row className="ln-metrics-card-row" gutter={16}>
                    <Col span={6}>
                      <Card
                        hoverable
                        title={
                          <div className="d-flex justify-content-between align-items-center">
                            <span className=" ln-card-htitle">Students</span>
                            <div className="ln-c-icon">
                              <Image
                                src={"/assets/images/course/user.svg"}
                                alt="" aria-hidden="true"
                                width={14}
                                height={14}
                              />
                            </div>
                          </div>
                        }
                        bordered={false}
                      >
                        <div
                          className="text-center"
                          style={{ color: "#447ca0" }}
                        >
                          <strong>500</strong>
                        </div>
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card
                        hoverable
                        title={
                          <div className="d-flex justify-content-between align-items-center">
                            <span className=" ln-card-htitle">Views</span>
                            <div className="ln-c-icon">
                              <Image
                                src={
                                  "/assets/images/course/views-icon-orange.svg"
                                }
                                alt="" aria-hidden="true"
                                width={14}
                                height={14}
                              />
                            </div>
                          </div>
                        }
                        bordered={false}
                      >
                        <div
                          className="d-flex justify-content-center "
                          style={{ color: "#fa8653" }}
                        >
                          <strong>5k+ Views</strong>
                        </div>
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card
                        hoverable
                        title={
                          <div className="d-flex justify-content-between align-items-center">
                            <span className=" ln-card-htitle">
                              Assignment Grade
                            </span>
                            <div className="ln-c-icon ms-1">
                              <Image
                                src={
                                  "/assets/images/course/assignment-yellow-icon.svg"
                                }
                                alt="" aria-hidden="true"
                                width={14}
                                height={14}
                              />
                            </div>
                          </div>
                        }
                        bordered={false}
                      >
                        <div
                          className="d-flex justify-content-center"
                          style={{ color: "#eda940" }}
                        >
                          <strong>8/10</strong>
                        </div>
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card
                        hoverable
                        title={
                          <div className="d-flex justify-content-between align-items-center">
                            <span className=" ln-card-htitle">Quiz Grade</span>
                            <div className="ln-c-icon">
                              <Image
                                src={
                                  "/assets/images/course/quiz-purple-icon.svg"
                                }
                                alt="" aria-hidden="true"
                                width={14}
                                height={14}
                              />
                            </div>
                          </div>
                        }
                        bordered={false}
                      >
                        <div
                          className="d-flex justify-content-center"
                          style={{ color: "#cc86ff" }}
                        >
                          <strong>8/10</strong>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                  <div className="ln-coursal-row">
                    <Carousel className="ln-cors-card">
                      <div>
                        <Card
                          style={contentStyle}
                          hoverable
                          title={
                            <div className="d-flex justify-content-between align-items-center">
                              <span className=" ln-card-htitle">Students</span>
                              <div className="ln-c-icon">
                                <Image
                                  src={"/assets/images/course/user.svg"}
                                  alt="" aria-hidden="true"
                                  width={14}
                                  height={14}
                                />
                              </div>
                            </div>
                          }
                          bordered={false}
                        >
                          <div
                            className="text-center"
                            style={{ color: "#447ca0" }}
                          >
                            <strong>500</strong>
                          </div>
                        </Card>
                      </div>
                      <div>
                        <Card
                          style={contentStyle}
                          hoverable
                          title={
                            <div className="d-flex justify-content-between align-items-center">
                              <span className=" ln-card-htitle">Views</span>
                              <div className="ln-c-icon">
                                <Image
                                  src={
                                    "/assets/images/course/views-icon-orange.svg"
                                  }
                                  alt="" aria-hidden="true"
                                  width={14}
                                  height={14}
                                />
                              </div>
                            </div>
                          }
                          bordered={false}
                        >
                          <div
                            className="d-flex justify-content-center "
                            style={{ color: "#fa8653" }}
                          >
                            <strong>5k+ Views</strong>
                          </div>
                        </Card>
                      </div>
                      <div>
                        <Card
                          style={contentStyle}
                          hoverable
                          title={
                            <div className="d-flex justify-content-between align-items-center">
                              <span className=" ln-card-htitle">
                                Assignment Grade
                              </span>
                              <div className="ln-c-icon ms-1">
                                <Image
                                  src={
                                    "/assets/images/course/assignment-yellow-icon.svg"
                                  }
                                  alt="" aria-hidden="true"
                                  width={14}
                                  height={14}
                                />
                              </div>
                            </div>
                          }
                          bordered={false}
                        >
                          <div
                            className="d-flex justify-content-center"
                            style={{ color: "#eda940" }}
                          >
                            <strong>8/10</strong>
                          </div>
                        </Card>
                      </div>
                      <div>
                        <Card
                          style={contentStyle}
                          hoverable
                          title={
                            <div className="d-flex justify-content-between align-items-center">
                              <span className=" ln-card-htitle">
                                Quiz Grade
                              </span>
                              <div className="ln-c-icon">
                                <Image
                                  src={
                                    "/assets/images/course/quiz-purple-icon.svg"
                                  }
                                  alt="" aria-hidden="true"
                                  width={14}
                                  height={14}
                                />
                              </div>
                            </div>
                          }
                          bordered={false}
                        >
                          <div
                            className="d-flex justify-content-center"
                            style={{ color: "#cc86ff" }}
                          >
                            <strong>8/10</strong>
                          </div>
                        </Card>
                      </div>
                    </Carousel>
                  </div>
                </div> */}
              </>
            )}

            <div className="ln-card-subtitle" style={{ marginBottom: "24px" }}>
              <span
                style={{
                  width: "12px",
                  height: "19px",
                  background: "#F3ECF8",
                  margin: "0 12px 0 0",
                }}
              ></span>
              <h6 className="fw-600 fnt-16 mb-0">In this Course</h6>
              {/* {isTeacherRole ? (
                <button
                  className="ln-edit-btn ms-2"
                  onClick={() => setOpen(true)}
                >
                  Edit
                </button>
              ) : (
                ""
              )} */}
            </div>

            {/* The same section students see, so the preview matches it: the description used to be
                printed as raw text here, showing "<p>...</p>" tags, and takeaways were missing. */}
            <InThisCourseSection
              introductionContent={course?.meta_data?.introduction_content ?? course?.metaData?.introduction_content}
              htmlContent={course?.meta_data?.html_content ?? course?.metaData?.html_content}
              takeaways={course?.meta_data?.takeaways ?? course?.metaData?.takeaways}
            />
            <CourseTeachersPanel courseId={course?.id} />
          </div>
        </div>
      </div>
      <HomeEditor open={open} close={() => setOpen(false)} />
    </div>
  );
};

export default AdminCourseHome;
