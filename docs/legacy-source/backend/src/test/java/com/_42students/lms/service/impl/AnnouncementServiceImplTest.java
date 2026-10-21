package com._42students.lms.service.impl;

import com._42students.lms.dto.request.AnnouncementCreateRequest;
import com._42students.lms.dto.response.AnnouncementResponseDTO;
import com._42students.lms.enums.AnnouncementType;
import com._42students.lms.enums.FacultyType;
import com._42students.lms.model.Announcement;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.AnnouncementRepository;
import com._42students.lms.service.FacultyService;
import com._42students.lms.service.LearnerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com._42students.lms.dto.response.PageDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AnnouncementServiceImpl covering all methods and edge cases.
 */
@ExtendWith(MockitoExtension.class)
class AnnouncementServiceImplTest {

    @Mock
    private AnnouncementRepository announcementRepository;

    @Mock
    private FacultyService facultyService;

    @Mock
    private LearnerService learnerService;

    @InjectMocks
    private AnnouncementServiceImpl announcementService;

    private static Announcement announcement(long id, AnnouncementType type, Long value, boolean deleted) {
        Announcement a = new Announcement();
        a.setId(id);
        a.setReceiverType(type);
        a.setReceiverValue(value);
        a.setTitle("Title");
        a.setMessage("Message");
        a.setSenderType("ADMIN");
        a.setSenderId(1L);
        a.setIsDeleted(deleted);
        a.setCreatedAt(LocalDateTime.now());
        a.setUpdatedAt(LocalDateTime.now());
        return a;
    }

    private static AnnouncementCreateRequest req(AnnouncementType type, Long value) {
        AnnouncementCreateRequest r = new AnnouncementCreateRequest();
        r.setReceiverType(type);
        r.setReceiverValue(value);
        r.setTitle("Title");
        r.setMessage("Message");
        r.setSenderId(1L);
        r.setSenderType("FACULTY");
        return r;
    }

    // ==================== createAnnouncement ====================

    @Nested
    @DisplayName("createAnnouncement")
    class CreateAnnouncement {

        @Test
        @DisplayName("creates announcement and sets isDeleted false")
        void create_setsIsDeletedFalse() {
            AnnouncementCreateRequest request = req(AnnouncementType.COLLEGE, 1L);
            Announcement saved = announcement(1L, AnnouncementType.COLLEGE, 1L, false);
            when(facultyService.getFacultyDetails(anyString())).thenReturn(null);
            when(announcementRepository.save(any(Announcement.class))).thenAnswer(inv -> {
                Announcement a = inv.getArgument(0);
                a.setId(1L);
                return a;
            });

            Announcement result = announcementService.createAnnouncement(request);

            assertNotNull(result);
            assertFalse(result.getIsDeleted());
            assertEquals(AnnouncementType.COLLEGE, result.getReceiverType());
            assertEquals(1L, result.getReceiverValue());
            assertEquals("Title", result.getTitle());
            assertEquals("Message", result.getMessage());
            verify(announcementRepository).save(any(Announcement.class));
        }

        @Test
        @DisplayName("sets senderType FACULTY when facultyService returns null")
        void create_facultyServiceNull_setsFaculty() {
            AnnouncementCreateRequest request = req(AnnouncementType.COLLEGE, 1L);
            request.setSenderType("FACULTY");
            when(facultyService.getFacultyDetails("1")).thenReturn(null);
            when(announcementRepository.save(any(Announcement.class))).thenAnswer(inv -> inv.getArgument(0));

            Announcement result = announcementService.createAnnouncement(request);

            assertEquals("FACULTY", result.getSenderType());
        }

        @Test
        @DisplayName("sets senderType from faculty.getFacultyType when faculty exists")
        void create_facultyExists_setsFacultyType() {
            Faculty faculty = new Faculty();
            faculty.setFacultyType(FacultyType.HEAD);
            AnnouncementCreateRequest request = req(AnnouncementType.COLLEGE, 1L);
            request.setSenderType("ADMIN");
            when(facultyService.getFacultyDetails("1")).thenReturn(faculty);
            when(announcementRepository.save(any(Announcement.class))).thenAnswer(inv -> inv.getArgument(0));

            Announcement result = announcementService.createAnnouncement(request);

            assertEquals("HEAD", result.getSenderType());
        }

        @Test
        @DisplayName("sets senderType LEARNER when senderType is LEARNER")
        void create_senderTypeLearner_setsLearner() {
            AnnouncementCreateRequest request = req(AnnouncementType.COLLEGE, 1L);
            request.setSenderType("LEARNER");
            when(announcementRepository.save(any(Announcement.class))).thenAnswer(inv -> inv.getArgument(0));

            Announcement result = announcementService.createAnnouncement(request);

            assertEquals("LEARNER", result.getSenderType());
        }

        @Test
        @DisplayName("handles senderType null - does not NPE")
        void create_senderTypeNull_noNPE() {
            AnnouncementCreateRequest request = req(AnnouncementType.COLLEGE, 1L);
            request.setSenderType(null);
            when(announcementRepository.save(any(Announcement.class))).thenAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> announcementService.createAnnouncement(request));
        }

        @Test
        @DisplayName("handles senderId null with FACULTY type - skips lookup entirely, sets FACULTY")
        void create_senderIdNull_facultyType_noNPE() {
            AnnouncementCreateRequest request = req(AnnouncementType.COLLEGE, 1L);
            request.setSenderType("FACULTY");
            request.setSenderId(null);
            when(announcementRepository.save(any(Announcement.class))).thenAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> {
                Announcement result = announcementService.createAnnouncement(request);
                assertEquals("FACULTY", result.getSenderType());
            });
            // A null senderId must not be stringified into a "null" faculty lookup.
            verify(facultyService, never()).getFacultyDetails(anyString());
        }
    }

    // ==================== findAll ====================

    @Nested
    @DisplayName("findAll")
    class FindAll {

        @Test
        @DisplayName("returns empty list when no announcements")
        void findAll_empty_returnsEmpty() {
            when(announcementRepository.findAllActive()).thenReturn(Collections.emptyList());

            List<AnnouncementResponseDTO> result = announcementService.findAll();

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("returns DTOs with senderName populated when faculty exists")
        void findAll_populatesSenderName() {
            Announcement a = announcement(1L, AnnouncementType.COLLEGE, 1L, false);
            a.setSenderId(10L);
            a.setSenderType("ADMIN");
            Faculty faculty = new Faculty();
            faculty.setFirstName("John");
            when(announcementRepository.findAllActive()).thenReturn(Collections.singletonList(a));
            when(facultyService.getFacultyDetails("10")).thenReturn(faculty);

            List<AnnouncementResponseDTO> result = announcementService.findAll();

            assertEquals(1, result.size());
            assertEquals("John", result.get(0).getSenderName());
        }

        @Test
        @DisplayName("returns DTOs with null senderName when faculty not found")
        void findAll_facultyNotFound_senderNameNull() {
            Announcement a = announcement(1L, AnnouncementType.COLLEGE, 1L, false);
            a.setSenderId(10L);
            when(announcementRepository.findAllActive()).thenReturn(Collections.singletonList(a));
            when(facultyService.getFacultyDetails("10")).thenReturn(null);

            List<AnnouncementResponseDTO> result = announcementService.findAll();

            assertEquals(1, result.size());
            assertNull(result.get(0).getSenderName());
        }

        @Test
        @DisplayName("populates learner senderName when senderType is LEARNER")
        void findAll_learnerSender_populatesSenderName() {
            Announcement a = announcement(1L, AnnouncementType.LEARNER, 42L, false);
            a.setSenderId(42L);
            a.setSenderType("LEARNER");
            Learner learner = new Learner();
            learner.setFirstName("Jane");
            when(announcementRepository.findAllActive()).thenReturn(Collections.singletonList(a));
            when(learnerService.getLearnerDetails("42")).thenReturn(learner);

            List<AnnouncementResponseDTO> result = announcementService.findAll();

            assertEquals(1, result.size());
            assertEquals("Jane", result.get(0).getSenderName());
        }
    }

    // ==================== findById ====================

    @Nested
    @DisplayName("findById")
    class FindById {

        @Test
        @DisplayName("returns Optional with value when exists")
        void findById_exists_returnsPresent() {
            Announcement a = announcement(5L, AnnouncementType.COLLEGE, 1L, false);
            when(announcementRepository.findById(5L)).thenReturn(Optional.of(a));

            Optional<Announcement> result = announcementService.findById(5L);

            assertTrue(result.isPresent());
            assertEquals(5L, result.get().getId());
        }

        @Test
        @DisplayName("returns Optional empty when not exists")
        void findById_notExists_returnsEmpty() {
            when(announcementRepository.findById(999L)).thenReturn(Optional.empty());

            Optional<Announcement> result = announcementService.findById(999L);

            assertTrue(result.isEmpty());
        }
    }

    // ==================== updateAnnouncement ====================

    @Nested
    @DisplayName("updateAnnouncement")
    class UpdateAnnouncement {

        @Test
        @DisplayName("updates existing announcement")
        void update_exists_updatesAndReturns() {
            Announcement existing = announcement(5L, AnnouncementType.COLLEGE, 1L, false);
            AnnouncementCreateRequest request = req(AnnouncementType.DEPARTMENT, 2L);
            request.setTitle("Updated Title");
            request.setMessage("Updated Message");
            when(announcementRepository.findById(5L)).thenReturn(Optional.of(existing));
            when(announcementRepository.save(any(Announcement.class))).thenAnswer(inv -> inv.getArgument(0));

            Announcement result = announcementService.updateAnnouncement(5L, request);

            assertEquals(5L, result.getId());
            assertEquals(AnnouncementType.DEPARTMENT, result.getReceiverType());
            assertEquals(2L, result.getReceiverValue());
            assertEquals("Updated Title", result.getTitle());
            assertEquals("Updated Message", result.getMessage());
        }

        @Test
        @DisplayName("throws when id not found")
        void update_notExists_throws() {
            when(announcementRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class, () ->
                    announcementService.updateAnnouncement(999L, req(AnnouncementType.COLLEGE, 1L)));
            assertTrue(ex.getMessage().contains("Announcement not found with id 999"));
            verify(announcementRepository, never()).save(any());
        }

        @Test
        @DisplayName("partial update - only title changed when message null in request")
        void update_partialOnlyTitle() {
            Announcement existing = announcement(5L, AnnouncementType.COLLEGE, 1L, false);
            existing.setMessage("Original");
            AnnouncementCreateRequest request = req(AnnouncementType.COLLEGE, 1L);
            request.setMessage(null);
            request.setTitle("New Title");
            when(announcementRepository.findById(5L)).thenReturn(Optional.of(existing));
            when(announcementRepository.save(any(Announcement.class))).thenAnswer(inv -> inv.getArgument(0));

            Announcement result = announcementService.updateAnnouncement(5L, request);

            assertEquals("New Title", result.getTitle());
            assertEquals("Original", result.getMessage());
        }
    }

    // ==================== deleteAnnouncement ====================

    @Nested
    @DisplayName("deleteAnnouncement")
    class DeleteAnnouncement {

        @Test
        @DisplayName("soft deletes existing announcement")
        void delete_exists_setsIsDeletedTrue() {
            Announcement existing = announcement(5L, AnnouncementType.COLLEGE, 1L, false);
            when(announcementRepository.findById(5L)).thenReturn(Optional.of(existing));
            when(announcementRepository.save(any(Announcement.class))).thenAnswer(inv -> inv.getArgument(0));

            announcementService.deleteAnnouncement(5L);

            ArgumentCaptor<Announcement> captor = ArgumentCaptor.forClass(Announcement.class);
            verify(announcementRepository).save(captor.capture());
            assertTrue(captor.getValue().getIsDeleted());
        }

        @Test
        @DisplayName("throws when id not found")
        void delete_notExists_throws() {
            when(announcementRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class, () ->
                    announcementService.deleteAnnouncement(999L));
            assertTrue(ex.getMessage().contains("Announcement not found with id 999"));
            verify(announcementRepository, never()).save(any());
        }
    }

    // ==================== fetchLearnerAnnouncements ====================

    @Nested
    @DisplayName("fetchLearnerAnnouncements")
    class FetchLearnerAnnouncements {

        @Test
        @DisplayName("returns empty when no matches")
        void fetchLearner_empty_returnsEmpty() {
            when(announcementRepository.findByLearnerAnnouncements(
                    eq(AnnouncementType.COLLEGE), eq(1L),
                    eq(AnnouncementType.PROGRAM), eq(2L),
                    eq(AnnouncementType.CLASS), eq(3L),
                    eq(AnnouncementType.LEARNER), eq(42L)))
                    .thenReturn(Collections.emptyList());

            List<AnnouncementResponseDTO> result = announcementService.fetchLearnerAnnouncements(1L, 2L, 3L, 42L);

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("returns DTOs with correct receiverType")
        void fetchLearner_withMatches_returnsDTOs() {
            Announcement a = announcement(1L, AnnouncementType.COLLEGE, 1L, false);
            when(announcementRepository.findByLearnerAnnouncements(
                    eq(AnnouncementType.COLLEGE), eq(1L),
                    eq(AnnouncementType.PROGRAM), eq(2L),
                    eq(AnnouncementType.CLASS), eq(3L),
                    eq(AnnouncementType.LEARNER), eq(42L)))
                    .thenReturn(Collections.singletonList(a));

            List<AnnouncementResponseDTO> result = announcementService.fetchLearnerAnnouncements(1L, 2L, 3L, 42L);

            assertEquals(1, result.size());
            assertEquals(AnnouncementType.COLLEGE, result.get(0).getReceiverType());
            assertEquals(1L, result.get(0).getReceiverValue());
        }

        @Test
        @DisplayName("handles zero IDs - passes to repository")
        void fetchLearner_zeroIds_passesToRepository() {
            when(announcementRepository.findByLearnerAnnouncements(
                    eq(AnnouncementType.COLLEGE), eq(0L),
                    eq(AnnouncementType.PROGRAM), eq(0L),
                    eq(AnnouncementType.CLASS), eq(0L),
                    eq(AnnouncementType.LEARNER), eq(42L)))
                    .thenReturn(Collections.emptyList());

            List<AnnouncementResponseDTO> result = announcementService.fetchLearnerAnnouncements(0L, 0L, 0L, 42L);

            assertTrue(result.isEmpty());
        }
    }

    // ==================== fetchFacultyAnnouncements ====================

    @Nested
    @DisplayName("fetchFacultyAnnouncements")
    class FetchFacultyAnnouncements {

        @Test
        @DisplayName("returns empty when no matches")
        void fetchFaculty_empty_returnsEmpty() {
            when(announcementRepository.findByFacultyAnnouncements(
                    eq(AnnouncementType.COLLEGE), eq(1L),
                    eq(AnnouncementType.DEPARTMENT), eq(0L),
                    eq(AnnouncementType.FACULTY), eq(0L)))
                    .thenReturn(Collections.emptyList());

            List<AnnouncementResponseDTO> result = announcementService.fetchFacultyAnnouncements(1L, 0L, 0L);

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("returns DTOs when matches exist")
        void fetchFaculty_withMatches_returnsDTOs() {
            Announcement a = announcement(1L, AnnouncementType.COLLEGE, 1L, false);
            when(announcementRepository.findByFacultyAnnouncements(
                    eq(AnnouncementType.COLLEGE), eq(1L),
                    eq(AnnouncementType.DEPARTMENT), eq(5L),
                    eq(AnnouncementType.FACULTY), eq(10L)))
                    .thenReturn(Collections.singletonList(a));

            List<AnnouncementResponseDTO> result = announcementService.fetchFacultyAnnouncements(1L, 5L, 10L);

            assertEquals(1, result.size());
            assertEquals(AnnouncementType.COLLEGE, result.get(0).getReceiverType());
        }
    }

    @Nested
    @DisplayName("findAllScopedPaged pagination clamping")
    class FindAllScopedPagedClamping {

        private Page<Announcement> pageOf(List<Announcement> content, Pageable pageable, long total) {
            return new PageImpl<>(content, pageable, total);
        }

        @Test
        @DisplayName("negative pageNumber is clamped to 0 and pageSize below 1 is clamped to 1")
        void clampsNegativePageAndTinySize() {
            ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
            when(announcementRepository.findAllActive(any(Pageable.class)))
                    .thenAnswer(inv -> pageOf(Collections.emptyList(), inv.getArgument(0), 0));

            announcementService.findAllScopedPaged(null, null, -5, 0);

            verify(announcementRepository).findAllActive(captor.capture());
            assertEquals(0, captor.getValue().getPageNumber());
            assertEquals(1, captor.getValue().getPageSize());
        }

        @Test
        @DisplayName("pageSize above the cap is clamped to MAX_PAGE_SIZE")
        void clampsOversizedPageSize() {
            ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
            when(announcementRepository.findAllActive(any(Pageable.class)))
                    .thenAnswer(inv -> pageOf(Collections.emptyList(), inv.getArgument(0), 0));

            announcementService.findAllScopedPaged(null, null, 0, 5000);

            verify(announcementRepository).findAllActive(captor.capture());
            assertEquals(200, captor.getValue().getPageSize());
        }

        @Test
        @DisplayName("a page past the end is re-fetched at the last page that has rows")
        void clampsBeyondRangeToLastPage() {
            // 2 rows at size 1 => pages 0 and 1. Asking for page 99 must come back as page 1.
            Announcement a = new Announcement();
            a.setId(2L);
            when(announcementRepository.findAllActive(any(Pageable.class)))
                    .thenAnswer(inv -> {
                        Pageable p = inv.getArgument(0);
                        List<Announcement> content = p.getPageNumber() == 1
                                ? Collections.singletonList(a)
                                : Collections.emptyList();
                        return pageOf(content, p, 2);
                    });

            PageDTO<AnnouncementResponseDTO> result = announcementService.findAllScopedPaged(null, null, 99, 1);

            assertEquals(1, result.getPageNumber());
            assertEquals(1, result.getRecords().size());
            assertEquals(2, result.getTotalRecords());
        }

        @Test
        @DisplayName("an empty result set is not re-fetched (no clamp when there are no rows)")
        void doesNotClampWhenEmpty() {
            when(announcementRepository.findAllActive(any(Pageable.class)))
                    .thenAnswer(inv -> pageOf(Collections.emptyList(), inv.getArgument(0), 0));

            PageDTO<AnnouncementResponseDTO> result = announcementService.findAllScopedPaged(null, null, 99, 10);

            assertEquals(0, result.getTotalRecords());
            verify(announcementRepository, times(1)).findAllActive(any(Pageable.class));
        }
    }
}
