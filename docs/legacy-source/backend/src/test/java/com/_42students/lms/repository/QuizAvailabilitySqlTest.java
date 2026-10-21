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

class QuizAvailabilitySqlTest {
    private NamedParameterJdbcTemplate jdbc;
    private Query byAudiencePaged;

    @BeforeEach
    void setUp() throws Exception {
        DriverManagerDataSource dataSource = new DriverManagerDataSource(
                "jdbc:h2:mem:quiz_availability;MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
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
        sql("CREATE TABLE quizzes (id INT PRIMARY KEY, course_id INT, class_id INT, status VARCHAR(40), active BOOLEAN, enabled BOOLEAN, is_deleted BOOLEAN, created_at TIMESTAMP)");

        sql("INSERT INTO department VALUES (1,10,FALSE),(2,20,FALSE)");
        sql("INSERT INTO new_program VALUES (11,1,FALSE),(21,2,FALSE)");
        sql("INSERT INTO batch VALUES (100,11,3,'ACTIVE'),(200,21,3,'ACTIVE')");
        sql("INSERT INTO class VALUES (7,11,100,'SECTION',FALSE),(70,11,NULL,'GROUP_BACKED',FALSE),(8,21,200,'SECTION',FALSE)");
        sql("INSERT INTO course VALUES "
                + "(10,1,TRUE,TRUE,FALSE),(20,2,TRUE,TRUE,FALSE),(30,1,TRUE,TRUE,FALSE),"
                + "(40,1,TRUE,TRUE,FALSE),(50,1,TRUE,TRUE,FALSE)");
        sql("INSERT INTO semester VALUES (61,11,3,TRUE,FALSE),(65,11,5,TRUE,FALSE),(62,21,3,TRUE,FALSE)");
        sql("INSERT INTO semester_course VALUES (71,61,10,FALSE),(73,65,30,FALSE),(72,62,20,FALSE)");
        sql("INSERT INTO faculty_teaching_assignment VALUES (81,7,40,TRUE,FALSE)");
        sql("INSERT INTO lms_group VALUES (900,10,'ACTIVE',FALSE)");
        sql("INSERT INTO elective_slot VALUES (800,10,'ACTIVE',FALSE)");
        sql("INSERT INTO elective_offering VALUES (700,800,50,900,70,'ACTIVE',FALSE)");

        quiz(1,10,7,"PUBLISHED",true,true,false);
        quiz(2,10,7,"PUBLISHED",false,true,false);
        quiz(3,10,7,"PUBLISHED",true,false,false);
        quiz(4,10,7,"DRAFT",true,true,false);
        quiz(5,10,7,"PUBLISHED",true,true,true);
        quiz(6,20,null,"PUBLISHED",true,true,false);
        quiz(7,30,null,"PUBLISHED",true,true,false);
        quiz(8,40,7,"PUBLISHED",true,true,false);
        quiz(9,50,70,"PUBLISHED",true,true,false);
        quiz(10,50,null,"PUBLISHED",true,true,false);
        quiz(11,10,null,"PUBLISHED",true,true,false);

        Method method = QuizRepository.class.getMethod(
                "findAvailableByClassesPaged", List.class, Integer.class, Pageable.class);
        byAudiencePaged = method.getAnnotation(Query.class);
    }

    @Test
    void currentAudienceIncludesCoreTeachingAndElectiveWithoutDuplicatingSharedRows() {
        assertEquals(List.of(11,10,9,8,1), ids(byAudiencePaged.value(), args(null)));
        assertEquals(5, jdbc.queryForObject(byAudiencePaged.countQuery(), args(null), Integer.class));
    }

    @Test
    void futureSemesterAndOtherCollegeCannotBeRecoveredThroughCourseFilter() {
        assertEquals(List.of(), ids(byAudiencePaged.value(), args(30)));
        assertEquals(0, jdbc.queryForObject(byAudiencePaged.countQuery(), args(30), Integer.class));
        assertEquals(List.of(), ids(byAudiencePaged.value(), args(20)));
        assertEquals(0, jdbc.queryForObject(byAudiencePaged.countQuery(), args(20), Integer.class));
        assertEquals(List.of(11,1), ids(byAudiencePaged.value(), args(10)));
        assertEquals(2, jdbc.queryForObject(byAudiencePaged.countQuery(), args(10), Integer.class));
    }

    @Test
    void electiveSpecificAndSharedQuizzesAreAggregatedOnceAndRevokedWhenOfferingArchives() {
        assertEquals(List.of(10,9), ids(byAudiencePaged.value(), args(50)));
        assertEquals(2, jdbc.queryForObject(byAudiencePaged.countQuery(), args(50), Integer.class));
        sql("UPDATE elective_offering SET status='ARCHIVED' WHERE id=700");
        assertEquals(List.of(), ids(byAudiencePaged.value(), args(50)));
        assertEquals(0, jdbc.queryForObject(byAudiencePaged.countQuery(), args(50), Integer.class));
    }

    private MapSqlParameterSource args(Integer courseId) {
        return new MapSqlParameterSource("classIds", List.of(7,70)).addValue("courseId", courseId);
    }

    private void quiz(int id,int courseId,Integer classId,String status,Boolean active,Boolean enabled,Boolean deleted) {
        jdbc.update("INSERT INTO quizzes (id,course_id,class_id,status,active,enabled,is_deleted,created_at) "
                        + "VALUES (:id,:courseId,:classId,:status,:active,:enabled,:deleted,'2026-01-01 00:00:00')",
                new MapSqlParameterSource("id",id).addValue("courseId",courseId).addValue("classId",classId)
                        .addValue("status",status).addValue("active",active).addValue("enabled",enabled).addValue("deleted",deleted));
    }

    private List<Integer> ids(String query, MapSqlParameterSource args) {
        return jdbc.queryForList(query,args).stream()
                .map(row -> ((Number)row.get("ID")).intValue()).collect(Collectors.toList());
    }

    private void sql(String statement) { jdbc.getJdbcTemplate().execute(statement); }
}
