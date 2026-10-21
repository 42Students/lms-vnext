package com._42students.lms.search.lessons;

import com._42students.lms.model.Course;
import com._42students.lms.model.Lesson;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.repository.LessonRepository;
import com._42students.lms.search.core.GenericSearchCache;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@Slf4j
public class LessonSearchCache extends GenericSearchCache<LessonSearchDTO> {
    @Autowired
    private LessonRepository lessonRepository;
    @Autowired
    private CourseRepository courseRepository;
    private Map<Integer, String> courseCache = new HashMap<>();
    private Map<Integer, String> courseSlugCache = new HashMap<>();
    
    @PostConstruct
    public void init() {
        log.info("Initializing Lesson Search Cache...");
        configure();
        loadLessons();
        log.info("Lesson Search Cache initialized with {} lessons", size());
    }
    
    @Override
    protected void configure() {
        setSearchFieldsList(java.util.Arrays.asList(
            LessonSearchDTO::getLessonName,
            LessonSearchDTO::getCourseName
        ));
    }
    
    private void loadLessons() {
        try {
            courseRepository.findAll().forEach(c -> {
                courseCache.put(c.getId(), c.getCourseName());
                courseSlugCache.put(c.getId(), c.getSlug() != null ? c.getSlug() : "");
            });
            List<Lesson> lessons = lessonRepository.findAll();
            List<LessonSearchDTO> dtos = lessons.stream()
                .filter(l -> l.isActive())
                .map(this::toDTO)
                .collect(Collectors.toList());
            load(dtos);
            log.info("Loaded {} active lessons from database", dtos.size());
        } catch (Exception e) {
            log.error("Failed to load lessons into cache", e);
        }
    }
    
    private LessonSearchDTO toDTO(Lesson l) {
        return LessonSearchDTO.builder()
            .id(l.getId())
            .lessonName(l.getLessonName())
            .courseId(l.getCourseId())
            .courseSlug(courseSlugCache.get(l.getCourseId()))
            .courseName(courseCache.get(l.getCourseId()))
            .active(l.isActive())
            .build();
    }
    
    public void refresh() {
        log.info("Refreshing lesson search cache...");
        loadLessons();
    }
}


