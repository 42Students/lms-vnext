//user
export const getOTPUrl = "users/login";
export const getVerifyOTPUrl = "users/verifyOTP";
export const getPinUrl = "api/v1/learner/login/alternate";
export const getVerifyPinUrl = "api/v1/learner/verifyOTP/alternate";

export const getFacultyDetailsUrl = "api/v1/faculty/getInstructorDetails";
export const getStudentDetailsUrl = "api/v1/learner/getLearnerDetails";
export const registerFacultyUrl = "api/v1/faculty/register";
export const registerLearnerUrl = "/api/v1/learner/register";

//college
export const getCollegeUrl = "api/v1/college/fetchCollege";

//Courses
export const getCourseNameUrl = "api/v1/courses/fetchCourseName";
export const getCoursesListUrl = "api/v1/faculty/getCourses";
export const getAllCoursesUrl = "api/v1/courses/fetchAll";

// Analytics
export const getAnalyticsAssignmentsUrl = "api/v1/lesson/contents/fetchAllAssignmentsByFacultyId";
export const getAssignmentSubmissionStatsUrl = "api/v1/assignment/submissionStats";
export const getAssignmentSubmissionStatsBulkUrl = "api/v1/assignment/submissionStats/bulk";
export const getAssignmentSubmissionsUrl = "api/v1/assignment/fetchSubmissions";
export const getLessonListUrl = "api/v1/lesson/fetchSpecificCourseContents";
export const getProgramUrl = "api/v1/new-program/fetchProgramDetails";
export const getMyProgramDetailsUrl = "api/v1/learner/myProgramDetails";
export const getLearnerAttendanceCoursesUrl = "api/v1/learner/attendance/courses";
export const getLearnerAttendanceRecordsUrl = "api/v1/learner/attendance/records";
export const getLearnerCourseHomeStatsUrl = "api/v1/learner/courses/home-stats";
/** @deprecated Use getActiveAssignmentsByFaculty from FacultyAssignmentService */
export const getFacultyProgramUrl = "api/v1/faculty/getFacultyClassMapping";
export const getCourseUrl = "api/v1/courses/fetchCourse";
export const getFileUrl = "api/v1/upload/file/upload";
export const getLessonContentUrl =
  "api/v1/lesson/contents/fetchSpecificLessonContents";
export const getNotificationsUrl = "api/v1/notification/getNotifications";
export const getGradingUrl = "api/v1/lesson/fetchGradesByCourseAndClass";
export const getLessonUrl = "api/v1/lesson/create";
export const deleteAnnouncementUrl = "api/v1/notification/deleteNotification";
export const getCourseDataUrl = "api/v1/";
// The broad /api/v1/lesson/** mutation gate is admin-only. The faculty route
// validates an active course/class teaching assignment before delegating to the
// original lesson-content creation controller; it also accepts authorized admins.
export const createLessonContentUrl = "/api/v1/faculty/lesson-contents/create";
export const createCourseUrl = "/api/v1/courses/create";
/** @deprecated Use createTeachingAssignment from FacultyAssignmentService */
export const createFacultyCourseMappingUrl =
  "/api/v1/faculty/createCourseMapping";
export const getLessonContentMetricsUrl =
  "/api/v1/lesson/contents/fetchSpecificLessonContentsMetrics";
export const getLessonContentProgressUrl = "/api/v1/lesson/contents/progress";
export const saveContentProgressUrl = "/api/v1/lesson/contents/progress";
/** @deprecated Use getTeachingAssignmentById from FacultyAssignmentService */
export const getCourseByMappingIdUrl =
  "/api/v1/faculty/getFacultyCourseMappingDetails";

// New Teaching Assignment URLs (preferred)
export const teachingAssignmentBaseUrl = "/api/v1/teaching-assignment";

// Classroom chat
export const getClassroomMessagesUrl = "api/v1/classroom/messages";
export const createClassroomMessageUrl = "api/v1/classroom/messages";
export const toggleClassroomPinUrl = "api/v1/classroom/messages";

//ADMIN Service URLs
export const getDepartmentListUrl = "api/v1/department/fetch";
export const getDepartmentCoursesUrl = "api/v1/courses/fetch";
export const getDepartmentfacultyListUrl = "api/v1/faculty/getFacultyByDeptId";
export const getDepartmentProgramListUrl = "api/v1/new-program/fetchAll";
export const createDepartmentCourseUrl = "api/v1/courses/create";
export const updateDepartmentCourseUrl = "api/v1/courses/update";
export const createDepartmentProgramUrl = "api/v1/new-program/create";
export const updateDepartmentProgramUrl = "api/v1/new-program/update";
export const createDepartmentfacultyUrl = "api/v1/faculty/register";
export const updateDepartmentFacultyUrl = "api/v1/faculty/update";
export const createDepartmentStudentUrl = "api/v1/learner/register";
export const createDepartmentUrl = "api/v1/department/create";
export const updateDepartmentUrl = "api/v1/department/update";
export const getAdminStudentsListUrl = "users/contacts";
export const getGenericCourseContentUrl =
  "api/v1/lesson/fetchGenericCourseContents";
export const AddBulkFacultyUrl = "";
export const AddBulkCoursesUrl = "";
export const AddBulkStudentsUrl = "";
export const getClassNameUrl =
  "api/v1/lesson/contents/fetchUniqueClassesByCourseId";
export const getClassesForCourseSyllabusUrl =
  "api/v1/lesson/contents/fetchClassesForCourseSyllabus";
export const getProgramsListUrl = "api/v1/new-program/fetchAll";
export const getStudentsListbyProgramUrl = "users/learnerContactsByProgramId";

//Assignment
export const getAllFacultyAssignmentsUrl =
  "api/v1/lesson/contents/fetchAllAssignmentsByFacultyId";
export const getAllLearnerAssignmentsUrl =
  "api/v1/lesson/contents/fetchAllAssignmentsByLearnerId";
export const getCoursesForClassUrl =
  "api/v1/lesson/contents/coursesForClass";
export const getFacultyCoursesUrl =
  "api/v1/faculty-course-associations/fetchAllCoursesByFacultyId";
export const submitAssignmentUrl = "/api/v1/assignment/submit";
export const viewSubmitAssignmentUrl = "api/v1/assignment/fetchSubmissions";
export const getSubmittedAssignUrl =
  "api/v1/assignment/fetchSubmissionsByLearnerId";
// Quiz (first-class Quiz system uses /api/v1/quizzes/* directly in quizServices.js)

//notification
export const getAllNotificationByClassIdUrl =
  "api/v1/notification/getNotificationsByClassId";
export const getNotificationsForRecipientUrl =
  "api/v1/notification/getNotificationsForRecipient";

//calender
export const getFacultyCalenderEventsUrl =
  "/api/v1/scheduleClass/getClassScheduleByFacultyIdByDateRange";
export const getStudentsCalenderEventsUrl =
  "/api/v1/scheduleClass/getClassSchedulesByClassIdAndDateRange";

//attendance
export const markStudentAttendanceUrl = "/api/v1/learner/attend";
export const removeStudentAttendanceUrl = "/api/v1/learner/attend";
export const getStudentsListbyClassidUrl =
  "/api/v1/scheduleClass/getStudentsByClassScheduleId";
export const getClassSheduleByDaterangeUrl =
  "/api/v1/scheduleClass/getClassScheduleByClassIdByDateRange";
export const getStudentAttendanceByDaterangeUrl =
  "/api/v1/scheduleClass/getFilteredClassSchedulesAndAbsentees";
export const scheduleClassUrl = "/api/v1/scheduleClass/create";
export const studentAttendanceListByDaterangeUrl =
  "/api/v1/scheduleClass/learnerClassSchedulesAndAbsentClassScheduleIdsWithCourse";
// export const studentAttendanceListByDaterangeUrl =
//   "api/v1/scheduleClass/learnerClassSchedulesAndAbsentClassScheduleIdsWithCourse";

//Announcement
export const fetchAllTypesAnnouncementUrl =
  "/api/v1/announcements/fetchFacultyAnnouncements";
export const getAnnouncementsForLearnerUrl = "/api/v1/announcements/forLearner";
