package com._42students.lms.service.impl;

import com._42students.lms.dto.request.ContentDataDTO;
import com._42students.lms.dto.request.ContentProgressSaveRequest;
import com._42students.lms.dto.response.ContentProgressResponse;
import com._42students.lms.model.LearnerContentProgress;
import com._42students.lms.model.LessonContents;
import com._42students.lms.repository.LearnerContentProgressRepository;
import com._42students.lms.repository.LessonContentsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Audit finding 5.1 — "progress completion is entirely client-asserted and trivially forgeable".
 *
 * <p>Both sides of the watched-percentage calculation used to come from the learner's own request,
 * so a request carrying {@code {lastPosition: 100, duration: 100}} certified its own completion.
 * The position has to come from the client — only the player knows where the learner got to — but
 * the duration is a property of the content, authored through a faculty-only path.
 *
 * <p>These tests pin the forged case, and equally importantly the fallback case: content with no
 * authored duration must keep behaving exactly as it did, or every existing video silently stops
 * being completable.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Video completion — authored duration wins over the client's")
class LearnerContentProgressCompletionTest {

    @Mock private LearnerContentProgressRepository repository;
    @Mock private LessonContentsRepository lessonContentsRepository;

    private LearnerContentProgressServiceImpl service;

    private static final int LEARNER_ID = 7;
    private static final int CONTENT_ID = 55;

    @BeforeEach
    void setUp() {
        service = new LearnerContentProgressServiceImpl(repository);
        ReflectionTestUtils.setField(service, "lessonContentsRepository", lessonContentsRepository);
        // Attempts (audit 5.5): reads target the learner's current attempt, so this is the finder
        // the service uses. Empty means "never started", which is attempt 1.
        lenient().when(repository.findTopByLearnerIdAndLessonContentIdOrderByAttemptDesc(LEARNER_ID, CONTENT_ID))
                .thenReturn(Optional.empty());
        lenient().when(repository.saveAndFlush(any(LearnerContentProgress.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    /** A video whose real length is {@code authoredSeconds}, or unknown when null. */
    private void givenVideoContent(Integer authoredSeconds) {
        LessonContents content = new LessonContents();
        content.setContentType("video");
        if (authoredSeconds != null) {
            ContentDataDTO data = new ContentDataDTO();
            data.setDuration(authoredSeconds.longValue());
            content.setContentDataDTO(data);
        }
        when(lessonContentsRepository.findById(CONTENT_ID)).thenReturn(Optional.of(content));
    }

    private ContentProgressResponse save(int lastPosition, int duration, Boolean completed) {
        ContentProgressSaveRequest req = new ContentProgressSaveRequest();
        req.setLessonContentId(CONTENT_ID);
        req.setLastPositionSeconds(lastPosition);
        req.setDurationSeconds(duration);
        req.setCompleted(completed);
        return service.saveProgress(LEARNER_ID, req);
    }

    private boolean isCompleted(ContentProgressResponse res) {
        return res.getCompletedAt() != null;
    }

    @Test
    @DisplayName("the forged case: a consistent short position/duration pair no longer completes a long video")
    void forgedSelfConsistentPairIsRejected() {
        givenVideoContent(3600); // a real one-hour video
        ContentProgressResponse res = save(100, 100, null);
        assertFalse(isCompleted(res),
                "100 seconds into a one-hour video is not a completion, whatever duration the client claims");
        assertEquals(3600, res.getDurationSeconds(), "the authored length is the one recorded");
    }

    @Test
    @DisplayName("genuinely watching to the end still completes")
    void genuineCompletionStillWorks() {
        givenVideoContent(3600);
        assertTrue(isCompleted(save(3400, 3600, null)), "94% of the real duration is past the threshold");
    }

    @Test
    @DisplayName("a position past the real end is clamped, not counted as over-completion")
    void positionBeyondAuthoredDurationIsClamped() {
        givenVideoContent(600);
        ContentProgressResponse res = save(99999, 99999, null);
        assertEquals(600, res.getLastPositionSeconds());
        assertEquals(600, res.getDurationSeconds());
    }

    @Test
    @DisplayName("content with no authored duration keeps the previous behaviour")
    void unknownDurationFallsBackToTheClient() {
        givenVideoContent(null);
        assertTrue(isCompleted(save(95, 100, null)),
                "without an authored duration the client's figures are all there is — this must not regress");
    }

    @Test
    @DisplayName("a bare completed=true still cannot complete a video")
    void bareCompletedFlagStillRejectedForVideo() {
        givenVideoContent(3600);
        assertFalse(isCompleted(save(0, 0, true)));
    }

    @Test
    @DisplayName("a bare completed=true is still honoured for untimed content")
    void bareCompletedFlagStillHonouredForPdf() {
        LessonContents content = new LessonContents();
        content.setContentType("resource");
        when(lessonContentsRepository.findById(CONTENT_ID)).thenReturn(Optional.of(content));
        assertTrue(isCompleted(save(0, 0, true)),
                "a PDF has no watched percentage to forge — self-report is legitimate there");
    }
}
