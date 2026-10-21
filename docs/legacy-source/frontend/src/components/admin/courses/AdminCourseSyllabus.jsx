import React from "react";
import dynamic from "next/dynamic";
const SyllabusDetail = dynamic(() => import("@/pages/Dashboard/course/syllabus/syllabusDetail"), { ssr: false });
import Image from "next/image";
import ContentDrawer from "@/components/Global/Offcanvas/Syallabus/AddLessonDrawer";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUserAction, quizAction, courseAction } from "@/redux/store";
import { notification, Empty, Select, Button } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Card, Col, Row } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

import { Carousel } from "antd";
import {
  getGenericCourseContent,
  getGenericCourseContentBySlug,
  getSpecificCourseContent,
  getClassesForCourseSyllabus,
} from "@/api/Services/adminServices/departmentService";
import { useRouter } from "next/router";

const contentStyle = {
  margin: 0,
  textAlign: "center",
  background: "#dcf3fe",
};

const VALUE_GENERIC = 0;

const AdminCourseSyllabus = () => {
  const [showLessonContent, setShowLessonContent] = useState(false);
  const [drawerOpen, setOpenDrawer] = useState(false);
  const [syllabus, setSyllabus] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(VALUE_GENERIC);
  const [classesForSyllabus, setClassesForSyllabus] = useState({});
  const loginUser = useSelector(state => state.loginUser);
  const [api, contextHolder] = notification.useNotification();
  const dispatch = useDispatch();
  const isTeacherRole = loginUser?.userType == "FACULTY" ? true : false;
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const quiz = useSelector(state => state.quiz);
  const [refresh, setRefresh] = useState(false);
  const SelectedCourse = useSelector(state => state.course.currAdminCourse);
  const router = useRouter();
  const isAdmin = loginUser?.facultyType === "ADMIN" || loginUser?.userType === "ADMIN";

  // BE-0183: a failed section lookup is said (with Retry); it is not the same as a college with no sections.
  const [classesLoadFailed, setClassesLoadFailed] = useState(false);
  const [classesRetry, setClassesRetry] = useState(0);
  useEffect(() => {
    if (!SelectedCourse?.id && !SelectedCourse?.slug) return undefined;
    let cancelled = false;
    const params = SelectedCourse?.slug
      ? { courseSlug: SelectedCourse.slug }
      : { courseId: SelectedCourse.id };
    setClassesLoadFailed(false);
    getClassesForCourseSyllabus(params)
      .then(data => {
        if (cancelled) return;
        const map = typeof data === "object" && data !== null ? data : {};
        setClassesForSyllabus(map);
      })
      .catch(() => {
        if (cancelled) return;
        setClassesForSyllabus({});
        setClassesLoadFailed(true);
      });
    return () => { cancelled = true; };
  }, [SelectedCourse?.id, SelectedCourse?.slug, classesRetry]);

  // BE-0182: another course starts on "all content"; the last course's section choice doesn't carry over.
  useEffect(() => {
    setSelectedClassId(VALUE_GENERIC);
  }, [SelectedCourse?.id, SelectedCourse?.slug]);

  // BE-0180/BE-0181: each lesson-list request is numbered (only the newest may fill the list), and a failed load clears the
  // list and says so instead of leaving the previous course's or section's lessons on screen to act on.
  const lessonListSeq = useRef(0);
  const [syllabusLoadFailed, setSyllabusLoadFailed] = useState(false);
  useEffect(() => {
    fetchLessonList();
  }, [refresh, SelectedCourse?.id, SelectedCourse?.slug, selectedClassId]);

  useEffect(() => {
    if (isAdmin && selectedClassId != null) {
      dispatch(courseAction.handleCourseData({ key: "adminSelectedClassIdForSyllabus", value: selectedClassId }));
    }
  }, [isAdmin, selectedClassId, dispatch]);

  const classOptions = [
    { value: VALUE_GENERIC, label: "All content in this course (every section)" },
    ...Object.entries(classesForSyllabus)
      .filter(([k]) => k !== "undefined" && Number(k) > 0)
      .map(([id, name]) => ({ value: Number(id), label: `${name || `Class ${id}`}: what its students see` })),
  ].sort((a, b) => (a.value === VALUE_GENERIC ? -1 : b.value === VALUE_GENERIC ? 1 : a.value - b.value));

  return (
    <div>
      {contextHolder}
      <ContentDrawer
        open={drawerOpen}
        close={onClose}
        adminCourseId={SelectedCourse?.id}
        adminCourseSlug={SelectedCourse?.slug}
        adminSelectedClassId={selectedClassId}
      />
      {!showLessonContent ? (
        <div className="scroll-container">
          <div className="mb-5 pb-3">
            <div className="ln-module">
              {isTeacherRole && (
                <>
                  {/* <div className="ln-course-head mb-3">
                    <Row className="ln-metrics-card-row" gutter={16}>
                      <Col span={6}>
                        <Card
                          hoverable
                          title={
                            <div className="d-flex justify-content-between align-items-center">
                              <span className=" ln-card-htitle">
                                Total Views
                              </span>
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
                          <div className="text-center">
                            <strong>5k+</strong>
                          </div>
                        </Card>
                      </Col>
                      <Col span={6}>
                        <Card
                          hoverable
                          title={
                            <div className="d-flex justify-content-between align-items-center">
                              <span className=" ln-card-htitle">Pdf Views</span>
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
                          <div className="d-flex justify-content-center">
                            <strong>5k+</strong>
                          </div>
                        </Card>
                      </Col>
                      <Col span={6}>
                        <Card
                          hoverable
                          title={
                            <div className="d-flex justify-content-between align-items-center">
                              <span className=" ln-card-htitle">
                                Video Views
                              </span>
                              <div className="ln-c-icon">
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
                          <div className="d-flex justify-content-center">
                            <strong>5k+</strong>
                          </div>
                        </Card>
                      </Col>
                      <Col span={6}>
                        <Card
                          hoverable
                          title={
                            <div className="d-flex justify-content-between align-items-center">
                              <span className=" ln-card-htitle">
                                Total Assignment
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
                          <div className="d-flex justify-content-center">
                            <strong>5k+</strong>
                          </div>
                        </Card>
                      </Col>
                    </Row>
                    <div className="ln-coursal-row ">
                      <Carousel className="ln-cors-card">
                        <div>
                          <Card
                            style={contentStyle}
                            hoverable
                            title={
                              <div className="d-flex justify-content-between align-items-center">
                                <span className=" ln-card-htitle">
                                  Students
                                </span>
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
              <div className="ln-module-card">
                <div className="pb-md-2 mb-4">
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
                <div className="ln-module-card__head  mb-4">
                  <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                    <div className="ln-card-subtitle d-flex align-items-center">
                      <span
                        style={{
                          width: "12px",
                          height: "19px",
                          background: "#FAE5A2",
                          marginRight: "12px",
                          marginTop: "3px",
                        }}
                      ></span>
                      <h6 className="fw-600 mb-0 fnt-16">Lessons</h6>
                    </div>
                    {syllabusLoadFailed && (
                      <span className="clrgray7AE fnt-13" data-testid="admin-syllabus-lessons-failed">
                        Lessons couldn&apos;t be loaded.{" "}
                        <Button type="link" size="small" style={{ padding: 0, height: "auto" }} onClick={() => fetchLessonList()}>Retry</Button>
                      </span>
                    )}
                    {isAdmin && classesLoadFailed && (
                      <span className="clrgray7AE fnt-13" data-testid="admin-syllabus-sections-failed">
                        Sections couldn&apos;t be loaded, so you&apos;re seeing shared content only.{" "}
                        <Button type="link" size="small" style={{ padding: 0, height: "auto" }} onClick={() => setClassesRetry((n) => n + 1)}>Retry</Button>
                      </span>
                    )}
                    {isAdmin && classOptions.length > 1 && (
                      <Select
                        value={selectedClassId}
                        onChange={v => {
                          setSelectedClassId(v);
                          setShowLessonContent(false);
                        }}
                        options={classOptions}
                        placeholder="Select class to view"
                        style={{ width: 220, maxWidth: "100%" }}
                      />
                    )}
                  </div>
                  {/* Content is often added for one section only, and the default "shared only" view
                      hides it: a lesson with 14 section items read "No lesson content yet", inviting an
                      admin to add it all again. */}
                  {isAdmin && classOptions.length > 1 && selectedClassId === VALUE_GENERIC ? (
                    <p className="clrgray7AE fnt-13" style={{ margin: "8px 0 0" }}>
                      Showing every section&apos;s content together. Pick a section above to see exactly what its students see.
                    </p>
                  ) : null}

                  {/* isTeacherRole alone missed a college-admin whose userType is literally
                      "ADMIN" rather than "FACULTY" + facultyType "ADMIN" — that second shape is
                      a real, distinct account type the backend checks for in several places
                      (e.g. AccessControlService, FacultyProfileController), even though every
                      account exercised in this codebase's own seed data uses the FACULTY shape.
                      Such an admin could see the class picker (gated on isAdmin) but not this
                      button, on the same tab. */}
                  {(isTeacherRole || isAdmin) && (
                    <div className="ln-syallabus-new">
                      <button onClick={() => setOpenDrawer(true)}>
                        <Image
                          src={"/assets/images/common/plus.svg"}
                          alt="" aria-hidden="true"
                          width={16}
                          height={16}
                        />
                        <span className="ms-2">Create New</span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="ln-module-card__body">
                  {syllabus.length == 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <div className="ln-syllabus-card row">
                      {Object.entries(syllabus).map(
                        ([key, syllabus], i = i + 1) => (
                          <div
                            className="ln-syllabus-card__item col-12 col-md-4"
                            key={i}
                            onClick={() => {
                              setSelectedLessonIndex(i);
                              Detail(
                                `${syllabus.lessonId}`,
                                `${syllabus.lessonContentID}`,
                                `${syllabus.lessonName}`
                              );
                            }}
                          >
                            <div className="ln-card-syllabus ln-card-hvr">
                              <div className="ln-card-syllabus__head">
                                {/* <span className="clrgray7AE fnt-13 fw-600">
                                  {syllabus.date}
                                </span> */}
                                {/* {isTeacherRole ? (
                                  <button className="ln-btn-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                  </button>
                                ) : (
                                  ""
                                )} */}
                              </div>

                              <div className="ln-card-syllabus__body">
                                <h5 className="fnt-26 fw-600 clrb517 mb-4 col-md-10 px-0 text-capitalize">
                                  {syllabus.title}
                                </h5>
                                {/* <div className="ln-syllabus-topics">
                                  <span>Video</span>
                                  <span>Quiz</span>
                                  <span>Feedback Survey</span>
                                  <span>Document</span>
                                </div> */}
                              </div>

                              <div className="ln-card-syllabus__footer d-flex flex-wrap">
                                <p className="clrgray7AE fw-600 fnt-13">
                                  Created on&nbsp;
                                </p>
                                <p className="clrgray7AE fw-600 fnt-13">
                                  {syllabus.date}
                                  {/* <span>&nbsp;{syllabus.StartTime}&nbsp;</span>
                                  to
                                  <span>&nbsp;{syllabus.EndTime}</span> */}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="ln-module__body">
          <div className="scroll-container scroll-container--courselanding">
            {" "}
            <div className="ln-syllabus-card row">
              <SyllabusDetail
                isAdmin
                contentMode="roadmap"
                adminSelectedClassId={selectedClassId}
                backToSyllabus={back}
                back={
                  selectedLessonIndex == 0
                    ? back
                    : () => setSelectedLessonIndex(prev => prev - 1)
                }
                next={() => setSelectedLessonIndex(prev => prev + 1)}
                currentLesson={syllabus[selectedLessonIndex]}
                cuurentLessonIndex={selectedLessonIndex}
                lastIndex={selectedLessonIndex === syllabus.length - 1}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function onClose() {
    setOpenDrawer(false);
    setRefresh(!refresh);
  }

  function back() {
    setShowLessonContent(false);
  }

  function Detail(id, lessContID, lessonname) {
    var Data = {
      LessonId: id,
      LessonContentID: lessContID,
      LessonName: lessonname,
    };

    dispatch(loginUserAction.handleUserData({ ...Data }));
    dispatch(quizAction?.setIndex(0));
    dispatch(quizAction?.setEdit(false));
    dispatch(quizAction?.handleQuizUpadte([]));
    dispatch(quizAction?.handleRefresh(!quiz?.refresh));

    setShowLessonContent(true);
  }

  function fetchLessonList() {
    const seq = ++lessonListSeq.current;
    if (!SelectedCourse?.id && !SelectedCourse?.slug) return;
    setSyllabusLoadFailed(false);
    const slug = SelectedCourse?.slug;
    const useClassSpecific = selectedClassId > 0;
    const params = slug
      ? { courseSlug: slug, ...(useClassSpecific && { classId: selectedClassId }) }
      : { courseId: SelectedCourse.id, ...(useClassSpecific && { classId: selectedClassId }) };
    const promise = useClassSpecific
      ? getSpecificCourseContent(params)
      : slug
        ? getGenericCourseContentBySlug(slug)
        : getGenericCourseContent({ courseId: SelectedCourse.id });
    promise
      .then(res => {
        if (seq !== lessonListSeq.current) return;
        const Lessons = res?.data?.data ?? res?.data ?? res;
        if (!Array.isArray(Lessons)) {
          setSyllabus([]);
          return;
        }
        const tempLessons = Lessons.map(i => {
          const lesson = i?.lesson ?? i;
          const contents = i?.lessonContents ?? i?.lesson_contents ?? [];
          const firstContentId = Array.isArray(contents) && contents[0] ? contents[0]?.id : null;
          const createdAt = lesson?.createdAt;
          const dateStr =
            Array.isArray(createdAt) && createdAt.length >= 3
              // "4/7/2026" read as April 7 to some and 4 July to others; spell the month.
              ? new Date(createdAt[0], (createdAt[1] || 1) - 1, createdAt[2]).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
              : "—";
          return {
            lessonName: lesson?.lessonName ?? lesson?.lesson_name,
            lessonId: lesson?.id,
            lessonContentID: firstContentId ?? i?.lesson_content_id,
            // SyllabusDetail reads `id` first as the LESSON id (to load and to add content). This used to
            // be the course id, so opening Unit 1 of Java (course 12) loaded lesson 12 of another course,
            // and "Add content" here wrote into that other lesson.
            id: lesson?.id,
            courseId: lesson?.courseId ?? lesson?.course_id,
            date: dateStr,
            title: lesson?.lessonName ?? lesson?.lesson_name ?? "Lesson",
            topics: { list: [{ video: true, quiz: true, feedback: true, document: true }] },
            StartTime: "2pm",
            EndTime: "3pm",
          };
        });
        setSyllabus(tempLessons);
      })
      .catch(() => {
        if (seq !== lessonListSeq.current) return;
        setSyllabus([]);
        setSyllabusLoadFailed(true);
        api.info({
          message: "Server Notification",
          description: "Internal Server Error",
          icon: <ExclamationCircleOutlined style={{ color: "red" }} />,
          placement: "bottomRight",
          duration: 0,
        });
      });
  }
};

export default AdminCourseSyllabus;
