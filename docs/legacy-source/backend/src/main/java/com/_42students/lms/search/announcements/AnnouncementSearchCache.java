package com._42students.lms.search.announcements;

import com._42students.lms.model.Announcement;
import com._42students.lms.repository.AnnouncementRepository;
import com._42students.lms.search.core.GenericSearchCache;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.List;
import java.util.stream.Collectors;

@Component
@Slf4j
public class AnnouncementSearchCache extends GenericSearchCache<AnnouncementSearchDTO> {
    @Autowired
    private AnnouncementRepository announcementRepository;
    
    @PostConstruct
    public void init() {
        log.info("Initializing Announcement Search Cache...");
        configure();
        loadAnnouncements();
        log.info("Announcement Search Cache initialized with {} announcements", size());
    }
    
    @Override
    protected void configure() {
        setSearchFieldsList(java.util.Arrays.asList(
            AnnouncementSearchDTO::getTitle,
            AnnouncementSearchDTO::getMessage
        ));
    }
    
    private void loadAnnouncements() {
        try {
            List<Announcement> announcements = announcementRepository.findAll();
            List<AnnouncementSearchDTO> dtos = announcements.stream()
                .filter(a -> a.getIsDeleted() == null || !a.getIsDeleted())
                .map(this::toDTO)
                .collect(Collectors.toList());
            load(dtos);
            log.info("Loaded {} announcements from database", dtos.size());
        } catch (Exception e) {
            log.error("Failed to load announcements into cache", e);
        }
    }
    
    private AnnouncementSearchDTO toDTO(Announcement a) {
        return AnnouncementSearchDTO.builder()
            .id(a.getId())
            .title(a.getTitle())
            .message(a.getMessage())
            .receiverType(a.getReceiverType() != null ? a.getReceiverType().name() : null)
            .receiverValue(a.getReceiverValue())
            .build();
    }
    
    public void refresh() {
        log.info("Refreshing announcement search cache...");
        loadAnnouncements();
    }
}


