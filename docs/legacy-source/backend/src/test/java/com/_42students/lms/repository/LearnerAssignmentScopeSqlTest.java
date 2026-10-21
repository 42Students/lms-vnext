package com._42students.lms.repository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.lang.reflect.Method;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Exact native-query contract for learner All Assignments current audience + pagination counts. */
class LearnerAssignmentScopeSqlTest {
    private NamedParameterJdbcTemplate jdbc;
    private Query paged;
    private Query unpaged;

    @BeforeEach
    void setUp() throws Exception {
        DriverManagerDataSource dataSource = new DriverManagerDataSource(
                "jdbc:h2:mem:assignment_scope;MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
        jdbc = new NamedParameterJdbcTemplate(dataSource);
        sql("DROP ALL OBJECTS");
        sql("CREATE TABLE department (id INT PRIMARY KEY, college_id INT, is_deleted BOOLEAN)");
        sql("CREATE TABLE new_program (id INT PRIMARY KEY, dept_id INT, is_deleted BOOLEAN)");
        sql("CREATE TABLE class (id INT PRIMARY KEY, program_id INT, batch_id INT, class_type VARCHAR(20), is_deleted BOOLEAN)");
        sql("CREATE TABLE course (id INT PRIMARY KEY, dept_id INT, active BOOLEAN, enabled BOOLEAN, is_deleted BOOLEAN)");
        sql("CREATE TABLE batch (id INT PRIMARY KEY, program_id INT, current_semester INT, status VARCHAR(20))");
        sql("CREATE TABLE semester (id INT PRIMARY KEY, program_id INT, semester_number INT, is_active BOOLEAN, is_deleted BOOLEAN)");
        sql("CREATE TABLE semester_course (id INT PRIMARY KEY, semester_id INT, course_id INT, is_deleted BOOLEAN)");
        sql("CREATE TABLE faculty_teaching_assignment (id INT PRIMARY KEY, class_id INT, course_id INT, is_active BOOLEAN, is_deleted BOOLEAN)");
        sql("CREATE TABLE lms_group (id INT PRIMARY KEY, college_id INT, status VARCHAR(20), is_deleted BOOLEAN)");
        sql("CREATE TABLE elective_slot (id INT PRIMARY KEY, college_id INT, status VARCHAR(20), is_deleted BOOLEAN)");
        sql("CREATE TABLE elective_offering (id INT PRIMARY KEY, slot_id INT, course_id INT, group_id INT, backed_class_id INT, status VARCHAR(20), is_deleted BOOLEAN)");
        sql("CREATE TABLE lesson_contents (id INT PRIMARY KEY, course_id INT, class_id INT, content_type VARCHAR(50), is_deleted BOOLEAN, enabled BOOLEAN, active BOOLEAN, created_at TIMESTAMP)");

        sql("INSERT INTO department VALUES (1,10,FALSE),(2,20,FALSE)");
        sql("INSERT INTO new_program VALUES (11,1,FALSE),(21,2,FALSE)");
        sql("INSERT INTO batch VALUES (100,11,3,'ACTIVE'),(200,21,3,'ACTIVE')");
        sql("INSERT INTO class VALUES (101,11,100,'SECTION',FALSE),(170,11,NULL,'GROUP_BACKED',FALSE),(201,21,200,'SECTION',FALSE)");
        sql("INSERT INTO course VALUES "
                + "(501,1,TRUE,TRUE,FALSE),(502,2,TRUE,TRUE,FALSE),(503,1,TRUE,TRUE,FALSE),"
                + "(504,1,TRUE,TRUE,FALSE),(506,1,TRUE,TRUE,FALSE)");
        sql("INSERT INTO semester VALUES (61,11,3,TRUE,FALSE),(65,11,5,TRUE,FALSE),(62,21,3,TRUE,FALSE)");
        sql("INSERT INTO semester_course VALUES (71,61,501,FALSE),(73,65,503,FALSE),(72,62,502,FALSE)");
        sql("INSERT INTO faculty_teaching_assignment VALUES (81,101,504,TRUE,FALSE)");
        sql("INSERT INTO lms_group VALUES (900,10,'ACTIVE',FALSE)");
        sql("INSERT INTO elective_slot VALUES (800,10,'ACTIVE',FALSE)");
        sql("INSERT INTO elective_offering VALUES (700,800,506,900,170,'ACTIVE',FALSE)");

        assignment(1001,501,101,false,true,true);
        assignment(1002,502,null,false,true,true);
        assignment(1003,503,null,false,true,true);
        assignment(1005,504,101,false,true,true);
        assignment(1006,501,null,false,false,true);
        assignment(1007,501,null,false,true,false);
        assignment(1008,501,null,true,true,true);
        assignment(1009,506,170,false,true,true);
        assignment(1010,506,null,false,true,true);
        assignment(1011,501,null,false,true,true);

        Method pagedMethod = LessonContentsRepository.class.getMethod(
                "fetchAllAssignmentsByLearnerClassIdsPaged", List.class, Integer.class, Pageable.class);
        paged = pagedMethod.getAnnotation(Query.class);
        Method unpagedMethod = LessonContentsRepository.class.getMethod(
                "fetchAllAssignmentsByLearnerClassIds", List.class);
        unpaged = unpagedMethod.getAnnotation(Query.class);
    }

    @Test
    void pageAndCountAggregateHomeAndElectiveAudiencesWithoutDuplicates() {
        assertEquals(List.of(1011,1010,1009,1005,1001), ids(paged.value(), args(null)));
        assertEquals(5, jdbc.queryForObject(paged.countQuery(), args(null), Integer.class));
        assertEquals(List.of(1011,1010,1009,1005,1001), ids(unpaged.value(), args(null)));
    }

    @Test
    void futureSemesterAndOtherCollegeCannotBeRecoveredThroughCourseFilter() {
        assertEquals(List.of(), ids(paged.value(), args(503)));
        assertEquals(0, jdbc.queryForObject(paged.countQuery(), args(503), Integer.class));
        assertEquals(List.of(), ids(paged.value(), args(502)));
        assertEquals(0, jdbc.queryForObject(paged.countQuery(), args(502), Integer.class));
        assertEquals(List.of(1011,1001), ids(paged.value(), args(501)));
    }

    @Test
    void electiveAssignmentsDisappearFromCurrentAudienceWhenOfferingArchives() {
        assertEquals(List.of(1010,1009), ids(paged.value(), args(506)));
        sql("UPDATE elective_offering SET status='ARCHIVED' WHERE id=700");
        assertEquals(List.of(), ids(paged.value(), args(506)));
        assertEquals(0, jdbc.queryForObject(paged.countQuery(), args(506), Integer.class));
    }

    @Test
    void invalidAudienceClassesFailClosed() {
        MapSqlParameterSource invalid = new MapSqlParameterSource("classIds", List.of(999)).addValue("courseId", null);
        assertEquals(List.of(), ids(paged.value(), invalid));
        assertEquals(0, jdbc.queryForObject(paged.countQuery(), invalid, Integer.class));
    }

    private void assignment(int id,int courseId,Integer classId,boolean deleted,boolean enabled,boolean active) {
        jdbc.update("INSERT INTO lesson_contents (id,course_id,class_id,content_type,is_deleted,enabled,active,created_at) "
                        + "VALUES (:id,:courseId,:classId,'assignment',:deleted,:enabled,:active,'2026-01-01 00:00:00')",
                new MapSqlParameterSource("id",id).addValue("courseId",courseId).addValue("classId",classId)
                        .addValue("deleted",deleted).addValue("enabled",enabled).addValue("active",active));
    }

    private MapSqlParameterSource args(Integer courseId) {
        return new MapSqlParameterSource("classIds", List.of(101,170)).addValue("courseId", courseId);
    }

    private List<Integer> ids(String query, MapSqlParameterSource args) {
        return jdbc.queryForList(query,args).stream()
                .map(row -> ((Number)row.get("ID")).intValue()).collect(Collectors.toList());
    }

    private void sql(String statement) { jdbc.getJdbcTemplate().execute(statement); }
}
