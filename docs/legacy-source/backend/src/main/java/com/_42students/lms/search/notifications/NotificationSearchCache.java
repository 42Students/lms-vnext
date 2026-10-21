package com._42students.lms.search.notifications;

import com._42students.lms.model.Notification;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.repository.NotificationRepository;
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
public class NotificationSearchCache extends GenericSearchCache<NotificationSearchDTO> {
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private CourseRepository courseRepository;
    private Map<Integer, String> courseSlugCache = new HashMap<>();

    @PostConstruct
    public void init() {
        log.info("Initializing Notification Search Cache...");
        configure();
        loadNotifications();
        log.info("Notification Search Cache initialized with {} notifications", size());
    }
    
    @Override
    protected void configure() {
        setSearchFieldsList(java.util.Arrays.asList(
            NotificationSearchDTO::getTitle,
            NotificationSearchDTO::getMessage
        ));
    }
    
    private void loadNotifications() {
        try {
            List<Notification> notifications = notificationRepository.findAllActive();
            courseSlugCache.clear();
            notifications.stream()
                .map(Notification::getCourseId)
                .filter(id -> id != 0)
                .distinct()
                .forEach(courseId -> courseRepository.findById(courseId)
                    .ifPresent(c -> courseSlugCache.put(c.getId(), c.getSlug() != null ? c.getSlug() : "")));
            List<NotificationSearchDTO> dtos = notifications.stream().map(this::toDTO).collect(Collectors.toList());
            load(dtos);
            log.info("Loaded {} notifications from database", dtos.size());
        } catch (Exception e) {
            log.error("Failed to load notifications into cache", e);
        }
    }
    
    private NotificationSearchDTO toDTO(Notification n) {
        return NotificationSearchDTO.builder()
            .id(n.getId())
            .title(n.getTitle())
            .message(n.getMessage())
            .classId(n.getClassId())
            .courseId(n.getCourseId())
            .courseSlug(courseSlugCache.get(n.getCourseId()))
            .learnerId(n.getLearnerId())
            .scheduledAt(n.getScheduledAt())
            .build();
    }
    
    public void refresh() {
        log.info("Refreshing notification search cache...");
        loadNotifications();
    }
}


