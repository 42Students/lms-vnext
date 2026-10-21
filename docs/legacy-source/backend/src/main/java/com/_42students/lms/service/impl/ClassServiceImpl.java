package com._42students.lms.service.impl;

import com._42students.lms.dto.request.ClassDTO;
import com._42students.lms.model._Class;
import com._42students.lms.repository._ClassRepository;
import com._42students.lms.service.ClassService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ClassServiceImpl implements ClassService {

    // BE-0070/BE-0076/BE-0095: same-name creates take turns on the parent row, so the name check sees the other one.
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate uniquenessJdbc;

    private void lockRow(String table, Object id) {
        if (uniquenessJdbc == null || id == null) return;
        uniquenessJdbc.queryForList("SELECT id FROM " + table + " WHERE id = :id FOR UPDATE",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("id", id));
    }

    @Autowired
    _ClassRepository studentClassRepository;

    @Autowired(required = false)
    org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate jdbc;

    /**
     * BE-0074: a class in use (students, scheduled classes, teaching assignments) keeps its program and batch. Changing them used
     * to re-parent the section while its students, timetable and teachers stayed where they were.
     */
    private void requireUnusedForMove(Integer classId) {
        if (jdbc == null) return;
        var p = new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("c", classId);
        Long learners = jdbc.queryForObject("SELECT COUNT(*) FROM learner WHERE class_id = :c AND (is_deleted = 0 OR is_deleted IS NULL)", p, Long.class);
        Long schedules = jdbc.queryForObject("SELECT COUNT(*) FROM class_schedule WHERE class_id = :c", p, Long.class);
        Long teaching = jdbc.queryForObject("SELECT COUNT(*) FROM faculty_teaching_assignment WHERE class_id = :c AND is_active = 1", p, Long.class);
        if ((learners != null && learners > 0) || (schedules != null && schedules > 0) || (teaching != null && teaching > 0)) {
            throw new IllegalArgumentException("This class already has students, scheduled classes or teachers, so its program and batch can't change. "
                    + "Create a class in the other batch and move students there instead.");
        }
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public _Class register(ClassDTO classDTO) {
        _Class aClass = new _Class();
        setClassFields(aClass, classDTO);
        if (aClass.getBatchId() != null) lockRow("batch", aClass.getBatchId());
        else lockRow("new_program", aClass.getProgramId());
        checkNameUnique(aClass.getBatchId(), aClass.getProgramId(), aClass.getName(), null);
        studentClassRepository.save(aClass);
        return aClass;
    }

    /**
     * App-level uniqueness guard (case-insensitive, scoped to batch when assigned, else program):
     * no unique index exists on class.name at the DB level, so this mirrors
     * SemesterServiceImpl.createSemester's app-level check.
     */
    private void checkNameUnique(Integer batchId, int programId, String name, Integer excludeId) {
        if (name == null || name.isBlank()) return;
        List<_Class> matches = batchId != null
                ? studentClassRepository.findByBatchIdAndNameIgnoreCase(batchId, name)
                : studentClassRepository.findByProgramIdAndNameIgnoreCase(programId, name);
        boolean conflict = matches.stream().anyMatch(c -> excludeId == null || c.getId() != excludeId);
        if (conflict) {
            throw new IllegalArgumentException("A class named \"" + name + "\" already exists in this "
                    + (batchId != null ? "batch" : "program"));
        }
    }

    @Override
    public _Class getClassDetail(String classId) {
        return studentClassRepository.getClassDetail(classId);
    }

    @Override
    public List<_Class> findAll() {
        return studentClassRepository.findAll();
    }

    @Override
    public String getClassNameById(String classId) {
        _Class aClass = studentClassRepository.getClassDetail(classId);
        if (aClass != null) {
            return aClass.getName();
        }
        return null;
    }

    @Override
    public Map<Integer, String> getClassesByProgram(int programId) {
        List<_Class> classEntities = studentClassRepository.getClassesByProgram(programId);

        Map<Integer, String> classesMap = new HashMap<>();
        for (_Class aClass : classEntities) {
            classesMap.put(aClass.getId(), aClass.getName());
        }

        return classesMap;
    }

    @Override
    public List<_Class> getClassesByCollegeId(int collegeId) {
        return studentClassRepository.getClassesByCollegeId(collegeId);
    }

    @Override
    public List<_Class> getClassesByOrganizationId(int orgId) {
        return studentClassRepository.getClassesByOrganizationId(orgId);
    }

    @Override
    public Optional<_Class> findById(Integer id) {
        return studentClassRepository.findById(id);
    }

    @Override
    public _Class updateClass(Integer id, ClassDTO classDTO) {
        _Class aClass = studentClassRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found with id: " + id));

        // ClassController.updateClass is transactional and catches validation exceptions to
        // return a 400. Mutating this managed JPA entity before validating would allow dirty
        // checking to flush the rejected name/program/batch even though save() was never called.
        // Validate the complete proposed state on an unattached object first.
        _Class proposed = new _Class();
        setClassFields(proposed, classDTO);
        checkNameUnique(proposed.getBatchId(), proposed.getProgramId(), proposed.getName(), id);
        boolean moving = proposed.getProgramId() != aClass.getProgramId() || !java.util.Objects.equals(proposed.getBatchId(), aClass.getBatchId());
        if (moving) requireUnusedForMove(id);
        // BE-0075: a section's maximum can't go below the students already in it (moving a student in already checks this).
        if (proposed.getUpperLimit() > 0 && jdbc != null) {
            Long enrolled = jdbc.queryForObject("SELECT COUNT(*) FROM learner l WHERE " + com._42students.lms.repository.RosterSql.LEARNER_IN_CLASS
                    + " AND (l.is_deleted = false OR l.is_deleted IS NULL)", new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("classId", id), Long.class);
            if (enrolled != null && enrolled > proposed.getUpperLimit()) {
                throw new IllegalArgumentException("This section already has " + enrolled + " students, so its maximum can't be "
                        + proposed.getUpperLimit() + ". Move students out first, or keep the maximum at " + enrolled + " or more.");
            }
        }

        // Only touch the managed entity once every validation has passed.
        setClassFields(aClass, classDTO);
        return studentClassRepository.save(aClass);
    }

    @Override
    public void deleteClass(Integer id) {
        _Class aClass = studentClassRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found with id: " + id));
        studentClassRepository.delete(aClass);
    }

    private void setClassFields(_Class aClass, ClassDTO classDTO) {
        String name = classDTO.getName() != null ? classDTO.getName().trim() : null;
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Class name is required");
        }
        aClass.setName(name);
        aClass.setDescription(classDTO.getDescription() != null ? classDTO.getDescription().trim() : null);
        // Class lifecycle dates are legacy metadata. The admin UI now derives the academic
        // period from batch/semester and uses ClassSchedule for actual teaching dates. Preserve
        // existing legacy dates on updates when callers omit both values, while still supporting
        // older API clients that explicitly send them.
        if (classDTO.getStartDate() != null || classDTO.getEndDate() != null) {
            if (classDTO.getStartDate() != null && classDTO.getEndDate() != null
                    && classDTO.getEndDate().before(classDTO.getStartDate())) {
                throw new IllegalArgumentException("End date cannot be before start date");
            }
            aClass.setStartDate(classDTO.getStartDate());
            aClass.setEndDate(classDTO.getEndDate());
        }
        aClass.setProgramId(classDTO.getProgramId());
        aClass.setBatchId(classDTO.getBatchId());
        if (classDTO.getLowerLimit() < 0) {
            throw new IllegalArgumentException("Min students cannot be negative");
        }
        if (classDTO.getUpperLimit() <= 0) {
            throw new IllegalArgumentException("Max students must be at least 1");
        }
        if (classDTO.getUpperLimit() > 500) {
            throw new IllegalArgumentException("Max students too large (max 500)");
        }
        if (classDTO.getLowerLimit() > classDTO.getUpperLimit()) {
            throw new IllegalArgumentException("Min students cannot exceed max students");
        }
        aClass.setUpperLimit(classDTO.getUpperLimit());
        aClass.setLowerLimit(classDTO.getLowerLimit());
    }

    @Override
    public org.springframework.data.domain.Page<com._42students.lms.model._Class> getClassesByCollegeIdPaged(int collegeId, org.springframework.data.domain.Pageable pageable) {
        return studentClassRepository.getClassesByCollegeIdPaged(collegeId, pageable);
    }
}
