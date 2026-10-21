package com._42students.lms.service.impl;

import com._42students.lms.dto.request.SemesterCourseDTO;
import com._42students.lms.model.SemesterCourse;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.repository.SemesterCourseRepository;
import com._42students.lms.service.SemesterCourseService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
public class SemesterCourseServiceImpl implements SemesterCourseService {

    private final SemesterCourseRepository semesterCourseRepository;

    @Autowired(required = false)
    private CourseRepository courseRepository;

    @Autowired
    public SemesterCourseServiceImpl(SemesterCourseRepository semesterCourseRepository) {
        this.semesterCourseRepository = semesterCourseRepository;
    }

    @Override
    @Transactional
    public SemesterCourse addCourseToSemester(SemesterCourseDTO dto) {
        if (dto.getSemesterId() == null || dto.getSemesterId() <= 0) {
            throw new IllegalArgumentException("semesterId is required");
        }
        if (dto.getCourseId() == null || dto.getCourseId() <= 0) {
            throw new IllegalArgumentException("courseId is required");
        }
        if (dto.getCredits() != null && (dto.getCredits() < 0 || dto.getCredits() > 30)) {
            throw new IllegalArgumentException("credits must be between 0 and 30");
        }
        if (dto.getCourseOrder() != null && dto.getCourseOrder() <= 0) {
            throw new IllegalArgumentException("courseOrder must be >= 1");
        }
        // CC-15: validate courseId exists before assigning to semester
        if (courseRepository != null && !courseRepository.existsById(dto.getCourseId())) {
            throw new IllegalArgumentException("Course not found with id: " + dto.getCourseId());
        }
        // Check if already exists
        if (semesterCourseRepository.existsBySemesterIdAndCourseId(dto.getSemesterId(), dto.getCourseId())) {
            throw new RuntimeException("Course is already assigned to this semester");
        }

        SemesterCourse sc = new SemesterCourse();
        sc.setSemesterId(dto.getSemesterId());
        sc.setCourseId(dto.getCourseId());
        sc.setIsMandatory(dto.getIsMandatory() != null ? dto.getIsMandatory() : true);
        sc.setCredits(dto.getCredits() != null ? dto.getCredits() : 3);
        Integer order = dto.getCourseOrder();
        if (order == null) {
            Integer max = semesterCourseRepository.findMaxCourseOrderBySemesterId(dto.getSemesterId());
            order = (max == null ? 0 : max) + 1;
        }
        sc.setCourseOrder(order);

        try {
            return semesterCourseRepository.saveAndFlush(sc);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // CC-16: concurrent duplicate insert — unique constraint fired; return existing gracefully
            log.warn("CC-16: concurrent duplicate semester-course assignment detected for semester {} course {}",
                    dto.getSemesterId(), dto.getCourseId());
            throw new RuntimeException("Course is already assigned to this semester");
        }
    }

    @Override
    @Transactional
    public List<SemesterCourse> addCoursesToSemester(Integer semesterId, List<Integer> courseIds) {
        if (semesterId == null || semesterId <= 0) {
            throw new IllegalArgumentException("semesterId is required");
        }
        if (courseIds == null || courseIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<SemesterCourse> added = new ArrayList<>();
        Integer max = semesterCourseRepository.findMaxCourseOrderBySemesterId(semesterId);
        int order = (max == null ? 0 : max) + 1;
        
        for (Integer courseId : courseIds) {
            if (courseId == null || courseId <= 0) continue;
            if (courseRepository != null && !courseRepository.existsById(courseId)) {
                throw new IllegalArgumentException("Course not found with id: " + courseId);
            }
            if (!semesterCourseRepository.existsBySemesterIdAndCourseId(semesterId, courseId)) {
                SemesterCourse sc = new SemesterCourse(semesterId, courseId);
                sc.setCourseOrder(order++);
                try {
                    added.add(semesterCourseRepository.saveAndFlush(sc));
                } catch (org.springframework.dao.DataIntegrityViolationException e) {
                    log.warn("CC-16: concurrent duplicate semester-course assignment detected for semester {} course {}",
                            semesterId, courseId);
                }
            }
        }
        
        return added;
    }

    @Override
    @Transactional
    public void removeCourseFromSemester(Integer semesterId, Integer courseId) {
        semesterCourseRepository.deleteBySemesterIdAndCourseId(semesterId, courseId);
    }

    @Override
    @Transactional
    public void removeAllCoursesFromSemester(Integer semesterId) {
        semesterCourseRepository.deleteBySemesterId(semesterId);
    }

    @Override
    public List<SemesterCourse> getCoursesBySemester(Integer semesterId) {
        return semesterCourseRepository.findBySemesterIdOrderByCourseOrder(semesterId);
    }

    @Override
    @Transactional
    public SemesterCourse updateSemesterCourse(Integer id, SemesterCourseDTO dto) {
        SemesterCourse sc = semesterCourseRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("SemesterCourse not found with id: " + id));

        if (dto.getIsMandatory() != null) sc.setIsMandatory(dto.getIsMandatory());
        if (dto.getCredits() != null) {
            if (dto.getCredits() < 0 || dto.getCredits() > 30) {
                throw new IllegalArgumentException("credits must be between 0 and 30");
            }
            sc.setCredits(dto.getCredits());
        }
        if (dto.getCourseOrder() != null) {
            if (dto.getCourseOrder() <= 0) {
                throw new IllegalArgumentException("courseOrder must be >= 1");
            }
            sc.setCourseOrder(dto.getCourseOrder());
        }

        return semesterCourseRepository.save(sc);
    }
}

