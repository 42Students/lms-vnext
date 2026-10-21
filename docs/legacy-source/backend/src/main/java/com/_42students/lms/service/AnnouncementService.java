package com._42students.lms.service;

import java.util.List;
import java.util.Optional;

import com._42students.lms.dto.request.AnnouncementCreateRequest;
import com._42students.lms.dto.response.AnnouncementResponseDTO;
import com._42students.lms.dto.response.PageDTO;
import com._42students.lms.enums.AnnouncementType;
import com._42students.lms.model.Announcement;

public interface AnnouncementService {

    Announcement createAnnouncement(AnnouncementCreateRequest request);

    List<AnnouncementResponseDTO> findAll();

    /** Superadmin scoped fetch: respects orgId/collegeId from JWT scope. */
    List<AnnouncementResponseDTO> findAllScoped(Integer orgId, Integer collegeId);

    /** DB-level paginated variant of {@link #findAllScoped} — avoids loading the full scope into memory. */
    PageDTO<AnnouncementResponseDTO> findAllScopedPaged(Integer orgId, Integer collegeId, int pageNumber, int pageSize);

    Optional<Announcement> findById(Long id);

    Announcement updateAnnouncement(Long id, AnnouncementCreateRequest request);

    void deleteAnnouncement(Long id);

    /** Reverses a soft delete. The only recovery path through the product for one. */
    com._42students.lms.model.Announcement restoreAnnouncement(Long id);

    /** Soft-deleted announcements, newest-deleted first — filtered by receiver access in the controller. */
    java.util.List<com._42students.lms.model.Announcement> findAllDeleted();

    List<AnnouncementResponseDTO> fetchLearnerAnnouncements(Long collegeId, Long programId, Long classId, Long learnerId);

    /** DB-level paginated variant of {@link #fetchLearnerAnnouncements}. */
    PageDTO<AnnouncementResponseDTO> fetchLearnerAnnouncementsPaged(Long collegeId, Long programId, Long classId, Long learnerId, int pageNumber, int pageSize);

    List<AnnouncementResponseDTO> fetchFacultyAnnouncements(Long collegeId, Long deptId, Long facultyId);

    /** DB-level paginated variant of {@link #fetchFacultyAnnouncements}. */
    PageDTO<AnnouncementResponseDTO> fetchFacultyAnnouncementsPaged(Long collegeId, Long deptId, Long facultyId, int pageNumber, int pageSize);
}
 

