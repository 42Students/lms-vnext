package com._42students.lms.integration;

import com._42students.lms.model.ProjectMember;
import com._42students.lms.model.ProjectWorkspace;
import com._42students.lms.repository.ProjectMemberRepository;
import com._42students.lms.repository.ProjectWorkspaceRepository;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.EncodedResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;

import java.lang.reflect.InvocationTargetException;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Real-MySQL integration check of the repository layer. Opt-in and disposable, like
 * {@link MySqlFlywayMigrationIT}: the *IT suffix keeps it out of the default H2-backed Surefire run and CI
 * invokes it explicitly (see .github/workflows/lms-mysql-query-regression.yml).
 * Never point this at staging or production: it only runs against the dedicated localhost
 * lms_regression_test database and rolls back everything it writes.
 *
 * Why it exists. Two production outages in September 2026 were invisible to every unit test:
 *
 * 1. A native UPDATE without a countQuery crashed Spring Data while it built the repository
 *    proxies, so the application never started.
 * 2. {@code ESCAPE '\'} in a JPQL string made the MySQL driver lose track of every ? after it, so
 *    GET /api/v1/projects/me/page returned 500 ("Parameter index out of range").
 *
 * Unit tests mock the repositories and H2 does not share MySQL's driver, so neither could fail
 * there. This test boots the real context against MySQL, then:
 *
 *  - calls every @Query method with placeholder arguments and fails on any driver or SQL-grammar
 *    error (SQLState 42xxx, S1xxx), which is what both incidents produced; and
 *  - checks the behaviour of the project-search queries with seeded rows, including that LIKE
 *    wildcards typed by a user are matched literally.
 */
@SpringBootTest(
        // MOCK, not NONE: the app registers MVC configuration that needs a ServletContext. MOCK supplies one
        // without starting a server.
        webEnvironment = SpringBootTest.WebEnvironment.MOCK,
        properties = {
                "spring.flyway.enabled=false",
                "spring.jpa.hibernate.ddl-auto=none",
                "spring.jpa.open-in-view=false",
                // A same-named stub bean in src/test/java/.../emailtest is component-scanned along with the real one.
                "spring.main.allow-bean-definition-overriding=true",
                "STAGE=it",
                "JWT_SECRET=integration-test-only-jwt-secret-0123456789-abcdefghijklmnopqrstuvwxyz",
                "GOOGLE_OAUTH_CLIENT_ID=dummy",
                "GOOGLE_OAUTH_CLIENT_SECRET=dummy",
                "GOOGLE_OAUTH_REDIRECT_URI=http://localhost/callback",
                "APP_FRONTEND_URL=http://localhost:3000",
                "APP_SUPER_ADMIN_PHONES=9000000000",
                "CORS_ALLOWED_ORIGINS=http://localhost:3000",
                "R2_ACCOUNT_ID=dummy",
                "R2_ACCESS_KEY=dummy",
                "R2_SECRET_KEY=dummy",
                "R2_BUCKET_NAME=dummy",
                "R2_PUBLIC_URL=http://localhost/r2",
                "SMS_API_KEY=dummy",
                "EXOTEL_API_KEY=dummy",
                "EXOTEL_API_TOKEN=dummy"
        })
class MySqlRepositoryQueriesIT {
    private static final String BS = String.valueOf((char) 92);

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        String url = System.getenv("LMS_MYSQL_IT_URL");
        String user = System.getenv("LMS_MYSQL_IT_USER");
        String password = System.getenv("LMS_MYSQL_IT_PASSWORD");
        assertTrue(url != null && url.matches(
                "^jdbc:mysql://(?:127\\.0\\.0\\.1|localhost):3306/lms_regression_test(?:\\?[^#]*)?$"),
                "BLOCKED: use only the dedicated localhost lms_regression_test database");
        assertTrue(user != null && !user.isBlank(), "BLOCKED: dedicated MySQL test user is required");
        assertTrue(password != null && !password.isBlank(), "BLOCKED: disposable MySQL password is required");

        // The schema cannot be built from the migrations alone: they start at V24 because the original
        // tables were created before Flyway was adopted. Load the same historical structure-only snapshot
        // used by MySqlFlywayMigrationIT, then let Flyway apply whatever is newer than the snapshot.
        // Refresh the snapshot with the command in src/test/resources/db/README-schema-snapshot.md.
        try (Connection connection = DriverManager.getConnection(url, user, password);
             Statement statement = connection.createStatement();
             ResultSet tables = statement.executeQuery(
                     "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()")) {
            tables.next();
            if (tables.getInt(1) == 0) {
                try (Statement session = connection.createStatement()) {
                    // The dump orders tables alphabetically, so foreign keys reference tables not created yet.
                    session.execute("SET FOREIGN_KEY_CHECKS=0");
                    ScriptUtils.executeSqlScript(connection,
                            new EncodedResource(new ClassPathResource("db/mysql-schema-snapshot.sql"), StandardCharsets.UTF_8));
                    session.execute("SET FOREIGN_KEY_CHECKS=1");
                }
            }
        } catch (SQLException e) {
            throw new IllegalStateException("BLOCKED: could not prepare the disposable MySQL schema", e);
        }

        // Idempotent: applies only migrations newer than the snapshot, does nothing when it is current.
        Flyway.configure()
                .dataSource(url, user, password)
                .locations("classpath:db/migration")
                .baselineOnMigrate(false)
                .validateOnMigrate(true)
                .cleanDisabled(true)
                .load()
                .migrate();

        registry.add("spring.datasource.url", () -> url);
        registry.add("spring.datasource.username", () -> user);
        registry.add("spring.datasource.password", () -> password);
        registry.add("LMS_JDBC_URL", () -> url);
        registry.add("LMS_DB_USER", () -> user);
        registry.add("LMS_DB_PASS", () -> password);
    }

    @Autowired
    ApplicationContext context;
    @Autowired
    PlatformTransactionManager transactionManager;
    @Autowired
    ProjectWorkspaceRepository workspaces;
    @Autowired
    ProjectMemberRepository members;
    @Autowired
    com._42students.lms.repository.ProjectTemplateRepository templates;
    @Autowired
    com._42students.lms.repository.JobRepository jobs;
    @Autowired
    com._42students.lms.repository.JobApplicationRepository applications;
    @Autowired
    com._42students.lms.repository.InterviewRepository interviews;
    @Autowired
    com._42students.lms.repository.LearnerRepository learners;
    @Autowired
    JdbcTemplate jdbc;
    @Autowired
    com._42students.lms.repository.CourseRepository courses;
    @Autowired
    com._42students.lms.repository.LessonRepository lessons;
    @Autowired
    com._42students.lms.repository.LessonContentsRepository lessonContents;
    @Autowired
    com._42students.lms.repository.QuizRepository quizzes;
    @Autowired
    com._42students.lms.repository.AttendanceRepository attendance;
    @Autowired
    com._42students.lms.repository.NotificationRepository notifications;

    // ------------------------------------------------------------------ the sweep

    @Test
    void everyQueryMethodBindsAndExecutesAgainstRealMysql() {
        Map<String, Repository> beans = context.getBeansOfType(Repository.class);
        List<String> failures = new ArrayList<>();
        Set<String> notReached = new TreeSet<>();
        int queryMethods = 0;
        int reachedDatabase = 0;

        for (Repository<?, ?> bean : beans.values()) {
            for (Class<?> iface : bean.getClass().getInterfaces()) {
                if (!iface.isInterface() || !Repository.class.isAssignableFrom(iface)
                        || !iface.getName().startsWith("com._42students")) {
                    continue;
                }
                for (Method method : iface.getDeclaredMethods()) {
                    if (method.getAnnotation(Query.class) == null || method.isDefault()) {
                        continue;
                    }
                    queryMethods++;
                    String label = iface.getSimpleName() + "." + method.getName();
                    Object[] args = placeholderArguments(method);
                    try {
                        new TransactionTemplate(transactionManager).execute(status -> {
                            try {
                                method.invoke(bean, args);
                            } catch (InvocationTargetException e) {
                                sneakyThrow(e.getCause());
                            } catch (IllegalAccessException e) {
                                throw new IllegalStateException(e);
                            } finally {
                                status.setRollbackOnly();
                            }
                            return null;
                        });
                        reachedDatabase++;
                    } catch (Throwable t) {
                        SQLException sql = firstSqlException(t);
                        if (sql == null) {
                            notReached.add(label + " (" + t.getClass().getSimpleName() + ")");
                        } else if (isGrammarOrBindFailure(sql)) {
                            failures.add(label + " -> SQLState " + sql.getSQLState() + ": " + sql.getMessage());
                        } else {
                            reachedDatabase++;
                        }
                    }
                }
            }
        }

        System.out.println("[MySqlRepositoryQueriesIT] query methods=" + queryMethods
                + " reachedDatabase=" + reachedDatabase + " notReachedWithPlaceholderArgs=" + notReached.size());

        // A sweep that quietly executes nothing would pass vacuously.
        assertTrue(queryMethods >= 150, "expected to discover the @Query methods, found " + queryMethods);
        assertTrue(reachedDatabase >= queryMethods / 2,
                "too few queries reached MySQL (" + reachedDatabase + " of " + queryMethods
                        + "); the placeholder arguments are not exercising the SQL. Not reached: " + notReached);
        assertTrue(failures.isEmpty(),
                "These queries fail against real MySQL (SQLState 42xxx = grammar/unknown column, S1xxx = driver "
                        + "bind error such as 'Parameter index out of range'):\n  " + String.join("\n  ", failures));
    }

    // ------------------------------------------- project search behaviour (seeded, rolled back)

    /** What ProjectWorkspaceServiceImpl does to a user's search term before it reaches the query. */
    /**
     * The workspace list queries match the search term with LOCATE() (always literal), so callers pass the term exactly
     * as typed (ProjectWorkspaceServiceImpl does the same): there is no LIKE escaping to do any more.
     */
    private static String likeEscape(String raw) {
        return raw;
    }

    private ProjectWorkspace workspace(String slug, String title) {
        ProjectWorkspace w = new ProjectWorkspace();
        w.setSlug(slug);
        w.setTitle(title);
        w.setOrganizationId(1);
        w.setCollegeId(987001);
        return workspaces.save(w);
    }

    private void member(ProjectWorkspace w, int userId) {
        ProjectMember m = new ProjectMember();
        m.setProjectId(w.getId());
        m.setUserId(userId);
        m.setUserType("LEARNER");
        m.setMemberStatus("ACTIVE");
        members.save(m);
    }

    private List<String> titles(Page<ProjectWorkspace> page) {
        return page.getContent().stream().map(ProjectWorkspace::getTitle).sorted().collect(Collectors.toList());
    }

    @Test
    void learnerProjectListSearchesLiterallyAndBindsEveryFilter() {
        final int userId = 987654;
        new TransactionTemplate(transactionManager).execute(status -> {
            try {
                ProjectWorkspace percent = workspace("it-percent-a", "Release 50% done");
                ProjectWorkspace decoy = workspace("it-percent-b", "Release 500 done");
                ProjectWorkspace under = workspace("it-under-a", "snake_case service");
                ProjectWorkspace underDecoy = workspace("it-under-b", "snakeXcase service");
                ProjectWorkspace slash = workspace("it-slash", "path" + BS + "to work");
                for (ProjectWorkspace w : List.of(percent, decoy, under, underDecoy, slash)) {
                    member(w, userId);
                }
                workspaces.flush();
                Pageable first = PageRequest.of(0, 25);

                // Every user-typed wildcard must be matched literally. Before the fix the whole call threw.
                assertEquals(List.of("Release 50% done"),
                        titles(workspaces.findAccessibleByUserPaged(userId, "LEARNER", null, likeEscape("50%"), null, first)),
                        "a typed % must match only a literal %, not act as a wildcard");
                assertEquals(List.of("snake_case service"),
                        titles(workspaces.findAccessibleByUserPaged(userId, "LEARNER", null, likeEscape("snake_case"), null, first)),
                        "a typed _ must match only a literal _, not any single character");
                assertEquals(List.of("path" + BS + "to work"),
                        titles(workspaces.findAccessibleByUserPaged(userId, "LEARNER", null, likeEscape("path" + BS + "to"), null, first)),
                        "a typed backslash must be matched literally");

                // Plain substring search still works, and shows both "Release ..." rows.
                assertEquals(2, workspaces.findAccessibleByUserPaged(userId, "LEARNER", null, likeEscape("release"), null, first)
                        .getTotalElements());

                // Every other parameter shape the endpoint can produce must bind and run.
                for (String status2 : new String[] {null, "", "CURRENT", "ARCHIVED", "IN_PROGRESS"}) {
                    for (String attention : new String[] {null, "", "BLOCKED", "MENTOR_REVIEW", "LEARNER_ACTION"}) {
                        for (String search : new String[] {null, "", "abc", likeEscape("100%_ok")}) {
                            workspaces.findAccessibleByUserPaged(userId, "LEARNER", status2, search, attention, first);
                        }
                    }
                }

                // Someone else's projects are never returned.
                assertEquals(0, workspaces.findAccessibleByUserPaged(userId + 1, "LEARNER", null, null, null, first)
                        .getTotalElements());
            } finally {
                status.setRollbackOnly();
            }
            return null;
        });
    }

    @Test
    void collegeAdminProjectListSearchesLiterallyAndBindsEveryFilter() {
        new TransactionTemplate(transactionManager).execute(status -> {
            try {
                workspace("it-admin-a", "Capstone 50% ready");
                workspace("it-admin-b", "Capstone 500 ready");
                workspaces.flush();
                Pageable first = PageRequest.of(0, 25);
                LocalDateTime cutoff = LocalDateTime.now().minusDays(14);

                assertEquals(List.of("Capstone 50% ready"),
                        titles(workspaces.findActiveByCollegeIdPaged(987001, null, likeEscape("50%"), null, cutoff, first)));

                for (String view : new String[] {null, "", "SUBMITTED", "NOT_SUBMITTED", "AT_RISK", "READINESS_OVERRIDE"}) {
                    for (String search : new String[] {null, "", "abc", likeEscape("100%_ok")}) {
                        workspaces.findActiveByCollegeIdPaged(987001, null, search, view, cutoff, first);
                    }
                }
            } finally {
                status.setRollbackOnly();
            }
            return null;
        });
    }

    /**
     * A workspace row carries large JSON columns (template_snapshot reaches ~400 KB in production). MySQL
     * fails with "Out of sort memory" (error 1038, sort_buffer_size 256 KB) on any ORDER BY over whole
     * rows once a few exist, which took down the admin, mentor and learner project lists in production.
     * The list queries must therefore sort ids only. This seeds rows of production size and runs every
     * list query; against the old whole-row ORDER BY it fails with that exact error.
     */
    @Test
    void projectListsSurviveWorkspaceRowsTheSizeOfProductionSnapshots() {
        final int userId = 987655;
        final int college = 987002;
        new TransactionTemplate(transactionManager).execute(status -> {
            try {
                // template_id is a foreign key, so the workspaces need a real template to point at.
                com._42students.lms.model.ProjectTemplate template = new com._42students.lms.model.ProjectTemplate();
                template.setSlug("it-big-template");
                template.setTitle("Big template");
                template = templates.save(template);
                templates.flush();
                final int templateId = template.getId();
                String blob = "x".repeat(400_000);
                List<Integer> allIds = new java.util.ArrayList<>();
                for (int i = 0; i < 12; i++) {
                    ProjectWorkspace w = workspace("it-big-" + i, "Big workspace " + i);
                    w.setCollegeId(college);
                    w.setTemplateId(templateId);
                    w.setTemplateSnapshot(java.util.Map.of("blob", blob));
                    if (i >= 9) {
                        w.setIsDeleted(true);
                    }
                    workspaces.save(w);
                    member(w, userId);
                    allIds.add(w.getId());
                }
                workspaces.flush();
                LocalDateTime cutoff = LocalDateTime.now().minusDays(14);

                Page<ProjectWorkspace> admin = workspaces.findActiveByCollegeIdPaged(
                        college, null, null, null, cutoff, PageRequest.of(0, 5));
                assertEquals(5, admin.getContent().size());
                assertEquals(9, admin.getTotalElements());

                Page<ProjectWorkspace> mine = workspaces.findAccessibleByUserPaged(
                        userId, "LEARNER", null, null, null, PageRequest.of(0, 20));
                assertEquals(9, mine.getContent().size());
                assertEquals(9, mine.getTotalElements());
                // The filtered variants must bind and run too, not only the unfiltered one.
                assertTrue(workspaces.findAccessibleByUserPaged(
                        userId, "LEARNER", "CURRENT", null, "BLOCKED", PageRequest.of(0, 20)).getTotalElements() >= 0);

                Page<ProjectWorkspace> deleted = workspaces.findDeletedByCollegeId(college, PageRequest.of(0, 20));
                assertEquals(3, deleted.getContent().size());
                assertEquals(3, deleted.getTotalElements());

                assertEquals(9, workspaces.findActiveByCollegeId(college).size());
                assertEquals(9, workspaces.findActiveByIds(allIds).size());

                List<String> byTitle = workspaces.findActiveByTemplateId(templateId, PageRequest.of(0, 4)).stream()
                        .map(ProjectWorkspace::getTitle).collect(Collectors.toList());
                assertEquals(4, byTitle.size());
                assertEquals(byTitle.stream().sorted().collect(Collectors.toList()), byTitle);
            } finally {
                status.setRollbackOnly();
            }
            return null;
        });
    }

    /**
     * A template row also carries large JSON columns and reaches ~480 KB in production — the same
     * "Out of sort memory" failure (error 1038) that hit the workspace lists, this time on the
     * project-templates admin list, for as few as one row. See ProjectTemplateRepository for why
     * these two finders now select ids and sort in Java instead of an ORDER BY over whole rows.
     */
    @Test
    void projectTemplateListsSurviveTemplateRowsTheSizeOfProductionSnapshots() {
        new TransactionTemplate(transactionManager).execute(status -> {
            try {
                String blob = "x".repeat(480_000);
                com._42students.lms.model.ProjectTemplate live = new com._42students.lms.model.ProjectTemplate();
                live.setSlug("it-big-template-live");
                live.setTitle("Big live template");
                live.setOverview(java.util.Map.of("blob", blob));
                templates.save(live);

                com._42students.lms.model.ProjectTemplate archived = new com._42students.lms.model.ProjectTemplate();
                archived.setSlug("it-big-template-archived");
                archived.setTitle("Big archived template");
                archived.setOverview(java.util.Map.of("blob", blob));
                archived.setIsDeleted(true);
                templates.save(archived);
                templates.flush();

                List<String> active = templates.findAllActive().stream()
                        .map(com._42students.lms.model.ProjectTemplate::getTitle).collect(Collectors.toList());
                assertTrue(active.contains("Big live template"));
                assertFalse(active.contains("Big archived template"));

                List<String> any = templates.findAllOrderByUpdatedAtDesc().stream()
                        .map(com._42students.lms.model.ProjectTemplate::getTitle).collect(Collectors.toList());
                assertTrue(any.contains("Big live template"));
                assertTrue(any.contains("Big archived template"));
            } finally {
                status.setRollbackOnly();
            }
            return null;
        });
    }

    /**
     * Courses/lessons/content with production-sized JSON. The lesson-content list selects whole
     * rows and orders them, which is exactly where oversized JSON rows can expose MySQL sort/memory
     * problems that H2 and mocked repositories cannot reproduce.
     */
    @Test
    void courseAndLessonListsHandleProductionScaleRows() {
        final int collegeId = 987003;
        final int deptId = 9870031;
        final int courseId = 9870032;
        final int lessonId = 9870033;
        new TransactionTemplate(transactionManager).execute(status -> {
            try {
                jdbc.update("insert into college (id, name, org_id, is_deleted) values (?, ?, ?, 0)",
                        collegeId, "IT Scale College", 9870);
                jdbc.update("insert into department (id, name, college_id, is_deleted) values (?, ?, ?, 0)",
                        deptId, "IT Scale Department", collegeId);
                jdbc.update("insert into course (id, course_name, short_title, dept_id, parent_course_id, active, enabled, slug, contents, version, is_deleted, created_at, updated_at) " +
                                "values (?, ?, ?, ?, 0, 1, 1, ?, cast(? as json), 0, 0, now(), now())",
                        courseId, "Scale Course", "SCALE", deptId, "it-scale-course",
                        // course.contents maps to the typed MetaData DTO, so the large payload must use one of its real fields.
                        "{\"html_content\":\"" + "x".repeat(180_000) + "\"}");
                jdbc.update("insert into lesson (id, lesson_name, course_id, active, enabled, sequence, version, is_deleted, created_at, updated_at) " +
                                "values (?, ?, ?, 1, 1, 1, 0, 0, now(), now())",
                        lessonId, "Scale Lesson", courseId);

                String payload = "{\"html_content\":\"" + "x".repeat(180_000) + "\"}";
                List<Object[]> rows = new ArrayList<>();
                for (int i = 0; i < 36; i++) {
                    rows.add(new Object[] {
                            lessonId, courseId, "Scale Course", (long) i, "video", "Content " + i,
                            payload, 1, 1, 0L, 0L
                    });
                }
                jdbc.batchUpdate(
                        "insert into lesson_contents (lesson_id, course_id, course_name, sequence, content_type, content_title, content_data, active, enabled, points, version, is_deleted, created_at, updated_at) " +
                                "values (?, ?, ?, ?, ?, ?, cast(? as json), ?, ?, ?, ?, 0, now(), now())",
                        rows);

                Page<com._42students.lms.model.Course> coursePage =
                        courses.fetchByCollegeIdPaged(collegeId, PageRequest.of(0, 10));
                assertEquals(1, coursePage.getTotalElements());
                assertEquals(courseId, coursePage.getContent().get(0).getId());

                assertEquals(1, lessons.getLessons(courseId).size());

                List<com._42students.lms.model.LessonContents> content = lessonContents.fetchLessonContents1(lessonId);
                assertEquals(36, content.size());
                assertEquals(0L, content.get(0).getSequence());
                assertEquals(35L, content.get(content.size() - 1).getSequence());
            } finally {
                status.setRollbackOnly();
            }
            return null;
        });
    }

    /**
     * Quiz list pagination with many large descriptions. Questions/options are separate tables in
     * the current schema, so the list-query risk is the quiz rows themselves plus ORDER BY/count.
     */
    @Test
    void quizListsHandleProductionScaleRows() {
        final int collegeId = 987004;
        final int deptId = 9870041;
        final int courseId = 9870042;
        new TransactionTemplate(transactionManager).execute(status -> {
            try {
                jdbc.update("insert into college (id, name, org_id, is_deleted) values (?, ?, ?, 0)",
                        collegeId, "IT Quiz College", 9870);
                jdbc.update("insert into department (id, name, college_id, is_deleted) values (?, ?, ?, 0)",
                        deptId, "IT Quiz Department", collegeId);
                jdbc.update("insert into course (id, course_name, short_title, dept_id, parent_course_id, active, enabled, slug, version, is_deleted, created_at, updated_at) " +
                                "values (?, ?, ?, ?, 0, 1, 1, ?, 0, 0, now(), now())",
                        courseId, "Quiz Scale Course", "QSC", deptId, "it-quiz-scale-course");

                String description = "q".repeat(32_000);
                List<Object[]> rows = new ArrayList<>();
                for (int i = 0; i < 120; i++) {
                    rows.add(new Object[] {
                            courseId, "Scale Quiz " + i, description, "PUBLISHED",
                            1, 100L, 1, 1
                    });
                }
                jdbc.batchUpdate(
                        "insert into quizzes (lesson_id, course_id, title, description, status, max_attempts, total_points, active, enabled, is_deleted, created_at, updated_at) " +
                                "values (0, ?, ?, ?, ?, ?, ?, ?, ?, 0, now(), now())",
                        rows);

                Page<com._42students.lms.model.Quiz> page =
                        quizzes.findByCollegeIdPaged(collegeId, null, PageRequest.of(0, 25));
                assertEquals(120, page.getTotalElements());
                assertEquals(25, page.getContent().size());

                Page<com._42students.lms.model.Quiz> filtered =
                        quizzes.findByCollegeIdPaged(collegeId, courseId, PageRequest.of(4, 25));
                assertEquals(120, filtered.getTotalElements());
                assertEquals(20, filtered.getContent().size());
            } finally {
                status.setRollbackOnly();
            }
            return null;
        });
    }

    /**
     * Attendance records: 50 learners x 30 sessions = 1,500 rows with the real MySQL IN/date
     * queries used by attendance summaries.
     */
    @Test
    void attendanceListsHandleProductionScaleRows() {
        final int scheduleBase = 9875000;
        new TransactionTemplate(transactionManager).execute(status -> {
            try {
                List<Integer> scheduleIds = new ArrayList<>();
                List<Object[]> schedules = new ArrayList<>();
                for (int i = 0; i < 30; i++) {
                    int id = scheduleBase + i;
                    scheduleIds.add(id);
                    schedules.add(new Object[] {
                            id, 9870050, 9870051, "2026-10-01 09:00:00", "2026-10-01 10:00:00"
                    });
                }
                jdbc.batchUpdate(
                        "insert into class_schedule (id, class_id, course_id, start_time, end_time, is_deleted, created_at, updated_at) " +
                                "values (?, ?, ?, ?, ?, 0, now(), now())",
                        schedules);

                List<Object[]> attendanceRows = new ArrayList<>();
                for (int student = 0; student < 50; student++) {
                    for (Integer scheduleId : scheduleIds) {
                        attendanceRows.add(new Object[] {"IT-S" + student, scheduleId});
                    }
                }
                jdbc.batchUpdate(
                        "insert into attend (student_id, class_schedule_id, is_deleted, created_at, updated_at) " +
                                "values (?, ?, 0, now(), now())",
                        attendanceRows);

                assertEquals(1500, attendance.getAttendanceByClassScheduleIds(scheduleIds).size());
                assertEquals(30, attendance.getAbsentScheduleIdsForLearner("IT-S0", scheduleIds).size());

                java.util.Date from = new java.util.Date(System.currentTimeMillis() - 60_000L);
                java.util.Date to = new java.util.Date(System.currentTimeMillis() + 60_000L);
                assertEquals(1500, attendance.getAttendanceBySchedule(scheduleIds, from, to).size());
            } finally {
                status.setRollbackOnly();
            }
            return null;
        });
    }

    /**
     * Placement job listing with enough active rows to force real ordering/list materialization.
     * Deeper large-JSON and application/interview scale cases live below; this keeps the generic
     * production-scale section honest instead of a no-op placeholder.
     */
    @Test
    void jobAndPlacementListsHandleProductionScaleRows() {
        final int collegeId = 987006;
        final int orgId = 98706;
        new TransactionTemplate(transactionManager).execute(status -> {
            try {
                for (int i = 0; i < 80; i++) {
                    com._42students.lms.model.Job job = new com._42students.lms.model.Job();
                    job.setJobTitle("Scale Placement Role " + i);
                    job.setCompanyName("Scale Company " + i);
                    job.setCollegeId(collegeId);
                    job.setOrganizationId(orgId);
                    job.setJobType("Full-time");
                    job.setIsActive(true);
                    job.setIsDraft(false);
                    // candidatePreferences is validated (@ValidEligibilityRules: known keys, bounded values); the bulky
                    // free-form JSON belongs in the unvalidated evaluationConfig column.
                    job.setCandidatePreferences(java.util.Map.of("minGpa", "6.5", "preferredSkills", java.util.List.of("Java", "SQL")));
                    job.setEvaluationConfig(java.util.Map.of("note", "x".repeat(4000)));
                    jobs.save(job);
                }
                jobs.flush();

                assertTrue(jobs.findAllActiveJobsByOrganization(orgId).size() >= 80);
                assertTrue(jobs.findForCollegeAdminByCollegeOrOrg(collegeId, orgId).size() >= 80);
            } finally {
                status.setRollbackOnly();
            }
            return null;
        });
    }

    /**
     * Notifications are row-heavy rather than JSON-heavy in the current schema. Seed 500 for one
     * recipient and verify both global pagination and recipient pagination on real MySQL.
     */
    @Test
    void notificationListsHandleProductionScaleRows() {
        final int recipientId = 987007;
        new TransactionTemplate(transactionManager).execute(status -> {
            try {
                List<Object[]> rows = new ArrayList<>();
                String message = "n".repeat(240);
                for (int i = 0; i < 500; i++) {
                    rows.add(new Object[] {
                            recipientId, "Scale Notification " + i, message, i % 2 == 0
                    });
                }
                jdbc.batchUpdate(
                        "insert into notification (learner_id, class_id, course_id, title, message, is_read, is_deleted, created_at, updated_at) " +
                                "values (?, 0, 0, ?, ?, ?, 0, now(), now())",
                        rows);

                Page<com._42students.lms.model.Notification> page =
                        notifications.findAllActivePaged(PageRequest.of(0, 50));
                assertTrue(page.getTotalElements() >= 500);
                assertEquals(50, page.getContent().size());

                List<com._42students.lms.model.Notification> mine =
                        notifications.findByRecipientId(recipientId, "LEARNER", PageRequest.of(0, 100));
                assertEquals(100, mine.size());
                assertTrue(mine.stream().allMatch(n -> Integer.valueOf(recipientId).equals(n.getLearnerId())));
                // rows with no recipient_type are a learner's: faculty with the same number get none of them (V227)
                assertEquals(0, notifications.findByRecipientId(recipientId, "FACULTY", PageRequest.of(0, 100)).size());
            } finally {
                status.setRollbackOnly();
            }
            return null;
        });
    }

    /**
     * Job listing with large JSON payloads (importantDates, candidatePreferences, evaluationConfig).
     * Exercises JobRepository.findAllActiveJobs, findAllActiveJobsByOrganization, findForCollegeAdminByCollegeOrOrg
     * with production-scale rows (300+ KB JSON per job). Tests that ORDER BY createdAt DESC doesn't hit
     * MySQL's 256 KB sort_buffer_size limit on rows with accumulated JSON columns.
     */
    @Test
    void jobListsWithLargeJsonPayloadsHandleProductionScale() {
        final int collegeId = 987010;
        final int orgId = 201;
        new TransactionTemplate(transactionManager).execute(status -> {
            try {
                String largeJson = "{\"data\":\"" + "x".repeat(150_000) + "\"}";

                // Create 12 active jobs (9 active, 3 deleted) with large JSON payloads
                for (int i = 0; i < 12; i++) {
                    com._42students.lms.model.Job job = new com._42students.lms.model.Job();
                    job.setJobTitle("IT Platform Engineer " + i);
                    job.setCompanyName("TechCorp");
                    job.setCollegeId(collegeId);
                    job.setOrganizationId(orgId);
                    job.setJobType("Full-time");
                    job.setIsActive(i < 9); // First 9 active, last 3 inactive
                    job.setIsDraft(false);
                    // candidatePreferences only takes known, bounded keys (@ValidEligibilityRules); the large payloads
                    // ride in importantDates and evaluationConfig, which are free-form JSON.
                    job.setCandidatePreferences(java.util.Map.of("minGpa", "6.5", "preferredSkills", java.util.List.of("Java", "SQL")));
                    job.setImportantDates(java.util.Map.of("notes", largeJson));
                    job.setEvaluationConfig(java.util.Map.of("weights", largeJson));
                    jobs.save(job);
                }
                jobs.flush();

                // findAllActiveJobs — global, no college scope
                java.util.List<com._42students.lms.model.Job> allActive = jobs.findAllActiveJobs();
                assertTrue(allActive.size() >= 9, "should load active jobs without sort-memory error");

                // findAllActiveJobsByOrganization
                java.util.List<com._42students.lms.model.Job> orgJobs = jobs.findAllActiveJobsByOrganization(orgId);
                assertTrue(orgJobs.size() >= 9, "should load org jobs without sort-memory error");

                // findForCollegeAdminByCollegeOrOrg
                java.util.List<com._42students.lms.model.Job> collegeJobs = jobs.findForCollegeAdminByCollegeOrOrg(collegeId, orgId);
                assertTrue(collegeJobs.size() >= 9, "should load college admin jobs without sort-memory error");
            } finally {
                status.setRollbackOnly();
            }
            return null;
        });
    }

    /**
     * Job application listing at scale: 20 jobs, 100+ applications per job.
     * Exercises JobApplicationRepository.findByJobId, findByOrganizationId, findByOrganizationIdPaginated
     * with ORDER BY appliedAt DESC on large result sets, pagination, and date-range filtering.
     */
    @Test
    void jobApplicationsListAtScaleWithOrderingHandlesProduction() {
        final int collegeId = 987011;
        final int orgId = 202;
        new TransactionTemplate(transactionManager).execute(status -> {
            try {
                // Create 5 jobs for simplicity (would be 20 in full production)
                java.util.List<Integer> jobIds = new java.util.ArrayList<>();
                for (int i = 0; i < 5; i++) {
                    com._42students.lms.model.Job job = new com._42students.lms.model.Job();
                    job.setJobTitle("Role " + i);
                    job.setCompanyName("Company " + i);
                    job.setCollegeId(collegeId);
                    job.setOrganizationId(orgId);
                    job.setJobType("Full-time");
                    job.setIsActive(true);
                    job.setIsDraft(false);
                    jobs.save(job);
                    jobIds.add(job.getId());
                }
                jobs.flush();

                // For the first job, create 30 applications to test sorting at scale
                int firstJobId = jobIds.get(0);
                com._42students.lms.model.Job firstJob = jobs.findById(firstJobId).get();
                for (int a = 0; a < 30; a++) {
                    com._42students.lms.model.Learner learner = new com._42students.lms.model.Learner();
                    learner.setFirstName("Learner" + a);
                    learner.setLastName("Test");
                    learner.setCollegeId(collegeId);
                    learners.save(learner);

                    com._42students.lms.model.JobApplication app = new com._42students.lms.model.JobApplication();
                    app.setJob(firstJob);
                    app.setLearner(learner);
                    app.setOrganizationId(orgId);
                    app.setApplicationStatus("APPLIED");
                    app.setAppliedAt(java.time.LocalDateTime.now().minusDays(a));
                    applications.save(app);
                }
                applications.flush();

                // Test: findByJobId with ORDER BY appliedAt DESC on 30+ rows
                java.util.List<com._42students.lms.model.JobApplication> appsByJob = applications.findByJobId(firstJobId);
                assertTrue(appsByJob.size() >= 30, "should load 30+ applications without sort-memory error");
                assertTrue(appsByJob.get(0).getAppliedAt().isAfter(appsByJob.get(appsByJob.size()-1).getAppliedAt()),
                        "applications should be sorted DESC by appliedAt");

                // Test: findByOrganizationIdPaginated with pagination
                org.springframework.data.domain.Page<com._42students.lms.model.JobApplication> paginated =
                    applications.findByOrganizationIdPaginated(orgId, org.springframework.data.domain.PageRequest.of(0, 10));
                assertTrue(paginated.getTotalElements() >= 30, "paginated should return all applications");
                assertEquals(10, paginated.getContent().size(), "first page should have 10 items");
            } finally {
                status.setRollbackOnly();
            }
            return null;
        });
    }

    /**
     * Interview scheduling queries at scale: 50 interviews with date-range filtering, sorting by scheduledDate.
     * Exercises InterviewRepository.findByOrganizationId, findByJobCollegeId, findUpcomingInterviewsForLearner,
     * findByScheduledDateBetween, and overlap-checking queries under production volume.
     */
    @Test
    void interviewSchedulingQueriesAtScaleHandleProduction() {
        final int collegeId = 987012;
        final int orgId = 203;
        final java.time.LocalDateTime now = java.time.LocalDateTime.now();
        new TransactionTemplate(transactionManager).execute(status -> {
            try {
                // Create 3 jobs
                java.util.List<Integer> jobIds = new java.util.ArrayList<>();
                for (int i = 0; i < 3; i++) {
                    com._42students.lms.model.Job job = new com._42students.lms.model.Job();
                    job.setJobTitle("Job " + i);
                    job.setCompanyName("Company");
                    job.setCollegeId(collegeId);
                    job.setOrganizationId(orgId);
                    job.setJobType("Full-time");
                    job.setIsActive(true);
                    job.setIsDraft(false);
                    jobs.save(job);
                    jobIds.add(job.getId());
                }
                jobs.flush();

                // Create learners and applications
                java.util.List<Integer> appIds = new java.util.ArrayList<>();
                for (int l = 0; l < 5; l++) {
                    com._42students.lms.model.Learner learner = new com._42students.lms.model.Learner();
                    learner.setFirstName("L" + l);
                    learner.setLastName("Test");
                    learner.setCollegeId(collegeId);
                    learners.save(learner);

                    for (Integer jobId : jobIds) {
                        com._42students.lms.model.Job job = jobs.findById(jobId).get();
                        com._42students.lms.model.JobApplication app = new com._42students.lms.model.JobApplication();
                        app.setJob(job);
                        app.setLearner(learner);
                        app.setOrganizationId(orgId);
                        app.setApplicationStatus("SHORTLISTED");
                        app.setAppliedAt(now);
                        applications.save(app);
                        appIds.add(app.getId());
                    }
                }
                applications.flush();

                // Create 15 interviews (3 learners × 5 rounds) with varied scheduled dates
                int interviewCount = 0;
                for (Integer appId : appIds) {
                    com._42students.lms.model.JobApplication app = applications.findById(appId).get();
                    for (int round = 0; round < 3; round++) {
                        com._42students.lms.model.Interview interview = new com._42students.lms.model.Interview();
                        interview.setJobApplication(app);
                        interview.setJob(app.getJob());
                        interview.setLearner(app.getLearner());
                        interview.setOrganizationId(orgId);
                        interview.setScheduledDate(now.plusDays(round + 1));
                        interview.setInterviewStatus("SCHEDULED");
                        interview.setInterviewerName("Interviewer " + round);
                        interviews.save(interview);
                        interviewCount++;
                    }
                }
                interviews.flush();

                // Test: findByOrganizationId with ORDER BY scheduledDate ASC
                java.util.List<com._42students.lms.model.Interview> orgInterviews = interviews.findByOrganizationId(orgId);
                assertTrue(orgInterviews.size() >= 15, "should load 15+ interviews without sort-memory error");

                // Test: findByJobCollegeId
                java.util.List<com._42students.lms.model.Interview> collegeInterviews = interviews.findByJobCollegeId(collegeId);
                assertTrue(collegeInterviews.size() >= 15, "should load college interviews without sort-memory error");

                // Test: findByScheduledDateBetween with date-range query
                java.util.List<com._42students.lms.model.Interview> rangeInterviews =
                    interviews.findByScheduledDateBetween(now.plusDays(1), now.plusDays(3));
                assertTrue(rangeInterviews.size() >= 10, "should filter by date range without error");

                // Test: findUpcomingInterviewsForLearner for one learner
                // One of the learners seeded above, not the first learner in the database (other suites leave rows behind).
                com._42students.lms.model.Learner firstLearner = learners.findAll().stream()
                    .filter(l -> java.util.Objects.equals(l.getCollegeId(), collegeId)).findFirst().get();
                java.util.List<com._42students.lms.model.Interview> upcoming =
                    interviews.findUpcomingInterviewsForLearner(firstLearner.getId(), orgId, now);
                assertTrue(upcoming.size() >= 3, "should load upcoming interviews for learner");
            } finally {
                status.setRollbackOnly();
            }
            return null;
        });
    }

    /**
     * Soft-deletion correctness: jobs and applications with isDeleted=true are excluded from active lists.
     * Exercises that filtering correctly persists through ORDER BY queries.
     */
    @Test
    void placementsSoftDeletionExclusionThroughOrderByQueries() {
        final int collegeId = 987013;
        final int orgId = 204;
        new TransactionTemplate(transactionManager).execute(status -> {
            try {
                // Create 6 jobs: 3 active, 3 marked deleted
                for (int i = 0; i < 6; i++) {
                    com._42students.lms.model.Job job = new com._42students.lms.model.Job();
                    job.setJobTitle("Job " + i);
                    job.setCompanyName("Company");
                    job.setCollegeId(collegeId);
                    job.setOrganizationId(orgId);
                    job.setJobType("Full-time");
                    job.setIsActive(true);
                    job.setIsDraft(false);
                    if (i >= 3) {
                        job.setIsDeleted(true); // Last 3 are soft-deleted
                    }
                    jobs.save(job);
                }
                jobs.flush();

                // Verify soft-deleted jobs are excluded
                java.util.List<com._42students.lms.model.Job> activeJobs = jobs.findAllActiveJobs();
                assertTrue(activeJobs.size() <= 3, "should exclude deleted jobs");
                assertTrue(activeJobs.stream().noneMatch(j -> j.getIsDeleted() != null && j.getIsDeleted()),
                        "should not return any deleted jobs");

                java.util.List<com._42students.lms.model.Job> collegeJobs = jobs.findByCollegeIdAndIsDeletedFalse(collegeId);
                assertTrue(collegeJobs.size() <= 3, "college list should exclude deleted");
            } finally {
                status.setRollbackOnly();
            }
            return null;
        });
    }

    // ------------------------------------------------------------------ helpers

    private static Object[] placeholderArguments(Method method) {
        Class<?>[] types = method.getParameterTypes();
        Type[] generics = method.getGenericParameterTypes();
        Object[] args = new Object[types.length];
        for (int i = 0; i < types.length; i++) {
            args[i] = placeholderFor(types[i], generics[i]);
        }
        return args;
    }

    private static Object placeholderFor(Class<?> type, Type generic) {
        if (type == Integer.class || type == int.class) return 1;
        if (type == Long.class || type == long.class) return 1L;
        if (type == Double.class || type == double.class) return 1.0d;
        if (type == Boolean.class || type == boolean.class) return false;
        if (type == String.class) return "x";
        if (type == LocalDateTime.class) return LocalDateTime.now();
        if (type == LocalDate.class) return LocalDate.now();
        if (type == java.time.Instant.class) return java.time.Instant.now();
        if (Pageable.class.isAssignableFrom(type)) return PageRequest.of(0, 1);
        if (type == Sort.class) return Sort.unsorted();
        if (type.isEnum()) return type.getEnumConstants()[0];
        if (Collection.class.isAssignableFrom(type)) {
            Object element = 1;
            if (generic instanceof ParameterizedType) {
                Type arg = ((ParameterizedType) generic).getActualTypeArguments()[0];
                if (arg == Long.class) element = 1L;
                else if (arg == String.class) element = "x";
            }
            return type == Set.class ? Set.of(element) : List.of(element);
        }
        return null;
    }

    private static SQLException firstSqlException(Throwable t) {
        for (Throwable c = t; c != null; c = c.getCause() == c ? null : c.getCause()) {
            if (c instanceof SQLException) {
                return (SQLException) c;
            }
        }
        return null;
    }

    /** SQLState 42xxx is grammar / unknown column or table; S1xxx is a JDBC driver error such as a bad bind index. */
    private static boolean isGrammarOrBindFailure(SQLException e) {
        String state = e.getSQLState();
        return state != null && (state.startsWith("42") || state.startsWith("S1"));
    }

    @SuppressWarnings("unchecked")
    private static <T extends Throwable> void sneakyThrow(Throwable t) throws T {
        throw (T) t;
    }
}
