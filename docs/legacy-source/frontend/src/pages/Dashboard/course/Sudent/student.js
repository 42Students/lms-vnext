import React, { useEffect, useMemo, useState } from "react";
import { useRouter as useClassRouter } from "next/router";
import { canonicalClassHref } from "@/utils/facultyCourseDetail";
import { Alert, Button, Empty, Grid, Input, Modal, Select, Skeleton, Table, notification } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { loginUserAction } from "@/redux/store";
import {
  IdcardOutlined,
  ReloadOutlined,
  MailOutlined,
  PhoneOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import Api from "@/api/ApiMethod";

function getInitials(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

// Deterministic tint per learner. This previously took no parameter at all while being called
// with (index), so every avatar in every class rendered the same #e2e8f0 grey — no identity
// signal whatsoever in a 60-person roster where initials collide constantly.
const AVATAR_TINTS = [
  { bg: "#e0f2f1", fg: "#0f766e" },
  { bg: "#ede9fe", fg: "#5b21b6" },
  { bg: "#fef3c7", fg: "#92400e" },
  { bg: "#e0e7ff", fg: "#3730a3" },
  { bg: "#fce7f3", fg: "#9d174d" },
  { bg: "#dcfce7", fg: "#166534" },
  { bg: "#ffe4e6", fg: "#9f1239" },
  { bg: "#e0f2fe", fg: "#075985" },
];

function getAvatarTint(seedValue) {
  const numeric = Number(seedValue);
  const seed = Number.isFinite(numeric)
    ? numeric
    : String(seedValue ?? "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_TINTS[Math.abs(seed) % AVATAR_TINTS.length];
}

/** Digits only, for a tel: href. */
function toTelHref(value) {
  const digits = String(value ?? "").replace(/[^\d+]/g, "");
  return digits.length >= 6 ? `tel:${digits}` : null;
}

/** Group an Indian 10-digit mobile as 98765 43210 — grouped digits read ~2x faster. */
function formatMobile(value) {
  const raw = String(value ?? "").trim();
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return raw;
}

function buildStudentRow(student, index) {
  const name = [student?.first_name, student?.last_name].filter(Boolean).join(" ") || "—";
  const rollNo = student?.roll_number ?? null;
  const contactNo = student?.contact_mobile ?? null;
  // The learner API (LearnerResponseDTO) exposes no image field at all, so the previous seven-way
  // ?? chain always resolved to `website` — a personal/portfolio URL, not an image. Every row
  // therefore fired a request at an arbitrary third-party origin (leaking the faculty's IP and
  // Referer), failed, and fell back to initials after a visible flash. Only accept a value that
  // actually looks like an image.
  const candidate =
    student?.profile_image_url ??
    student?.profileImageUrl ??
    student?.image_url ??
    student?.imageUrl ??
    student?.photo_url ??
    student?.photoUrl ??
    null;
  const imageUrl = /\.(png|jpe?g|webp|avif|gif)(\?|$)/i.test(String(candidate ?? "")) ? candidate : null;
  const email = student?.contact_mail ?? student?.contactMail ?? null;
  const learnerId = student?.id ?? student?.learner_id ?? null;

  return {
    key: learnerId ?? `student-${index}`,
    learnerId,
    contactMobile: contactNo,
    email,
    name,
    rollNo,
    imageUrl,
    avatarTint: getAvatarTint(learnerId ?? name),
    searchText: [name, rollNo, contactNo, email].filter(Boolean).join(" ").toLowerCase(),
  };
}

function StudentAvatar({ student, size = "sm", imageFailed, onImageError, onPreview }) {
  const showImage = student?.imageUrl && !imageFailed;

  return (
    <button
      type="button"
      className={`learn-course-students__avatar learn-course-students__avatar--${size}`}
      style={{ background: student.avatarTint?.bg, color: student.avatarTint?.fg }}
      onClick={() => onPreview(student)}
      aria-label={`View ${student.name} profile photo`}
    >
      {showImage ? (
        <img src={student.imageUrl} alt="" onError={() => onImageError(student.key)} />
      ) : (
        <span>{getInitials(student.name)}</span>
      )}
    </button>
  );
}

const columns = ({ isTeacherRole, failedImages, onImageError, onPreview }) => {
  const cols = [
    {
      title: "Student",
      key: "name",
      render: (_, record) => (
        <span className="learn-course-students__identity">
          <StudentAvatar
            student={record}
            imageFailed={failedImages[record.key]}
            onImageError={onImageError}
            onPreview={onPreview}
          />
          <span className="learn-course-students__identity-text">
            <strong>{record.name}</strong>
            <small>{record.rollNo ? `Roll ${record.rollNo}` : "Roll not assigned"}</small>
          </span>
        </span>
      ),
      width: 260,
    },
    {
      // Was a raw inert string in a column mislabelled `RegistrationNo` while holding a mobile
      // number. The whole reason a teacher opens this tab is to reach a learner, so make it
      // actionable — and surface email, which the API already returns and the UI discarded.
      title: "Phone",
      dataIndex: "contactMobile",
      key: "contactMobile",
      render: (_, record) => {
        const tel = toTelHref(record.contactMobile);
        return tel ? (
          <a className="learn-course-students__contact-link" href={tel} aria-label={`Call ${record.name}`}>
            <PhoneOutlined aria-hidden="true" /> {formatMobile(record.contactMobile)}
          </a>
        ) : (
          <span className="learn-course-students__contact-empty">No number</span>
        );
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (_, record) =>
        record.email ? (
          <a className="learn-course-students__contact-link" href={`mailto:${record.email}`} aria-label={`Email ${record.name}`}>
            <MailOutlined aria-hidden="true" /> {record.email}
          </a>
        ) : (
          <span className="learn-course-students__contact-empty">No email</span>
        ),
    },
  ];
  // Only the identity column carries a fixed width — Phone/Email are left unconstrained so the
  // table actually spreads across the full width of its (already full-width) card instead of
  // being two fixed-pixel columns floating in a sea of blank space on wide screens.
  cols[0].width = 260;
  // The identity cell already carries the roll number, so a separate "Roll No" column repeated
  // the same datum in a worse register ("—" vs "Roll not assigned"). Sorting by roll is the
  // single most-used retrieval path in an Indian college roster, so it lives on the identity col.
  cols[0].sorter = (a, b) =>
    String(a.rollNo ?? "").localeCompare(String(b.rollNo ?? ""), undefined, { numeric: true }) ||
    String(a.name ?? "").localeCompare(String(b.name ?? ""));
  cols[0].defaultSortOrder = "ascend";
  cols[0].sortDirections = ["ascend", "descend"];
  // Both contact columns (previously one combined "Contact" column) are faculty-only — a
  // learner has no business seeing classmates' phone numbers or emails.
  if (!isTeacherRole) cols.splice(1, 2);
  return cols;
};

const Student = () => {
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);
  // A faculty member can teach more than one class/section of the same course (see
  // AttendanceReport.js's identical switcher) — without this, the roster silently showed
  // whichever class happened to be in Redux (e.g. last picked in Attendance) while the copy and
  // headcount claimed to represent the whole course.
  const courseClassAssignments = useSelector((state) => state.course.courseClassAssignments) ?? [];
  const [api, contextHolder] = notification.useNotification();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  // Both the desktop table and the mobile card list used to be mounted at all times and toggled
  // with display:none, so a 60-student class rendered 120 rows and 120 avatar buttons — and
  // re-rendered all of them on every keystroke in the search box.
  const screens = Grid.useBreakpoint();
  const isNarrow = screens.xs === true || (screens.sm === true && screens.md !== true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [failedImages, setFailedImages] = useState({});
  const isTeacherRole = loginUser?.userType === "FACULTY";

  const classRouter = useClassRouter();
  const handleClassSwitch = (value) => {
    const selected = courseClassAssignments.find((c) => c.classId === value);
    if (selected) {
      dispatch(loginUserAction.handleUserData({
        classId: selected.classId,
        className: selected.className,
      }));
      // BE-0024: the address names the section too (the course page reads ?cls= first), so the choice sticks.
      if (classRouter?.asPath) classRouter.replace(canonicalClassHref(classRouter.asPath, selected.classId), undefined, { shallow: true });
    }
  };

  const selectedClassName = useMemo(
    () => courseClassAssignments.find((c) => c.classId === loginUser?.classId)?.className,
    [courseClassAssignments, loginUser?.classId],
  );

  const handleImageError = (studentKey) => {
    setFailedImages((prev) => ({ ...prev, [studentKey]: true }));
  };

  useEffect(() => {
    if (!loginUser?.classId) {
      setStudents([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Api.get("/api/v1/learner/getLearnerDetailsByClassId", {
      params: { classId: loginUser.classId },
    })
      .then((res) => {
        if (cancelled) return;
        const list = (res?.data?.data ?? []).map(buildStudentRow);
        setStudents(list);
      })
      .catch(() => {
        if (cancelled) return;
        setStudents([]);
        // Used to also fire a separate toast with a third, different message on top of this —
        // one failure, three simultaneous notifications. The Alert below (with its own Retry
        // button) is sufficient on its own; dropped the redundant toast.
        setError("We couldn't load the class roster. Check your connection and try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [api, loginUser?.classId, retryKey]);

  // Roll number, ascending — same ordering the desktop table applies via its column sorter.
  // The mobile card list rendered raw API order instead, so the same roster looked sorted on
  // desktop and shuffled on a phone.
  const sortByRoll = (a, b) =>
    String(a.rollNo ?? "").localeCompare(String(b.rollNo ?? ""), undefined, { numeric: true }) ||
    String(a.name ?? "").localeCompare(String(b.name ?? ""));

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const base = normalizedSearch
      ? students.filter((student) => student.searchText.includes(normalizedSearch))
      : students;
    return [...base].sort(sortByRoll);
  }, [searchTerm, students]);

  const missingRollCount = useMemo(
    () => students.filter((student) => !student.rollNo).length,
    [students],
  );

  const contactCount = useMemo(
    () => students.filter((student) => Boolean(student.contactMobile)).length,
    [students],
  );

  const renderEmptyState = () => {
    const hasSearch = searchTerm.trim().length > 0;
    return (
      <div className="learn-course-students__empty">
        <UserOutlined className="learn-course-students__empty-icon" />
        <p>{hasSearch ? "No matching students" : "No students yet"}</p>
        <span>
          {hasSearch
            ? "Try searching by name, roll number, or contact number."
            : "Students will appear here once they are enrolled in this class."}
        </span>
      </div>
    );
  };

  return (
    // PageShell (src/components/Common/PageShell.jsx) already wraps every course tab in its own
    // `ln-module-card` — this page used to render a second one around itself, producing a
    // visibly nested card (border/radius/shadow doubled) that no other course tab has. Matches
    // the `learn-projects-detail` pattern already used by Home/Syllabus/Classroom/Attendance:
    // a screen-reader-only heading (the pill tab above already says "Students") plus a visible
    // subtitle, no card of its own.
    <div className="learn-projects-detail learn-course-students">
      {contextHolder}
      <div className="learn-projects-detail__page-head">
        <div>
          <h3 className="learn-projects-detail__page-head-title--sr-only">Students</h3>
        </div>
      </div>
      <div className="learn-projects-detail__body">
      <section className="learn-projects-detail__content">
        <div className="learn-course-students-hero" aria-label="Students overview">
          <div className="learn-course-students-hero__copy">
            <span className="learn-course-students-hero__eyebrow">Class list</span>
            <h2>Students</h2>
            <p>
              {selectedClassName
                ? `Students enrolled in ${selectedClassName}.`
                : "Students enrolled in this class."}
            </p>
          </div>
          <div className="learn-course-students-summary" aria-label="Roster summary">
            <span className="learn-course-students-metric learn-course-students-metric--teal">
              <TeamOutlined /> {students.length} {students.length === 1 ? "student" : "students"}
            </span>
            <span className={`learn-course-students-metric${missingRollCount > 0 ? " learn-course-students-metric--amber" : ""}`}>
              <IdcardOutlined /> {missingRollCount > 0 ? `${missingRollCount} without a roll number` : "All have roll numbers"}
            </span>
            {isTeacherRole && (
              <span className="learn-course-students-metric learn-course-students-metric--blue">
                <PhoneOutlined /> {contactCount} contacts
              </span>
            )}
          </div>
        </div>

        <div className="learn-course-students-toolbar">
          {courseClassAssignments.length > 1 && (
            <Select
              value={loginUser?.classId}
              onChange={handleClassSwitch}
              options={courseClassAssignments.map((c) => ({
                value: c.classId,
                label: c.className,
              }))}
              className="learn-course-students-class-select"
              style={{ width: "min(160px, 100%)" }}
              placeholder="Select Class"
              aria-label="Select class to view its roster"
            />
          )}
          <Input
            allowClear
            className="learn-course-students-search"
            placeholder="Search by name, roll no, phone or email"
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search students"
          />
          {searchTerm.trim() && (
            // The headcount chip above shows the unfiltered total and never moves while filtering,
            // which actively misleads. State the filtered result explicitly.
            <span className="learn-course-students-toolbar__count" aria-live="polite">
              Showing {filteredStudents.length} of {students.length}
            </span>
          )}
        </div>

        {/* A failed request used to ALSO render "No students yet — students will appear here once
            they are enrolled", a false claim about the user's data, alongside this alert and a
            toast: three simultaneous notifications for one event. Error now short-circuits. */}
        {loading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : error ? (
          <Alert
            className="learn-course-students__error"
            message={error}
            type="error"
            showIcon
            action={
              <Button size="small" icon={<ReloadOutlined />} onClick={() => setRetryKey((k) => k + 1)}>
                Retry
              </Button>
            }
          />
        ) : !loginUser?.classId ? (
          <div className="learn-course-students__empty">
            <UserOutlined className="learn-course-students__empty-icon" />
            <p>No class selected</p>
            <span>This course is not linked to one of your classes yet.</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {!isNarrow && (
            <div className="learn-course-students-desktop">
              <div className="learn-course-students-table-wrap">
                <Table
                  columns={columns({
                    isTeacherRole,
                    failedImages,
                    onImageError: handleImageError,
                    onPreview: setSelectedStudent,
                  })}
                  dataSource={filteredStudents}
                  pagination={{ pageSize: 25, hideOnSinglePage: true, showSizeChanger: false }}
                  className="ln-table"
                  size="middle"
                  locale={{ emptyText: <Empty description="No students found" /> }}
                />
              </div>
            </div>
            )}
            {isNarrow && (
            <div className="learn-course-students-mobile">
              <div className="learn-course-students-cards">
                {filteredStudents.map((student) => (
                  <div
                    key={student.key}
                    className="learn-course-students-card"
                  >
                    <StudentAvatar
                      student={student}
                      size="md"
                      imageFailed={failedImages[student.key]}
                      onImageError={handleImageError}
                      onPreview={setSelectedStudent}
                    />
                    <div className="learn-course-students-card__body">
                      <div className="learn-course-students-card__name">{student.name}</div>
                      <div className="learn-course-students-card__meta">
                        <span className="learn-course-students-card__label">Roll No</span>
                        <span className="learn-course-students-card__value">{student.rollNo ?? "—"}</span>
                      </div>
                      {isTeacherRole && (
                        <div className="learn-course-students-card__meta">
                          <span className="learn-course-students-card__label">Contact</span>
                          <span className="learn-course-students-card__value">
                            {formatMobile(student.contactMobile) || "—"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </>
        )}
      </section>
      </div>
      <Modal
        rootClassName="ln-course-direct-modal-root"
        centered
        footer={null}
        open={Boolean(selectedStudent)}
        onCancel={() => setSelectedStudent(null)}
        className="learn-course-students-photo-modal"
        width="min(360px, calc(100vw - 32px))"
      >
        {selectedStudent && (
          <div className="learn-course-students-photo-modal__content">
            <div
              className="learn-course-students-photo-modal__image"
              style={{ background: selectedStudent.avatarTint?.bg, color: selectedStudent.avatarTint?.fg }}
            >
              {selectedStudent.imageUrl && !failedImages[selectedStudent.key] ? (
                <img
                  src={selectedStudent.imageUrl}
                  alt={`${selectedStudent.name} profile`}
                  onError={() => handleImageError(selectedStudent.key)}
                />
              ) : (
                <span>{getInitials(selectedStudent.name)}</span>
              )}
            </div>
            <h3>{selectedStudent.name}</h3>
            <p>{selectedStudent.rollNo ? `Roll ${selectedStudent.rollNo}` : "Roll not assigned"}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default React.memo(Student);
