package com._42students.lms.service;

import com._42students.lms.enums.FacultyType;
import com._42students.lms.enums.AnnouncementType;
import com._42students.lms.enums.RoomType;
import com._42students.lms.enums.StatusType;
import com._42students.lms.model.Announcement;
import com._42students.lms.model.Batch;
import com._42students.lms.model.ClassSchedule;
import com._42students.lms.model.College;
import com._42students.lms.model.Course;
import com._42students.lms.model.Department;
import com._42students.lms.model.Attend;
import com._42students.lms.model.Discussions;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.Interview;
import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.JobApplicationStatusHistory;
import com._42students.lms.model.Learner;
import com._42students.lms.model.LectureHall;
import com._42students.lms.model.Lesson;
import com._42students.lms.model.LessonContents;
import com._42students.lms.model.LearnerContentProgress;
import com._42students.lms.model.NewProgram;
import com._42students.lms.model.Notification;
import com._42students.lms.model.Organization;
import com._42students.lms.model.Qualification;
import com._42students.lms.model.ProjectMember;
import com._42students.lms.model.ProjectWorkspace;
import com._42students.lms.model.Skill;
import com._42students.lms.model.SkillSynonym;
import com._42students.lms.model.StudentAssignment;
import com._42students.lms.model.StudentImage;
import com._42students.lms.model._Class;
import com._42students.lms.repository.AnnouncementRepository;
import com._42students.lms.repository.AttendanceRepository;
import com._42students.lms.repository.BatchRepository;
import com._42students.lms.repository.ClassScheduleRepository;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.repository.DepartmentRepository;
import com._42students.lms.repository.DiscussionRepository;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.InterviewRepository;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.repository.JobApplicationStatusHistoryRepository;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.repository.LearnerContentProgressRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.LectureHallRepository;
import com._42students.lms.repository.LessonContentsRepository;
import com._42students.lms.repository.LessonRepository;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.repository.NotificationRepository;
import com._42students.lms.repository.OrganizationRepository;
import com._42students.lms.repository.QualificationRepository;
import com._42students.lms.repository.ProjectMemberRepository;
import com._42students.lms.repository.ProjectWorkspaceRepository;
import com._42students.lms.repository.SkillRepository;
import com._42students.lms.repository.SkillSynonymRepository;
import com._42students.lms.repository.StudentAssignmentRepository;
import com._42students.lms.repository.StudentImageRepository;
import com._42students.lms.repository._ClassRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Creates minimal deterministic data for E2E and manual verification in UAT/dev.
 * Idempotent-ish: tries to reuse existing entities based on stable names/uniqueIds.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class E2eSeedService {

    @Value("${app.e2e.seed.enabled:false}")
    private boolean seedEnabled;

    private final OrganizationRepository organizationRepository;
    private final CollegeRepository collegeRepository;
    private final DepartmentRepository departmentRepository;
    private final NewProgramRepository newProgramRepository;
    private final BatchRepository batchRepository;
    private final _ClassRepository classRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final LessonContentsRepository lessonContentsRepository;
    private final FacultyRepository facultyRepository;
    private final LearnerRepository learnerRepository;

    private final LectureHallRepository lectureHallRepository;
    private final ClassScheduleRepository classScheduleRepository;
    private final AttendanceRepository attendanceRepository;

    private final NotificationRepository notificationRepository;
    private final AnnouncementRepository announcementRepository;
    private final DiscussionRepository discussionRepository;

    private final JobRepository jobRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final JobApplicationStatusHistoryRepository jobApplicationStatusHistoryRepository;
    private final InterviewRepository interviewRepository;

    private final SkillRepository skillRepository;
    private final SkillSynonymRepository skillSynonymRepository;
    private final QualificationRepository qualificationRepository;
    private final LearnerContentProgressRepository learnerContentProgressRepository;
    private final StudentAssignmentRepository studentAssignmentRepository;
    private final StudentImageRepository studentImageRepository;
    private final ProjectWorkspaceRepository projectWorkspaceRepository;
    private final ProjectMemberRepository projectMemberRepository;

    @Data
    public static class SeedResult {
        private Integer orgCollegeId;
        private Integer org42LearnId;
        private Integer collegeAId;
        private Integer collegeBId;
        private Integer deptAId;
        private Integer deptBId;
        private Integer programAId;
        private Integer programBId;
        private Long batchAId;
        private Long batchBId;
        private Integer classAId;
        private Integer classBId;
        private Integer courseAId;
        private Integer courseBId;
        private Integer lessonAId;
        private Integer lessonBId;
        private Integer facultyAId;
        private Integer facultyBId;
        private Integer learnerAId;
        private Integer learnerBId;
        private Integer lectureHallAId;
        private Long classScheduleAId;
        private Long attendanceAId;
        private Integer notificationAId;
        private Long announcementAId;
        private Integer jobAId;
        private Integer jobApplicationAId;
        private Integer interviewAId;
        private Integer discussionAId;
        private Integer projectWorkspaceAId;
        private String projectWorkspaceASlug;
        private Map<String, String> testPhones = new HashMap<>();
    }

    @Transactional
    public SeedResult seed() {
        if (!seedEnabled) {
            throw new IllegalStateException("E2E seeding is disabled. Set app.e2e.seed.enabled=true to allow seeding.");
        }

        // Orgs
        Organization orgColleges = upsertOrg("E2E Colleges");
        Organization org42Learn = upsertOrg("E2E 42Learn");

        // Colleges
        College collegeA = upsertCollege(orgColleges.getId(), "E2E College A", "e2e-college-a");
        College collegeB = upsertCollege(orgColleges.getId(), "E2E College B", "e2e-college-b");

        // Departments
        Department deptA = upsertDepartment(collegeA.getId(), "E2E Dept A");
        Department deptB = upsertDepartment(collegeB.getId(), "E2E Dept B");

        // Programs
        NewProgram programA = upsertProgram(deptA.getId(), "E2E Program A", 4);
        NewProgram programB = upsertProgram(deptB.getId(), "E2E Program B", 4);

        // Batches
        Batch batchA = upsertBatch((long) programA.getId(), "E2E Batch A", "2026-27");
        Batch batchB = upsertBatch((long) programB.getId(), "E2E Batch B", "2026-27");

        // Classes
        _Class classA = upsertClass(programA.getId(), batchA.getId().intValue(), "E2E Class A");
        _Class classB = upsertClass(programB.getId(), batchB.getId().intValue(), "E2E Class B");

        // Courses
        Course courseA = upsertCourse(org42Learn.getId(), deptA.getId(), "E2E Course A", "e2e-course-a");
        Course courseB = upsertCourse(org42Learn.getId(), deptB.getId(), "E2E Course B", "e2e-course-b");

        // Lessons + contents (minimal, but covers main content types)
        Lesson lessonA = upsertLesson(courseA.getId(), "E2E Lesson A");
        Lesson lessonB = upsertLesson(courseB.getId(), "E2E Lesson B");

        LessonContents lectureA = upsertLessonContentLecture(lessonA.getId(), classA.getId(), "E2E Lecture A", "E2E seeded lecture text");
        // This ran on every backend startup (app.e2e.seed.run-on-startup=true) and pointed at
        // a placeholder example.com URL that was never a real file — so anyone poking at a
        // freshly seeded environment always found a "video" lesson that silently refused to
        // play, with nothing in the UI explaining why. No test actually exercises playback of
        // this row (grepped both test suites — zero references to "E2E Video"), so the fake URL
        // was pure downside: it existed only to make lesson-content-type coverage look complete.
        // Pointing it at a real, stable, publicly reachable sample clip keeps that coverage
        // while making the seeded row actually work if someone clicks play.
        LessonContents videoA = upsertLessonContentVideo(lessonA.getId(), classA.getId(), "E2E Video A", "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4");
        LessonContents youtubeA = upsertLessonContentYoutube(lessonA.getId(), classA.getId(), "E2E YouTube A", "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        LessonContents assignmentA = upsertLessonContentAssignment(lessonA.getId(), classA.getId(), "E2E Assignment A", "Submit a short answer");

        LessonContents lectureB = upsertLessonContentLecture(lessonB.getId(), classB.getId(), "E2E Lecture B", "E2E seeded lecture text");

        // Users (by phone = login key)
        // Use plain-digit phone numbers to match frontend validation and backend lookup reliably.
        Faculty facultyA = upsertFaculty(orgColleges.getId(), collegeA.getId(), deptA.getId(), "E2E", "TeacherA", "9000000001");
        Faculty facultyB = upsertFaculty(orgColleges.getId(), collegeB.getId(), deptB.getId(), "E2E", "TeacherB", "9000000002");
        Faculty adminA = upsertAdminFaculty(orgColleges.getId(), collegeA.getId(), deptA.getId(), "E2E", "AdminA", "9000000003");
        Learner learnerA = upsertLearner(orgColleges.getId(), collegeA.getId(), programA.getId(), classA.getId(), "E2E", "LearnerA", "9000000011");
        Learner learnerB = upsertLearner(orgColleges.getId(), collegeB.getId(), programB.getId(), classB.getId(), "E2E", "LearnerB", "9000000012");

        // Lecture hall + class schedule + attendance (minimal)
        LectureHall hallA = upsertLectureHall(collegeA.getId(), deptA.getId(), "E2E Hall A");
        ClassSchedule scheduleA = upsertClassSchedule(classA.getId(), courseA.getId(), facultyA.getId(), hallA.getId(), "E2E Session A");
        Attend attendA = upsertAttendance(scheduleA.getId(), "E2E-STUDENT-" + learnerA.getId());

        // Notifications + announcements + discussion
        Notification notifA = upsertNotification(classA.getId(), courseA.getId(), "E2E Notification", "E2E seeded notification", "GENERAL");
        Announcement annA = upsertAnnouncement(AnnouncementType.CLASS, (long) classA.getId(), "E2E Announcement", "E2E seeded announcement", "SUPER_ADMIN", 0L);
        Discussions discA = upsertDiscussion(lectureA.getId(), "E2E discussion post", learnerA.getId(), learnerA.getFirstName() + " " + learnerA.getLastName());

        // Jobs + application + status history + interview (minimal)
        Job jobA = upsertJob(org42Learn.getId(), collegeA.getId(), deptA.getId(), programA.getId(), batchA.getId().intValue(), classA.getId(), "E2E Job A", "E2E Company");
        JobApplication appA = upsertJobApplication(jobA, learnerA, org42Learn.getId());
        upsertJobStatusHistory(appA.getId(), null, "APPLIED", 0);
        Interview interviewA = upsertInterview(org42Learn.getId(), jobA, appA, learnerA);

        // Skills + synonyms + qualification (profile / placements)
        Skill skillJava = upsertSkill("java", "Java", "Technical Skills");
        upsertSkillSynonym(skillJava, "jdk");
        upsertSkillSynonym(skillJava, "java language");
        upsertQualification(learnerA, collegeA.getName(), true);

        // Learner content progress
        upsertLearnerProgress(learnerA.getId(), videoA.getId(), 120, 600, false);
        upsertLearnerProgress(learnerA.getId(), youtubeA.getId(), 600, 600, true);

        // Assignment submission
        upsertStudentAssignmentSubmission(assignmentA.getId(), learnerA, facultyA.getId(), false);

        // Student image (profile image store)
        upsertStudentImage(learnerA.getId(), "[{\"active\":1,\"data\":\"e2e\"}]");

        // Projects (mentor + learner demo workspace)
        Faculty projectMentor = resolveProjectMentor(facultyA);
        Learner projectLearner = resolveProjectLearner(learnerA);
        ProjectWorkspace projectWorkspaceA = upsertProjectWorkspaceDemo(
                projectMentor.getOrganizationId() != null ? projectMentor.getOrganizationId() : orgColleges.getId(),
                projectMentor.getCollegeId() != null ? projectMentor.getCollegeId() : collegeA.getId(),
                projectLearner.getClassId() != null ? projectLearner.getClassId() : classA.getId(),
                projectMentor,
                projectLearner,
                resolveProjectClassName(projectLearner, classA.getName())
        );
        log.info("Project workspace seeded: slug={}, projectId={}, mentorId={}, learnerId={}, classId={}",
                projectWorkspaceA.getSlug(), projectWorkspaceA.getId(), projectMentor.getId(), projectLearner.getId(), projectWorkspaceA.getClassId());

        SeedResult out = new SeedResult();
        out.setOrgCollegeId(orgColleges.getId());
        out.setOrg42LearnId(org42Learn.getId());
        out.setCollegeAId(collegeA.getId());
        out.setCollegeBId(collegeB.getId());
        out.setDeptAId(deptA.getId());
        out.setDeptBId(deptB.getId());
        out.setProgramAId(programA.getId());
        out.setProgramBId(programB.getId());
        out.setBatchAId(batchA.getId());
        out.setBatchBId(batchB.getId());
        out.setClassAId(classA.getId());
        out.setClassBId(classB.getId());
        out.setCourseAId(courseA.getId());
        out.setCourseBId(courseB.getId());
        out.setLessonAId(lessonA.getId());
        out.setLessonBId(lessonB.getId());
        out.setFacultyAId(facultyA.getId());
        out.setFacultyBId(facultyB.getId());
        out.setLearnerAId(learnerA.getId());
        out.setLearnerBId(learnerB.getId());
        out.setLectureHallAId(hallA.getId());
        out.setClassScheduleAId((long) scheduleA.getId());
        out.setAttendanceAId(attendA.getId() != 0 ? (long) attendA.getId() : null);
        out.setNotificationAId(notifA.getId());
        out.setAnnouncementAId(annA.getId());
        out.setJobAId(jobA.getId());
        out.setJobApplicationAId(appA.getId());
        out.setInterviewAId(interviewA.getId());
        out.setDiscussionAId(discA.getId());
        out.setProjectWorkspaceAId(projectWorkspaceA.getId());
        out.setProjectWorkspaceASlug(projectWorkspaceA.getSlug());
        out.getTestPhones().put("facultyA", facultyA.getContactMobile());
        out.getTestPhones().put("facultyB", facultyB.getContactMobile());
        out.getTestPhones().put("adminA", adminA.getContactMobile());
        out.getTestPhones().put("learnerA", learnerA.getContactMobile());
        out.getTestPhones().put("learnerB", learnerB.getContactMobile());
        return out;
    }

    private Organization upsertOrg(String name) {
        return organizationRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> {
                    Organization o = new Organization();
                    o.setName(name);
                    return organizationRepository.save(o);
                });
    }

    private College upsertCollege(Integer orgId, String name, String uniqueId) {
        Optional<College> existing = collegeRepository.findByUniqueIdIgnoreCase(uniqueId);
        if (existing.isPresent()) {
            College c = existing.get();
            if (c.getOrgId() == null || !c.getOrgId().equals(orgId)) {
                c.setOrgId(orgId);
                return collegeRepository.save(c);
            }
            return c;
        }
        College c = new College();
        c.setName(name);
        c.setUniqueId(uniqueId);
        c.setOrgId(orgId);
        c.setLogo(null);
        return collegeRepository.save(c);
    }

    private Department upsertDepartment(Integer collegeId, String name) {
        List<Department> all = departmentRepository.fetchAllDepartments(collegeId);
        Department existing = all.stream()
                .filter(d -> d.getName() != null && d.getName().trim().equalsIgnoreCase(name.trim()))
                .min(Comparator.comparingInt(Department::getId))
                .orElse(null);
        if (existing != null) return existing;
        Department d = new Department();
        d.setCollegeId(collegeId);
        d.setName(name);
        d.setDeptChairId(0);
        d.setDeptViceChairId(0);
        return departmentRepository.save(d);
    }

    private NewProgram upsertProgram(Integer deptId, String name, int durationYears) {
        List<NewProgram> existing = newProgramRepository.findByDeptId(deptId);
        NewProgram match = existing.stream()
                .filter(p -> p.getName() != null && p.getName().trim().equalsIgnoreCase(name.trim()))
                .min(Comparator.comparingInt(NewProgram::getId))
                .orElse(null);
        if (match != null) return match;
        NewProgram p = new NewProgram();
        p.setDeptId(deptId);
        p.setName(name);
        p.setDurationYears(durationYears);
        return newProgramRepository.save(p);
    }

    private Batch upsertBatch(Long programId, String batchName, String academicYear) {
        List<Batch> batches = batchRepository.findByProgramId(programId);
        Batch match = batches.stream()
                .filter(b -> b.getBatchName() != null && b.getBatchName().trim().equalsIgnoreCase(batchName.trim()))
                .min(Comparator.comparingLong(Batch::getId))
                .orElse(null);
        if (match != null) {
            if (match.getAcademicYear() == null) {
                match.setAcademicYear(academicYear);
                return batchRepository.save(match);
            }
            return match;
        }
        LocalDate now = LocalDate.now();
        Batch b = new Batch();
        b.setBatchName(batchName);
        b.setProgramId(programId);
        b.setStartDate(java.sql.Date.valueOf(now));
        b.setEndDate(java.sql.Date.valueOf(now.plusYears(4)));
        b.setCurrentStudents(0);
        b.setCurrentSemester(1);
        b.setAcademicYear(academicYear);
        b.setStatus(StatusType.ACTIVE);
        b.setCreatedAt(java.sql.Date.valueOf(now));
        b.setUpdatedAt(java.sql.Date.valueOf(now));
        return batchRepository.save(b);
    }

    private _Class upsertClass(Integer programId, Integer batchId, String name) {
        List<_Class> classes = classRepository.getClassesByProgram(programId);
        _Class match = classes.stream()
                .filter(c -> c.getName() != null && c.getName().trim().equalsIgnoreCase(name.trim()))
                .min(Comparator.comparingInt(_Class::getId))
                .orElse(null);
        if (match != null) {
            boolean changed = false;
            if (match.getBatchId() == null || !match.getBatchId().equals(batchId)) {
                match.setBatchId(batchId);
                changed = true;
            }
            if (changed) return classRepository.save(match);
            return match;
        }
        _Class c = new _Class();
        c.setName(name);
        c.setDescription("E2E seeded class");
        c.setProgramId(programId);
        c.setBatchId(batchId);
        c.setUpperLimit(200);
        c.setLowerLimit(0);
        c.setStartDate(Date.valueOf(LocalDate.now()));
        c.setEndDate(Date.valueOf(LocalDate.now().plusYears(4)));
        return classRepository.save(c);
    }

    private Course upsertCourse(Integer createdByOrgId, Integer deptId, String courseName, String slug) {
        Course existing = courseRepository.findBySlug(slug.toLowerCase(Locale.ROOT));
        if (existing != null) {
            Course c = existing;
            boolean changed = false;
            if (c.getDeptId() != deptId) {
                c.setDeptId(deptId);
                changed = true;
            }
            if (c.getCreatedByOrgId() == null || !c.getCreatedByOrgId().equals(createdByOrgId)) {
                c.setCreatedByOrgId(createdByOrgId);
                changed = true;
            }
            if (changed) return courseRepository.save(c);
            return c;
        }
        Course c = new Course();
        c.setDeptId(deptId);
        c.setCourseName(courseName);
        c.setShortTitle(courseName);
        c.setParentCourseId(0);
        c.setCreatedByOrgId(createdByOrgId);
        c.setActive(true);
        c.setEnabled(true);
        c.setAllowedForDisplay(1);
        c.setSlug(slug.toLowerCase(Locale.ROOT));
        return courseRepository.save(c);
    }

    private Lesson upsertLesson(Integer courseId, String title) {
        List<Lesson> lessons = lessonRepository.getLessons(courseId);
        Lesson match = lessons.stream()
                .filter(l -> l.getLessonName() != null && l.getLessonName().trim().equalsIgnoreCase(title.trim()))
                .min(Comparator.comparingInt(Lesson::getId))
                .orElse(null);
        if (match != null) return match;
        Lesson l = new Lesson();
        l.setLessonName(title);
        l.setCourseId(courseId);
        l.setActive(true);
        l.setEnabled(true);
        long maxSeq = 0;
        try {
            maxSeq = lessonRepository.getMaxSequenceByCourseId(courseId);
        } catch (Exception ignored) {}
        l.setSequence(maxSeq + 1);
        return lessonRepository.save(l);
    }

    private LessonContents findLessonContentByTitle(int lessonId, int classId, String title) {
        List<LessonContents> existing = lessonContentsRepository.fetchSpecificLessonContents(lessonId, classId);
        if (existing == null) return null;
        return existing.stream()
                .filter(lc -> lc.getContentTitle() != null && lc.getContentTitle().trim().equalsIgnoreCase(title.trim()))
                .findFirst()
                .orElse(null);
    }

    private LessonContents upsertLessonContentLecture(Integer lessonId, Integer classId, String title, String text) {
        LessonContents existing = findLessonContentByTitle(lessonId, classId, title);
        if (existing != null) return existing;
        LessonContents lc = new LessonContents();
        lc.setLessonId(lessonId);
        lc.setClassId(classId);
        lc.setContentTitle(title);
        lc.setContentType("resource");
        com._42students.lms.dto.request.ContentDataDTO dto = new com._42students.lms.dto.request.ContentDataDTO();
        dto.setText(text);
        lc.setContentDataDTO(dto);
        lc.setActive(true);
        lc.setEnabled(true);
        lc.setSequence(1);
        return lessonContentsRepository.save(lc);
    }

    private LessonContents upsertLessonContentVideo(Integer lessonId, Integer classId, String title, String link) {
        LessonContents existing = findLessonContentByTitle(lessonId, classId, title);
        if (existing != null) return existing;
        LessonContents lc = new LessonContents();
        lc.setLessonId(lessonId);
        lc.setClassId(classId);
        lc.setContentTitle(title);
        lc.setContentType("video");
        com._42students.lms.dto.request.ContentDataDTO dto = new com._42students.lms.dto.request.ContentDataDTO();
        dto.setLink(link);
        dto.setThumbnail("https://example.com/e2e/thumb.png");
        dto.setDuration(600L);
        lc.setContentDataDTO(dto);
        lc.setActive(true);
        lc.setEnabled(true);
        lc.setSequence(2);
        return lessonContentsRepository.save(lc);
    }

    private LessonContents upsertLessonContentYoutube(Integer lessonId, Integer classId, String title, String link) {
        LessonContents existing = findLessonContentByTitle(lessonId, classId, title);
        if (existing != null) return existing;
        LessonContents lc = new LessonContents();
        lc.setLessonId(lessonId);
        lc.setClassId(classId);
        lc.setContentTitle(title);
        lc.setContentType("youtube");
        com._42students.lms.dto.request.ContentDataDTO dto = new com._42students.lms.dto.request.ContentDataDTO();
        dto.setLink(link);
        dto.setThumbnail("https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
        dto.setDuration(600L);
        lc.setContentDataDTO(dto);
        lc.setActive(true);
        lc.setEnabled(true);
        lc.setSequence(3);
        return lessonContentsRepository.save(lc);
    }

    private LessonContents upsertLessonContentAssignment(Integer lessonId, Integer classId, String title, String text) {
        LessonContents existing = findLessonContentByTitle(lessonId, classId, title);
        if (existing != null) return existing;
        LessonContents lc = new LessonContents();
        lc.setLessonId(lessonId);
        lc.setClassId(classId);
        lc.setContentTitle(title);
        lc.setContentType("assignment");
        com._42students.lms.dto.request.ContentDataDTO dto = new com._42students.lms.dto.request.ContentDataDTO();
        dto.setText(text);
        lc.setContentDataDTO(dto);
        lc.setPoints(10);
        lc.setActive(true);
        lc.setEnabled(true);
        lc.setSequence(4);
        return lessonContentsRepository.save(lc);
    }

    private LectureHall upsertLectureHall(Integer collegeId, Integer deptId, String name) {
        List<LectureHall> halls = lectureHallRepository.findByCollegeId(collegeId);
        LectureHall match = halls.stream()
                .filter(h -> h.getName() != null && h.getName().trim().equalsIgnoreCase(name.trim()))
                .min(Comparator.comparingInt(LectureHall::getId))
                .orElse(null);
        if (match != null) return match;
        LectureHall h = new LectureHall();
        h.setCollegeId(collegeId);
        h.setDeptId(deptId);
        h.setName(name);
        h.setCapacity(120);
        h.setDescription("E2E seeded hall");
        h.setRoomType(RoomType.LECTURE_HALL);
        return lectureHallRepository.save(h);
    }

    private ClassSchedule upsertClassSchedule(Integer classId, Integer courseId, Integer facultyId, Integer lectureHallId, String title) {
        // There is no safe unique constraint here; create at most one "E2E Session A" per class by searching last N.
        List<ClassSchedule> byClass = classScheduleRepository.getClassScheduleByClassId(
                String.valueOf(classId),
                java.sql.Date.valueOf(LocalDate.now().minusDays(1)),
                java.sql.Date.valueOf(LocalDate.now().plusDays(30))
        );
        ClassSchedule match = byClass.stream()
                .filter(cs -> cs.getTitle() != null && cs.getTitle().trim().equalsIgnoreCase(title.trim()))
                .min(Comparator.comparingInt(cs -> cs.getId()))
                .orElse(null);
        if (match != null) return match;
        ClassSchedule cs = new ClassSchedule();
        cs.setClassId(classId);
        cs.setCourseId(courseId);
        cs.setFacultyId(facultyId);
        cs.setLectureHallId(lectureHallId);
        cs.setTitle(title);
        // Stored as strings in entity; keep MySQL-friendly timestamp strings
        cs.setStartTime(LocalDateTime.now().plusHours(2).toString().replace('T', ' '));
        cs.setEndTime(LocalDateTime.now().plusHours(3).toString().replace('T', ' '));
        return classScheduleRepository.save(cs);
    }

    private Attend upsertAttendance(Integer classScheduleId, String studentId) {
        Attend existing = attendanceRepository.getAttendance(String.valueOf(classScheduleId), studentId);
        if (existing != null) return existing;
        Attend a = new Attend();
        a.setClassScheduleId(classScheduleId);
        a.setStudentId(studentId);
        a.setDropClassReason(null);
        return attendanceRepository.save(a);
    }

    private Notification upsertNotification(Integer classId, Integer courseId, String title, String message, String type) {
        List<Notification> existing = notificationRepository.fetch(classId, courseId);
        Notification match = existing.stream()
                .filter(n -> n.getTitle() != null && n.getTitle().trim().equalsIgnoreCase(title.trim()))
                .findFirst()
                .orElse(null);
        if (match != null) return match;
        Notification n = new Notification();
        n.setClassId(classId);
        n.setCourseId(courseId);
        n.setTitle(title);
        n.setMessage(message);
        n.setRead(false);
        n.setNotificationType(type);
        n.setContextLabel("E2E");
        return notificationRepository.save(n);
    }

    private Announcement upsertAnnouncement(AnnouncementType receiverType, Long receiverValue, String title, String message, String senderType, Long senderId) {
        List<Announcement> existing = announcementRepository.findByReceiverTypeAndReceiverValue(receiverType, receiverValue);
        Announcement match = existing.stream()
                .filter(a -> a.getTitle() != null && a.getTitle().trim().equalsIgnoreCase(title.trim()))
                .findFirst()
                .orElse(null);
        if (match != null) return match;
        Announcement a = new Announcement();
        a.setReceiverType(receiverType);
        a.setReceiverValue(receiverValue);
        a.setTitle(title);
        a.setMessage(message);
        a.setSenderType(senderType);
        a.setSenderId(senderId);
        a.setIsDeleted(false);
        return announcementRepository.save(a);
    }

    private Discussions upsertDiscussion(Integer lessonContentId, String text, Integer userId, String userName) {
        List<Discussions> existing = discussionRepository.fetchDiscussion(lessonContentId);
        Discussions match = existing.stream()
                .filter(d -> d.getContentText() != null && d.getContentText().trim().equalsIgnoreCase(text.trim()))
                .findFirst()
                .orElse(null);
        if (match != null) return match;
        Discussions d = new Discussions();
        d.setLessonContentId(lessonContentId);
        d.setContentText(text);
        d.setSequence(1);
        d.setUserId(userId);
        d.setUserName(userName);
        d.setProfileName(userName);
        return discussionRepository.save(d);
    }

    private Job upsertJob(Integer orgId, Integer collegeId, Integer deptId, Integer programId, Integer batchId, Integer classId,
                          String jobTitle, String company) {
        // keep it simple: reuse by title+org
        List<Job> jobs = jobRepository.findAllActiveJobsByOrganization(orgId);
        Job match = jobs.stream()
                .filter(j -> j.getJobTitle() != null && j.getJobTitle().trim().equalsIgnoreCase(jobTitle.trim()))
                .findFirst()
                .orElse(null);
        if (match != null) return match;
        Job j = new Job();
        j.setOrganizationId(orgId);
        j.setCollegeId(collegeId);
        j.setTargetDepartmentId(deptId);
        j.setTargetProgramId(programId);
        j.setTargetBatchId(batchId);
        j.setTargetClassId(classId);
        j.setJobTitle(jobTitle);
        j.setCompanyName(company);
        j.setJobType("Internship");
        j.setLocation("Remote");
        j.setCtcRange("6-10 LPA");
        j.setPostedDate(LocalDateTime.now().minusDays(1));
        j.setApplicationDeadline(LocalDateTime.now().plusDays(30));
        j.setIsActive(true);
        j.setIsDraft(false);
        j.setVisibilityType("INTERNAL_ONLY");
        j.setScreeningVersion("v1");
        return jobRepository.save(j);
    }

    private JobApplication upsertJobApplication(Job job, Learner learner, Integer orgId) {
        Optional<JobApplication> existing = jobApplicationRepository.findByLearnerIdAndJobIdIncludeDeleted(learner.getId(), job.getId());
        if (existing.isPresent()) {
            JobApplication ja = existing.get();
            if (Boolean.TRUE.equals(ja.getIsDeleted())) {
                ja.setIsDeleted(false);
            }
            if (ja.getOrganizationId() == null) ja.setOrganizationId(orgId);
            return jobApplicationRepository.save(ja);
        }
        JobApplication ja = new JobApplication();
        ja.setJob(job);
        ja.setLearner(learner);
        ja.setOrganizationId(orgId);
        ja.setApplicationStatus("APPLIED");
        ja.setSource("INTERNAL");
        ja.setPapRequested(false);
        return jobApplicationRepository.save(ja);
    }

    private JobApplicationStatusHistory upsertJobStatusHistory(Integer applicationId, String oldStatus, String newStatus, Integer changedBy) {
        // Keep one record per (applicationId,newStatus) for idempotency
        List<JobApplicationStatusHistory> all = jobApplicationStatusHistoryRepository.findByApplicationIdOrderByChangedAtAsc(applicationId);
        JobApplicationStatusHistory match = all.stream()
                .filter(h -> h.getNewStatus() != null && h.getNewStatus().equalsIgnoreCase(newStatus))
                .findFirst()
                .orElse(null);
        if (match != null) return match;
        JobApplicationStatusHistory h = new JobApplicationStatusHistory();
        h.setApplicationId(applicationId);
        h.setOldStatus(oldStatus);
        h.setNewStatus(newStatus);
        h.setChangedAt(LocalDateTime.now());
        h.setChangedBy(changedBy);
        return jobApplicationStatusHistoryRepository.save(h);
    }

    private Interview upsertInterview(Integer orgId, Job job, JobApplication app, Learner learner) {
        List<Interview> existing = interviewRepository.findByJobApplicationId(app.getId());
        Interview match = existing.stream()
                .filter(i -> i.getInterviewType() != null && i.getInterviewType().equalsIgnoreCase("TECHNICAL"))
                .findFirst()
                .orElse(null);
        if (match != null) return match;
        Interview i = new Interview();
        i.setOrganizationId(orgId);
        i.setJob(job);
        i.setJobApplication(app);
        i.setLearner(learner);
        i.setInterviewType("TECHNICAL");
        i.setInterviewStatus("SCHEDULED");
        i.setScheduledDate(LocalDateTime.now().plusDays(3));
        i.setInterviewMode("ONLINE");
        i.setLocation("https://meet.example.com/e2e");
        i.setDurationMinutes(60);
        i.setRoundDescription("E2E seeded technical round");
        i.setCreatedBy(0);
        return interviewRepository.save(i);
    }

    private Skill upsertSkill(String name, String displayName, String category) {
        return skillRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> {
                    Skill s = new Skill();
                    s.setName(name.toLowerCase(Locale.ROOT));
                    s.setDisplayName(displayName);
                    s.setCategory(category);
                    s.setIsActive(true);
                    s.setUsageCount(1);
                    s.setSearchPriority(10);
                    return skillRepository.save(s);
                });
    }

    private void upsertSkillSynonym(Skill skill, String synonym) {
        if (skill == null || synonym == null) return;
        String syn = synonym.toLowerCase(Locale.ROOT).trim();
        if (syn.isEmpty()) return;
        if (skillSynonymRepository.existsBySynonym(syn)) return;
        skillSynonymRepository.save(new SkillSynonym(skill, syn));
    }

    private void upsertQualification(Learner learner, String institution, boolean isRecent) {
        if (learner == null) return;
        List<Qualification> existing = qualificationRepository.findByLearnerIdAndIsDeletedFalse(learner.getId());
        boolean hasUg = existing.stream().anyMatch(q -> q.getEducationType() != null && q.getEducationType().equalsIgnoreCase("UG"));
        if (hasUg) return;
        Qualification q = new Qualification();
        q.setLearner(learner);
        q.setEducationType("UG");
        q.setProgram("B.Tech");
        q.setSpecialization("CSE");
        q.setInstitutionName(institution != null ? institution : "E2E Institute");
        q.setStartYear("2022");
        q.setEndYear("2026");
        q.setIsCurrentlyPursuing(false);
        q.setGradingType("CGPA");
        q.setGrade("8.5");
        q.setMaxGrade("10");
        q.setIsRecentEducation(isRecent);
        qualificationRepository.save(q);
    }

    private void upsertLearnerProgress(int learnerId, int lessonContentId, int pos, int duration, boolean completed) {
        Optional<LearnerContentProgress> existing = learnerContentProgressRepository.findTopByLearnerIdAndLessonContentIdOrderByAttemptDesc(learnerId, lessonContentId);
        if (existing.isPresent()) return;
        LearnerContentProgress p = new LearnerContentProgress();
        p.setLearnerId(learnerId);
        p.setLessonContentId(lessonContentId);
        p.setLastPositionSeconds(pos);
        p.setDurationSeconds(duration);
        p.setCompletedAt(completed ? java.time.Instant.now() : null);
        learnerContentProgressRepository.save(p);
    }

    private void upsertStudentAssignmentSubmission(int lessonContentId, Learner learner, Integer facultyId, boolean graded) {
        if (learner == null) return;
        if (studentAssignmentRepository.existsByStudentIdAndLessonContentId(learner.getId(), lessonContentId)) return;
        StudentAssignment sa = new StudentAssignment();
        sa.setLessonContentId(lessonContentId);
        sa.setStudentId(learner.getId());
        sa.setStudentFirstName(learner.getFirstName());
        sa.setStudentLastName(learner.getLastName());
        sa.setFacultyId(facultyId);
        sa.setAssignmentName("E2E Assignment Submission");
        com._42students.lms.dto.request.FileDTO f = new com._42students.lms.dto.request.FileDTO();
        f.setOriginalName("e2e.txt");
        f.setMimetype("text/plain");
        f.setEncoding("utf-8");
        f.setSize(3);
        f.setCloudStorageObject("e2e/e2e.txt");
        sa.setFileDTO(f);
        sa.setHtmlContent("<p>E2E submission</p>");
        sa.setPoints(10);
        sa.setPointsObtained(graded ? 10 : 0);
        sa.setGraded(graded ? 1 : 0);
        sa.setGradingStatus(graded ? "MANUALLY_GRADED" : "NOT_GRADED");
        sa.setGradePublished(graded);
        sa.setAttemptNumber(1);
        sa.setSemesterNumber(1);
        studentAssignmentRepository.save(sa);
    }

    private void upsertStudentImage(int learnerId, String imageData) {
        String lid = String.valueOf(learnerId);
        StudentImage existing = studentImageRepository.findByLearnerId(lid);
        if (existing != null) return;
        StudentImage si = new StudentImage();
        si.setLearnerId(lid);
        si.setImageData(imageData);
        studentImageRepository.save(si);
    }

    private ProjectWorkspace upsertProjectWorkspaceDemo(Integer orgId,
                                                        Integer collegeId,
                                                        Integer classId,
                                                        Faculty mentor,
                                                        Learner learner,
                                                        String className) {
        String slug = "proj-" + collegeId + "-" + classId + "-demo";
        Optional<ProjectWorkspace> existing = projectWorkspaceRepository.findActiveBySlug(slug);
        if (existing.isPresent()) {
            ProjectWorkspace project = existing.get();
            boolean changed = false;
            if (project.getOrganizationId() == null || !project.getOrganizationId().equals(orgId)) {
                project.setOrganizationId(orgId);
                changed = true;
            }
            if (project.getCollegeId() == null || !project.getCollegeId().equals(collegeId)) {
                project.setCollegeId(collegeId);
                changed = true;
            }
            if (project.getClassId() == null || !project.getClassId().equals(classId)) {
                project.setClassId(classId);
                changed = true;
            }
            if (project.getCreatedBy() == null || !project.getCreatedBy().equals(mentor.getId())) {
                project.setCreatedBy(mentor.getId());
                changed = true;
            }
            if (changed) {
                return projectWorkspaceRepository.save(project);
            }
            ensureProjectMembers(project.getId(), mentor, learner);
            return project;
        }

        ProjectWorkspace project = new ProjectWorkspace();
        project.setSlug(slug);
        project.setTitle("Campus Event Planner");
        project.setSummary("Plan, track, and review the project workspace for the demo class.");
        project.setCourseLabel(className != null && !className.isBlank() ? className : "Project Workshop");
        project.setStatus("IN_PROGRESS");
        project.setPhase("Planning");
        project.setProgress(62);
        project.setBlocker(null);
        project.setNextAction("Review pending design changes");
        project.setDueLabel("Due Friday");
        project.setOrganizationId(orgId);
        project.setCollegeId(collegeId);
        project.setClassId(classId);
        project.setCreatedBy(mentor.getId());
        project.setOverview(buildProjectOverview());
        project = projectWorkspaceRepository.save(project);
        ensureProjectMembers(project.getId(), mentor, learner);
        return project;
    }

    private void ensureProjectMembers(Integer projectId, Faculty mentor, Learner learner) {
        upsertProjectMember(projectId, mentor.getId(), "FACULTY", mentor.getFirstName() + " " + mentor.getLastName(), "Project Mentor");
        upsertProjectMember(projectId, learner.getId(), "LEARNER", learner.getFirstName() + " " + learner.getLastName(), "Project Contributor");
    }

    private Faculty resolveProjectMentor(Faculty fallback) {
        return facultyRepository.findByContactMobile("9100060099").orElse(fallback);
    }

    private Learner resolveProjectLearner(Learner fallback) {
        return learnerRepository.findByContactMobile("9100060029").orElse(fallback);
    }

    private String resolveProjectClassName(Learner learner, String fallback) {
        if (learner != null && learner.getClassId() != null) {
            try {
                _Class classDetail = classRepository.getClassDetail(String.valueOf(learner.getClassId()));
                if (classDetail != null && classDetail.getName() != null && !classDetail.getName().isBlank()) {
                    return classDetail.getName();
                }
            } catch (Exception ignored) {
                // fall back below
            }
        }
        return fallback;
    }

    private void upsertProjectMember(Integer projectId, Integer userId, String userType, String displayName, String roleLabel) {
        boolean exists = projectMemberRepository.existsActiveMembership(projectId, userId, userType);
        if (exists) return;
        ProjectMember member = new ProjectMember();
        member.setProjectId(projectId);
        member.setUserId(userId);
        member.setUserType(userType);
        member.setDisplayName(displayName);
        member.setRoleLabel(roleLabel);
        member.setMemberStatus("ACTIVE");
        projectMemberRepository.save(member);
    }

    private Map<String, Object> buildProjectOverview() {
        Map<String, Object> overview = new HashMap<>();
        overview.put("headline", "Campus Event Planner");
        overview.put("description", "Coordinate team deliverables for the demo project.");
        overview.put("status", "In Progress");
        overview.put("progress", 62);
        return overview;
    }

    private List<Map<String, Object>> buildProjectSprints() {
        return List.of(
                sprint("Discovery complete", "done", "2026-07-18"),
                sprint("Prototype review", "in_progress", "2026-07-24"),
                sprint("Final handoff", "upcoming", "2026-07-31")
        );
    }

    private List<Map<String, Object>> buildProjectTasks() {
        return List.of(
                task("Draft project scope", "done", "Project Lead"),
                task("Prepare UI checklist", "in_progress", "UI Contributor"),
                task("QA walkthrough", "open", "QA Contributor")
        );
    }

    private List<Map<String, Object>> buildProjectResources() {
        return List.of(
                resource("Project brief", "docs/project-brief.pdf", "pdf"),
                resource("Shared assets", "https://drive.google.com/", "link")
        );
    }

    private Map<String, Object> buildProjectDelivery() {
        Map<String, Object> delivery = new HashMap<>();
        delivery.put("method", "Presentation + submission");
        delivery.put("due", "Friday");
        delivery.put("notes", "Upload final deck and implementation notes.");
        return delivery;
    }

    private List<Map<String, Object>> buildProjectMeetings() {
        return List.of(
                meeting(
                        "Weekly sync",
                        "2026-07-30",
                        "16:00:00",
                        "17:00:00",
                        "Asia/Calcutta",
                        "Mentor review and blockers",
                        "Review blockers, validate sprints, and confirm next actions."
                )
        );
    }

    private List<Map<String, Object>> buildProjectActivity() {
        return List.of(
                activity("Mentor updated the review checklist", "2026-07-31T10:30:00"),
                activity("Learner posted a progress note", "2026-07-31T12:15:00")
        );
    }

    private Map<String, Object> sprint(String title, String status, String dueDate) {
        Map<String, Object> sprint = new HashMap<>();
        sprint.put("title", title);
        sprint.put("status", status);
        sprint.put("dueDate", dueDate);
        return sprint;
    }

    private Map<String, Object> task(String title, String status, String owner) {
        Map<String, Object> task = new HashMap<>();
        task.put("title", title);
        task.put("status", status);
        task.put("owner", owner);
        return task;
    }

    private Map<String, Object> resource(String title, String href, String type) {
        Map<String, Object> resource = new HashMap<>();
        resource.put("title", title);
        resource.put("href", href);
        resource.put("type", type);
        return resource;
    }

    private Map<String, Object> meeting(String title, String meetingDate, String startTime, String endTime, String timezone, String notes, String agenda) {
        Map<String, Object> meeting = new HashMap<>();
        meeting.put("title", title);
        meeting.put("meetingDate", meetingDate);
        meeting.put("startTime", startTime);
        meeting.put("endTime", endTime);
        meeting.put("timezone", timezone);
        meeting.put("notes", notes);
        meeting.put("agenda", agenda);
        meeting.put("outcome", "");
        meeting.put("meetingStatus", "SCHEDULED");
        meeting.put("organizerName", "Mentor");
        meeting.put("attendees", List.of());
        return meeting;
    }

    private Map<String, Object> activity(String title, String createdAt) {
        Map<String, Object> activity = new HashMap<>();
        activity.put("title", title);
        activity.put("createdAt", createdAt);
        return activity;
    }

    private Faculty upsertFaculty(Integer orgId, Integer collegeId, Integer deptId, String first, String last, String phone) {
        Optional<Faculty> existing = facultyRepository.findByContactMobile(phone);
        if (existing.isPresent()) {
            Faculty f = existing.get();
            boolean changed = false;
            if (f.getOrganizationId() == null || !f.getOrganizationId().equals(orgId)) { f.setOrganizationId(orgId); changed = true; }
            if (f.getCollegeId() == null || !f.getCollegeId().equals(collegeId)) { f.setCollegeId(collegeId); changed = true; }
            if (f.getDeptId() == null || !f.getDeptId().equals(deptId)) { f.setDeptId(deptId); changed = true; }
            if (changed) return facultyRepository.save(f);
            return f;
        }
        Faculty f = new Faculty();
        f.setFirstName(first);
        f.setLastName(last);
        f.setContactMobile(phone);
        f.setContactMail("e2e+" + phone.replace("+", "") + "@example.com");
        f.setUniqueId("E2E-FAC-" + phone.replace("+", ""));
        f.setOrganizationId(orgId);
        f.setCollegeId(collegeId);
        f.setDeptId(deptId);
        f.setFacultyType(FacultyType.PERMANENT);
        f.setUserType("FACULTY");
        return facultyRepository.save(f);
    }

    private Faculty upsertAdminFaculty(Integer orgId, Integer collegeId, Integer deptId, String first, String last, String phone) {
        Optional<Faculty> existing = facultyRepository.findByContactMobile(phone);
        if (existing.isPresent()) {
            Faculty f = existing.get();
            boolean changed = false;
            if (f.getOrganizationId() == null || !f.getOrganizationId().equals(orgId)) { f.setOrganizationId(orgId); changed = true; }
            if (f.getCollegeId() == null || !f.getCollegeId().equals(collegeId)) { f.setCollegeId(collegeId); changed = true; }
            if (f.getDeptId() == null || !f.getDeptId().equals(deptId)) { f.setDeptId(deptId); changed = true; }
            if (f.getFacultyType() == null || !FacultyType.ADMIN.equals(f.getFacultyType())) { f.setFacultyType(FacultyType.ADMIN); changed = true; }
            if (changed) return facultyRepository.save(f);
            return f;
        }
        Faculty f = new Faculty();
        f.setFirstName(first);
        f.setLastName(last);
        f.setContactMobile(phone);
        f.setContactMail("e2e+" + phone.replace("+", "") + "@example.com");
        f.setUniqueId("E2E-ADM-" + phone.replace("+", ""));
        f.setOrganizationId(orgId);
        f.setCollegeId(collegeId);
        f.setDeptId(deptId);
        f.setFacultyType(FacultyType.ADMIN);
        f.setUserType("FACULTY");
        return facultyRepository.save(f);
    }

    private Learner upsertLearner(Integer orgId, Integer collegeId, Integer programId, Integer classId, String first, String last, String phone) {
        Optional<Learner> existing = learnerRepository.findByContactMobile(phone);
        if (existing.isPresent()) {
            Learner l = existing.get();
            boolean changed = false;
            if (l.getOrganizationId() == null || !l.getOrganizationId().equals(orgId)) { l.setOrganizationId(orgId); changed = true; }
            if (l.getCollegeId() == null || !l.getCollegeId().equals(collegeId)) { l.setCollegeId(collegeId); changed = true; }
            if (l.getProgramId() == null || !l.getProgramId().equals(programId)) { l.setProgramId(programId); changed = true; }
            if (l.getClassId() == null || !l.getClassId().equals(classId)) { l.setClassId(classId); changed = true; }
            if (changed) return learnerRepository.save(l);
            return l;
        }
        Learner l = new Learner();
        l.setFirstName(first);
        l.setLastName(last);
        l.setContactMobile(phone);
        l.setContactMail("e2e+" + phone.replace("+", "") + "@example.com");
        l.setUniqueId("E2E-LRN-" + phone.replace("+", ""));
        l.setRollNumber("E2E-" + phone.substring(Math.max(0, phone.length() - 4)));
        l.setOrganizationId(orgId);
        l.setCollegeId(collegeId);
        l.setProgramId(programId);
        l.setClassId(classId);
        l.setUserType("LEARNER");
        return learnerRepository.save(l);
    }
}

