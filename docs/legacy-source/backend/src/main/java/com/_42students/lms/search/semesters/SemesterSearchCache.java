package com._42students.lms.search.semesters;

import com._42students.lms.model.Semester;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.repository.SemesterRepository;
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
public class SemesterSearchCache extends GenericSearchCache<SemesterSearchDTO> {
    @Autowired
    private SemesterRepository semesterRepository;
    @Autowired
    private NewProgramRepository newProgramRepository;
    private Map<Integer, String> programCache = new HashMap<>();
    
    @PostConstruct
    public void init() {
        log.info("Initializing Semester Search Cache...");
        configure();
        loadSemesters();
        log.info("Semester Search Cache initialized with {} semesters", size());
    }
    
    @Override
    protected void configure() {
        setSearchFieldsList(java.util.Arrays.asList(
            SemesterSearchDTO::getName,
            SemesterSearchDTO::getProgramName
        ));
    }
    
    private void loadSemesters() {
        try {
            newProgramRepository.findAll().stream()
                .filter(p -> p.getIsDeleted() == null || !p.getIsDeleted())
                .forEach(p -> programCache.put(p.getId(), p.getName()));
            List<Semester> semesters = semesterRepository.findAll();
            List<SemesterSearchDTO> dtos = semesters.stream().map(this::toDTO).collect(Collectors.toList());
            load(dtos);
            log.info("Loaded {} semesters from database", dtos.size());
        } catch (Exception e) {
            log.error("Failed to load semesters into cache", e);
        }
    }
    
    private SemesterSearchDTO toDTO(Semester s) {
        return SemesterSearchDTO.builder()
            .id(s.getId())
            .programId(s.getProgramId())
            .programName(programCache.get(s.getProgramId()))
            .semesterNumber(s.getSemesterNumber())
            .name(s.getName())
            .build();
    }
    
    public void refresh() {
        log.info("Refreshing semester search cache...");
        loadSemesters();
    }
}


