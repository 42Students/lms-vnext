package com._42students.lms.repository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.lang.reflect.Method;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Executes the exact canonical current-course-audience SQL. These cases are intentionally
 * adversarial because this predicate gates learner access AND every admin content target picker.
 */
class CurrentCourseAudienceSqlTest {
    private NamedParameterJdbcTemplate jdbc;
    private Query listQuery;
    private Query countQuery;

    @BeforeEach
    void setUp() throws Exception {
        DriverManagerDataSource ds = new DriverManagerDataSource(
                "jdbc:h2:mem:current_course_audience;MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
        jdbc = new NamedParameterJdbcTemplate(ds);
        jdbc.getJdbcTemplate().execute("DROP ALL OBJECTS");
        sql("CREATE TABLE department (id INT PRIMARY KEY, college_id INT, is_deleted BOOLEAN)");
        sql("CREATE TABLE new_program (id INT PRIMARY KEY, dept_id INT, is_deleted BOOLEAN)");
        sql("CREATE TABLE class (id INT PRIMARY KEY, name VARCHAR(100), program_id INT, batch_id INT, class_type VARCHAR(20), is_deleted BOOLEAN)");
        sql("CREATE TABLE course (id INT PRIMARY KEY, dept_id INT, active BOOLEAN, enabled BOOLEAN, is_deleted BOOLEAN)");
        sql("CREATE TABLE batch (id INT PRIMARY KEY, program_id INT, current_semester INT, status VARCHAR(20))");
        sql("CREATE TABLE semester (id INT PRIMARY KEY, program_id INT, semester_number INT, is_active BOOLEAN, is_deleted BOOLEAN)");
        sql("CREATE TABLE semester_course (id INT PRIMARY KEY, semester_id INT, course_id INT, is_deleted BOOLEAN)");
        sql("CREATE TABLE faculty_teaching_assignment (id INT PRIMARY KEY, class_id INT, course_id INT, is_active BOOLEAN, is_deleted BOOLEAN)");
        sql("CREATE TABLE lms_group (id INT PRIMARY KEY, college_id INT, status VARCHAR(20), is_deleted BOOLEAN)");
        sql("CREATE TABLE elective_slot (id INT PRIMARY KEY, college_id INT, status VARCHAR(20), is_deleted BOOLEAN)");
        sql("CREATE TABLE elective_offering (id INT PRIMARY KEY, slot_id INT, course_id INT, group_id INT, backed_class_id INT, status VARCHAR(20), is_deleted BOOLEAN)");

        sql("INSERT INTO department VALUES (1,10,FALSE),(2,20,FALSE)");
        sql("INSERT INTO new_program VALUES (11,1,FALSE),(21,2,FALSE)");
        sql("INSERT INTO batch VALUES (100,11,3,'ACTIVE'),(101,11,5,'ACTIVE'),(102,11,3,'INACTIVE'),(200,21,3,'ACTIVE')");
        sql("INSERT INTO class VALUES "
                + "(7,'CSE-A',11,100,'SECTION',FALSE),"
                + "(8,'CSE-B',11,101,'SECTION',FALSE),"
                + "(9,'CSE-C',11,102,'SECTION',FALSE),"
                + "(10,'PE-1',11,NULL,'GROUP_BACKED',FALSE),"
                + "(20,'OTHER',21,200,'SECTION',FALSE)");
        sql("INSERT INTO course VALUES "
                + "(501,1,TRUE,TRUE,FALSE),(502,1,TRUE,TRUE,FALSE),"
                + "(503,1,TRUE,TRUE,FALSE),(504,1,TRUE,TRUE,FALSE)");
        sql("INSERT INTO semester VALUES (31,11,3,TRUE,FALSE),(51,11,5,TRUE,FALSE),(231,21,3,TRUE,FALSE)");
        sql("INSERT INTO semester_course VALUES (1,31,501,FALSE),(2,51,502,FALSE),(3,231,501,FALSE)");
        sql("INSERT INTO faculty_teaching_assignment VALUES (1,7,503,TRUE,FALSE),(2,20,501,TRUE,FALSE)");
        sql("INSERT INTO lms_group VALUES (900,10,'ACTIVE',FALSE),(901,20,'ACTIVE',FALSE)");
        sql("INSERT INTO elective_slot VALUES (800,10,'ACTIVE',FALSE),(801,20,'ACTIVE',FALSE)");
        sql("INSERT INTO elective_offering VALUES "
                + "(700,800,504,900,10,'ACTIVE',FALSE),"
                + "(701,801,504,901,10,'ACTIVE',FALSE)");

        Method list = _ClassRepository.class.getMethod("findCurrentEligibleClassesForCourse", int.class);
        listQuery = list.getAnnotation(Query.class);
        Method count = _ClassRepository.class.getMethod("countCurrentEligibleClassForCourse", int.class, int.class);
        countQuery = count.getAnnotation(Query.class);
    }

    @Test
    void currentSemesterMappingDoesNotLeakToFutureSemesterOrOtherCollege() {
        assertEquals(List.of(7), ids(listQuery.value(), args(501)));
        assertEquals(1, count(7, 501));
        assertEquals(0, count(8, 501));
        assertEquals(0, count(9, 501)); // inactive batch fails closed
        assertEquals(0, count(20, 501)); // explicit assignment cannot cross the course tenant
    }

    @Test
    void sameProgramFutureSemesterCourseIsNotEligibleForCurrentCohort() {
        assertEquals(0, count(7, 502));
        assertEquals(1, count(8, 502));
    }

    @Test
    void activeTeachingAssignmentIsAnIntentionalOverride() {
        assertEquals(List.of(7), ids(listQuery.value(), args(503)));
        assertEquals(1, count(7, 503));
    }

    @Test
    void deletedOrInactiveAcademicStructuresFailClosed() {
        assertEquals(1, count(7, 501));

        sql("UPDATE course SET active=FALSE WHERE id=501");
        assertEquals(0, count(7, 501));
        sql("UPDATE course SET active=TRUE WHERE id=501");

        sql("UPDATE class SET is_deleted=TRUE WHERE id=7");
        assertEquals(0, count(7, 501));
        sql("UPDATE class SET is_deleted=FALSE WHERE id=7");

        sql("UPDATE new_program SET is_deleted=TRUE WHERE id=11");
        assertEquals(0, count(7, 501));
        sql("UPDATE new_program SET is_deleted=FALSE WHERE id=11");

        sql("UPDATE department SET is_deleted=TRUE WHERE id=1");
        assertEquals(0, count(7, 501));
        sql("UPDATE department SET is_deleted=FALSE WHERE id=1");

        sql("UPDATE course SET is_deleted=TRUE WHERE id=501");
        assertEquals(0, count(7, 501));
    }

    @Test
    void liveElectiveBackedClassIsEligibleAndArchiveRevokesCurrentTargeting() {
        assertEquals(List.of(10), ids(listQuery.value(), args(504)));
        assertEquals(1, count(10, 504));
        sql("UPDATE elective_offering SET status='ARCHIVED' WHERE id=700");
        // Offering 701 remains ACTIVE but is wired to another college's group/slot.
        assertEquals(0, count(10, 504));
    }

    private int count(int classId, int courseId) {
        return jdbc.queryForObject(countQuery.value(),
                new MapSqlParameterSource("classId", classId).addValue("courseId", courseId),
                Integer.class);
    }

    private MapSqlParameterSource args(int courseId) {
        return new MapSqlParameterSource("courseId", courseId);
    }

    private List<Integer> ids(String query, MapSqlParameterSource args) {
        return jdbc.queryForList(query, args).stream()
                .map(row -> ((Number) row.get("ID")).intValue())
                .collect(Collectors.toList());
    }

    private void sql(String statement) {
        jdbc.getJdbcTemplate().execute(statement);
    }
}
