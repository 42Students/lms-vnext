package com._42students.lms.service.impl;

import com._42students.lms.model.Announcement;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.AnnouncementRepository;
import com._42students.lms.service.AnnouncementService;
import com._42students.lms.dto.request.AnnouncementCreateRequest;
import com._42students.lms.dto.response.AnnouncementResponseDTO;
import com._42students.lms.dto.response.PageDTO;
import com._42students.lms.enums.AnnouncementType;
import com._42students.lms.service.FacultyService;
import com._42students.lms.service.LearnerService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AnnouncementServiceImpl implements AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final FacultyService facultyService;
    private final LearnerService learnerService;

    @Autowired
    public AnnouncementServiceImpl(AnnouncementRepository announcementRepository, FacultyService facultyService , LearnerService learnerService) {
        this.announcementRepository = announcementRepository;
        this.facultyService = facultyService;
        this.learnerService = learnerService;
    }

    private void setAnnouncementFields(Announcement announcement, AnnouncementCreateRequest request) {
        if (request.getMessage() != null) announcement.setMessage(request.getMessage());
        if (request.getTitle() != null) announcement.setTitle(request.getTitle());
        if (request.getReceiverType() != null) announcement.setReceiverType(request.getReceiverType());
        if (request.getReceiverValue() != null) announcement.setReceiverValue(request.getReceiverValue());
        if (request.getSenderId() != null) announcement.setSenderId(request.getSenderId());
        // Part B: schedule/expiry/pin. Null-guarded like every field above so an update that omits
        // them leaves the existing values alone rather than silently clearing a schedule.
        if (request.getScheduledAt() != null) announcement.setScheduledAt(request.getScheduledAt());
        if (request.getExpiresAt() != null) announcement.setExpiresAt(request.getExpiresAt());
        if (request.getIsPinned() != null) announcement.setIsPinned(request.getIsPinned());
    }

    private void setSenderType(Announcement announcement, AnnouncementCreateRequest request) {
        String senderType = request.getSenderType();
        if ("FACULTY".equalsIgnoreCase(senderType) || "ADMIN".equalsIgnoreCase(senderType) || senderType == null) {
            // Default path: treat null senderType as FACULTY (admins always send as faculty)
            if (request.getSenderId() != null) {
                String instructorId = String.valueOf(request.getSenderId());
                Faculty faculty = facultyService.getFacultyDetails(instructorId);
                if (faculty != null && faculty.getFacultyType() != null) {
                    announcement.setSenderType(String.valueOf(faculty.getFacultyType()));
                } else {
                    announcement.setSenderType("FACULTY");
                }
            } else {
                announcement.setSenderType("FACULTY");
            }
        } else if ("LEARNER".equalsIgnoreCase(senderType)) {
            announcement.setSenderType("LEARNER");
        }
    }

    @Override
    public Announcement createAnnouncement(AnnouncementCreateRequest request) {
        Announcement announcement = new Announcement();
        setAnnouncementFields(announcement, request);
        setSenderType(announcement, request);
        announcement.setIsDeleted(false);
        return announcementRepository.save(announcement);
    }

    @Override
    public List<AnnouncementResponseDTO> findAll() {
        List<Announcement> announcements = announcementRepository.findAllActive();
        return announcements.stream()
                .map(announcement -> {
                    AnnouncementResponseDTO dto = new AnnouncementResponseDTO(announcement);
                    populateSenderName(dto, announcement);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<AnnouncementResponseDTO> findAllScoped(Integer orgId, Integer collegeId) {
        List<Announcement> announcements;
        if (collegeId != null) {
            announcements = announcementRepository.findAllActiveByCollegeScope(
                    collegeId,
                    AnnouncementType.COLLEGE,
                    AnnouncementType.DEPARTMENT,
                    AnnouncementType.PROGRAM,
                    AnnouncementType.CLASS,
                    AnnouncementType.FACULTY,
                    AnnouncementType.LEARNER
            );
        } else if (orgId != null) {
            announcements = announcementRepository.findAllActiveByOrgScope(
                    orgId,
                    AnnouncementType.COLLEGE,
                    AnnouncementType.DEPARTMENT,
                    AnnouncementType.PROGRAM,
                    AnnouncementType.CLASS,
                    AnnouncementType.FACULTY,
                    AnnouncementType.LEARNER
            );
        } else {
            // Global mode: intentionally unscoped
            announcements = announcementRepository.findAllActive();
        }

        return announcements.stream()
                .map(announcement -> {
                    AnnouncementResponseDTO dto = new AnnouncementResponseDTO(announcement);
                    populateSenderName(dto, announcement);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    private static final int MAX_PAGE_SIZE_DEFAULT = 200;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.service.AppSettingsService appSettingsService;

    private int maxPageSize() {
        return appSettingsService != null
                ? appSettingsService.getInt("GLOBAL", null, "ops.announcementMaxPageSize", MAX_PAGE_SIZE_DEFAULT)
                : MAX_PAGE_SIZE_DEFAULT;
    }

    private PageDTO<AnnouncementResponseDTO> toPageDTO(Page<Announcement> page) {
        PageDTO<AnnouncementResponseDTO> dto = new PageDTO<>();
        dto.setPageNumber(page.getNumber());
        dto.setPageSize(page.getSize());
        dto.setTotalRecords(page.getTotalElements());
        dto.setRecords(page.getContent().stream()
                .map(announcement -> {
                    AnnouncementResponseDTO d = new AnnouncementResponseDTO(announcement);
                    populateSenderName(d, announcement);
                    return d;
                })
                .collect(Collectors.toList()));
        return dto;
    }

    @Override
    public PageDTO<AnnouncementResponseDTO> findAllScopedPaged(Integer orgId, Integer collegeId, int pageNumber, int pageSize) {
        int size = Math.min(Math.max(pageSize, 1), maxPageSize());
        Page<Announcement> page = fetchScopedPage(orgId, collegeId, PageRequest.of(Math.max(pageNumber, 0), size));
        // Clamp an out-of-range page request back to the last page that actually has rows, so a
        // stale page number in the UI shows the tail of the list instead of an empty screen.
        if (page.getTotalElements() > 0 && page.getNumber() >= page.getTotalPages()) {
            page = fetchScopedPage(orgId, collegeId, PageRequest.of(page.getTotalPages() - 1, size));
        }
        return toPageDTO(page);
    }

    private Page<Announcement> fetchScopedPage(Integer orgId, Integer collegeId, Pageable pageable) {
        if (collegeId != null) {
            return announcementRepository.findAllActiveByCollegeScope(
                    collegeId,
                    AnnouncementType.COLLEGE,
                    AnnouncementType.DEPARTMENT,
                    AnnouncementType.PROGRAM,
                    AnnouncementType.CLASS,
                    AnnouncementType.FACULTY,
                    AnnouncementType.LEARNER,
                    pageable
            );
        }
        if (orgId != null) {
            return announcementRepository.findAllActiveByOrgScope(
                    orgId,
                    AnnouncementType.COLLEGE,
                    AnnouncementType.DEPARTMENT,
                    AnnouncementType.PROGRAM,
                    AnnouncementType.CLASS,
                    AnnouncementType.FACULTY,
                    AnnouncementType.LEARNER,
                    pageable
            );
        }
        // Global mode: intentionally unscoped
        return announcementRepository.findAllActive(pageable);
    }

    @Override
    public Optional<Announcement> findById(Long id) {
        return announcementRepository.findById(id);
    }

    @Override
    public Announcement updateAnnouncement(Long id, AnnouncementCreateRequest request) {
        return announcementRepository.findById(id).map(announcement -> {
            setAnnouncementFields(announcement, request);
            if (request.getSenderType() != null) {
                setSenderType(announcement, request);
            }
            return announcementRepository.save(announcement);
        }).orElseThrow(() -> new RuntimeException("Announcement not found with id " + id));
    }

    @Override
    public void deleteAnnouncement(Long id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found with id " + id));
        announcement.setIsDeleted(true);
        announcementRepository.save(announcement);
    }

    @Override
    public Announcement restoreAnnouncement(Long id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Announcement not found"));
        if (!Boolean.TRUE.equals(announcement.getIsDeleted())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "Announcement is not deleted");
        }
        announcement.setIsDeleted(false);
        return announcementRepository.save(announcement);
    }

    @Override
    public List<Announcement> findAllDeleted() {
        return announcementRepository.findAllDeleted();
    }

    private void populateSenderName(AnnouncementResponseDTO dto, Announcement announcement) {
        Long senderId = announcement.getSenderId();
        String senderType = dto.getSenderType();
        
        if (senderId != null) {
            String senderIdString = String.valueOf(senderId);
            
            if ("LEARNER".equals(senderType)) {
                Learner learner = learnerService.getLearnerDetails(senderIdString);
                if (learner != null) {
                    dto.setSenderName(learner.getFirstName());
                }
            } else {
                Faculty faculty = facultyService.getFacultyDetails(senderIdString);
                if (faculty != null) {
                    dto.setSenderName(faculty.getFirstName());
                }
            }
        }
    }

    @Override
    public List<AnnouncementResponseDTO> fetchLearnerAnnouncements(Long collegeId, Long programId, Long classId, Long learnerId) {
        List<Announcement> announcements = announcementRepository.findByLearnerAnnouncements(
            AnnouncementType.COLLEGE, collegeId,
            AnnouncementType.PROGRAM, programId,
            AnnouncementType.CLASS, classId,
            AnnouncementType.LEARNER, learnerId
        );

        return announcements.stream()
            .map(announcement -> {
                AnnouncementResponseDTO dto = new AnnouncementResponseDTO(announcement);
                populateSenderName(dto, announcement);
                return dto;
            })
            .collect(Collectors.toList());
    }

    @Override
    public PageDTO<AnnouncementResponseDTO> fetchLearnerAnnouncementsPaged(Long collegeId, Long programId, Long classId, Long learnerId, int pageNumber, int pageSize) {
        int size = Math.min(Math.max(pageSize, 1), maxPageSize());
        Pageable pageable = PageRequest.of(Math.max(pageNumber, 0), size);
        Page<Announcement> page = announcementRepository.findByLearnerAnnouncements(
            AnnouncementType.COLLEGE, collegeId,
            AnnouncementType.PROGRAM, programId,
            AnnouncementType.CLASS, classId,
            AnnouncementType.LEARNER, learnerId,
            pageable
        );
        return toPageDTO(page);
    }

    @Override
    public List<AnnouncementResponseDTO> fetchFacultyAnnouncements(Long collegeId, Long deptmentId, Long facultyId) {
        List<Announcement> announcements = announcementRepository.findByFacultyAnnouncements(
            AnnouncementType.COLLEGE, collegeId,
            AnnouncementType.DEPARTMENT, deptmentId,
            AnnouncementType.FACULTY, facultyId
        );

        return announcements.stream()
            .map(announcement -> {
                AnnouncementResponseDTO dto = new AnnouncementResponseDTO(announcement);
                populateSenderName(dto, announcement);
                return dto;
            })
            .collect(Collectors.toList());
    }

    @Override
    public PageDTO<AnnouncementResponseDTO> fetchFacultyAnnouncementsPaged(Long collegeId, Long deptId, Long facultyId, int pageNumber, int pageSize) {
        int size = Math.min(Math.max(pageSize, 1), maxPageSize());
        Pageable pageable = PageRequest.of(Math.max(pageNumber, 0), size);
        Page<Announcement> page = announcementRepository.findByFacultyAnnouncements(
            AnnouncementType.COLLEGE, collegeId,
            AnnouncementType.DEPARTMENT, deptId,
            AnnouncementType.FACULTY, facultyId,
            pageable
        );
        return toPageDTO(page);
    }
}

