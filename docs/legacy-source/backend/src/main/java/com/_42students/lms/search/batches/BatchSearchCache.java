package com._42students.lms.search.batches;

import com._42students.lms.model.Batch;
import com._42students.lms.model.NewProgram;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.repository.BatchRepository;
import com._42students.lms.repository.NewProgramRepository;
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
public class BatchSearchCache extends GenericSearchCache<BatchSearchDTO> {

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private NewProgramRepository newProgramRepository;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    private Map<Integer, String> programCache = new HashMap<>();

    @PostConstruct
    public void init() {
        log.info("Initializing Batch Search Cache...");
        configure();
        loadBatches();
        log.info("Batch Search Cache initialized with {} batches", size());
    }

    @Override
    protected void configure() {
        setSearchFieldsList(java.util.Arrays.asList(
            BatchSearchDTO::getBatchName,
            BatchSearchDTO::getProgramName
        ));

        addSynonym("batch", "batch");
        addSynonym("year", "year");
        addSynonym("semester", "semester");

        setCategoryField(BatchSearchDTO::getProgramName);
    }

    private void loadBatches() {
        try {
            loadReferenceData();
            List<Batch> batches = batchRepository.findAll();
            // Batch doesn't have isDeleted field
            List<BatchSearchDTO> dtos = batches.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
            load(dtos);
            log.info("Loaded {} batches from database", dtos.size());
        } catch (Exception e) {
            log.error("Failed to load batches into cache", e);
        }
    }

    private void loadReferenceData() {
        try {
            List<NewProgram> programs = newProgramRepository.findAll();
            programCache = programs.stream()
                .filter(p -> p.getIsDeleted() == null || !p.getIsDeleted())
                .collect(Collectors.toMap(
                    NewProgram::getId,
                    NewProgram::getName,
                    (existing, replacement) -> existing
                ));
        } catch (Exception e) {
            log.warn("Could not load program reference data: {}", e.getMessage());
        }
    }

    private BatchSearchDTO toDTO(Batch batch) {
        // batch.getProgramId() returns Long, convert to Integer for lookup
        String programName = batch.getProgramId() != null ?
            programCache.get(batch.getProgramId().intValue()) : null;

        Integer collegeId = (scopeResolutionService != null && batch.getProgramId() != null)
                ? scopeResolutionService.resolveProgramToCollegeId(batch.getProgramId())
                : null;
        Integer organizationId = (scopeResolutionService != null && collegeId != null)
                ? scopeResolutionService.resolveCollegeToOrganizationId(collegeId)
                : null;

        return BatchSearchDTO.builder()
            .id(batch.getId())
            .batchName(batch.getBatchName())
            .programId(batch.getProgramId())
            .programName(programName)
            .organizationId(organizationId)
            .collegeId(collegeId)
            .startDate(batch.getStartDate())
            .endDate(batch.getEndDate())
            .build();
    }

    public void refresh() {
        log.info("Refreshing batch search cache...");
        loadBatches();
    }

    public List<BatchSearchDTO> getByProgramId(Long programId, int limit) {
        return allItems.stream()
            .filter(batch -> batch.getProgramId() != null && batch.getProgramId().equals(programId))
            .limit(limit)
            .collect(Collectors.toList());
    }

    public List<BatchSearchDTO> filterForScope(Integer organizationId, Integer collegeId) {
        synchronized (this) {
            if (collegeId != null) {
                return allItems.stream()
                        .filter(b -> b.getCollegeId() != null && b.getCollegeId().equals(collegeId))
                        .collect(Collectors.toList());
            }
            if (organizationId != null) {
                return allItems.stream()
                        .filter(b -> b.getOrganizationId() != null && b.getOrganizationId().equals(organizationId))
                        .collect(Collectors.toList());
            }
            return new java.util.ArrayList<>(allItems);
        }
    }
}

