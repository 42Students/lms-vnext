package com._42students.lms.search.lecturehalls;

import com._42students.lms.model.LectureHall;
import com._42students.lms.repository.LectureHallRepository;
import com._42students.lms.search.core.GenericSearchCache;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.List;
import java.util.stream.Collectors;

@Component
@Slf4j
public class LectureHallSearchCache extends GenericSearchCache<LectureHallSearchDTO> {
    @Autowired
    private LectureHallRepository lectureHallRepository;
    
    @PostConstruct
    public void init() {
        log.info("Initializing Lecture Hall Search Cache...");
        configure();
        loadLectureHalls();
        log.info("Lecture Hall Search Cache initialized with {} halls", size());
    }
    
    @Override
    protected void configure() {
        setSearchFieldsList(java.util.Arrays.asList(
            LectureHallSearchDTO::getName,
            LectureHallSearchDTO::getDescription
        ));
    }
    
    private void loadLectureHalls() {
        try {
            List<LectureHall> halls = lectureHallRepository.findAll();
            List<LectureHallSearchDTO> dtos = halls.stream().map(this::toDTO).collect(Collectors.toList());
            load(dtos);
            log.info("Loaded {} lecture halls from database", dtos.size());
        } catch (Exception e) {
            log.error("Failed to load lecture halls into cache", e);
        }
    }
    
    private LectureHallSearchDTO toDTO(LectureHall h) {
        return LectureHallSearchDTO.builder()
            .id(h.getId())
            .name(h.getName())
            .capacity(h.getCapacity())
            .description(h.getDescription())
            .collegeId(h.getCollegeId())
            .deptId(h.getDeptId())
            .roomType(h.getRoomType() != null ? h.getRoomType().name() : null)
            .build();
    }
    
    public void refresh() {
        log.info("Refreshing lecture hall search cache...");
        loadLectureHalls();
    }
}


