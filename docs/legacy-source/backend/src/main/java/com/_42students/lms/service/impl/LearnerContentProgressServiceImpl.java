package com._42students.lms.service.impl;

import com._42students.lms.dto.request.ContentProgressSaveRequest;
import com._42students.lms.dto.response.ContentProgressResponse;
import com._42students.lms.model.LearnerContentProgress;
import com._42students.lms.repository.LearnerContentProgressRepository;
import com._42students.lms.service.LearnerContentProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearnerContentProgressServiceImpl implements LearnerContentProgressService {

    /** Default when no GLOBAL "course.watchedThresholdPercent" override is set. */
    private static final int WATCHED_THRESHOLD_PERCENT_DEFAULT = 90;
    /** Max seconds for position/duration (24 hours); avoids overflow / bad client data */
    private static final int MAX_POSITION_DURATION_SECONDS = 86400 * 24;
    /** Max number of lesson content IDs in a single bulk request */
    private static final int MAX_BULK_IDS_DEFAULT = 500;

    private int maxBulkIds() {
        return appSettingsService != null ? appSettingsService.getProgressBulkIdsMax() : MAX_BULK_IDS_DEFAULT;
    }

    private final LearnerContentProgressRepository repository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    com._42students.lms.repository.LessonContentsRepository lessonContentsRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.service.AppSettingsService appSettingsService;

    // Platform-wide, not per-college — a video is 90% watched the same everywhere, so this reads
    // GLOBAL scope only (superadmin > Courses & Content > Lesson Content).
    private int watchedThresholdPercent() {
        return appSettingsService != null
                ? appSettingsService.getInt("GLOBAL", null, "course.watchedThresholdPercent", WATCHED_THRESHOLD_PERCENT_DEFAULT)
                : WATCHED_THRESHOLD_PERCENT_DEFAULT;
    }

    // Content types where "completed" has a meaningful watched-percentage definition, and a bare
    // client-asserted completed=true is therefore untrustworthy on its own.
    private static final Set<String> TIMED_CONTENT_TYPES = Set.of("video", "youtube");

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.transaction.PlatformTransactionManager transactionManager;

    /**
     * Runs one write in its own transaction. The concurrent-insert recovery below used to run in
     * the SAME transaction as the failed insert: after the unique-key violation the Hibernate
     * session was broken ("null id ... don't flush the Session after an exception") and the
     * transaction was rollback-only, so the retry always failed and the learner got a 500.
     */
    private <T> T inNewTransaction(java.util.function.Supplier<T> work) {
        if (transactionManager == null) return work.get();
        org.springframework.transaction.support.TransactionTemplate tx =
                new org.springframework.transaction.support.TransactionTemplate(transactionManager);
        tx.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return tx.execute(status -> work.get());
    }

    @Override
    public ContentProgressResponse saveProgress(int learnerId, ContentProgressSaveRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Progress request cannot be null");
        }
        Integer lessonContentIdBoxed = request.getLessonContentId();
        if (lessonContentIdBoxed == null || lessonContentIdBoxed <= 0) {
            throw new IllegalArgumentException("lessonContentId must be a positive integer");
        }
        int lessonContentId = lessonContentIdBoxed;
        int lastPositionSeconds = clampPositionOrDuration(request.getLastPositionSeconds());
        int durationSeconds = clampPositionOrDuration(request.getDurationSeconds());
        // 5.3: nothing previously rejected lastPosition > duration, producing >100% progress
        // bars. A device reporting a stale/short duration alongside a further-along position is
        // clamped rather than trusted outright.
        if (durationSeconds > 0 && lastPositionSeconds > durationSeconds) {
            lastPositionSeconds = durationSeconds;
        }
        boolean markCompleted = Boolean.TRUE.equals(request.getCompleted());
        boolean clearCompleted = Boolean.FALSE.equals(request.getCompleted());
        // For video/youtube content, a bare client-asserted completed=true is a one-line
        // integrity bypass: PUT {lessonContentId, completed: true} marks a video watched without
        // playing a frame. It is honored for every OTHER content type (pdf/ppt/BYO/lecture),
        // where "completed" is a legitimate self-report with no watched-percentage to forge.
        //
        // This does not fully close the finding: durationSeconds is still client-supplied (no
        // column stores a video's real duration server-side today), so
        // {lastPosition: 100, duration: 100} still self-certifies the ratio check. Closing that
        // needs a schema change (store duration at upload time) and is deliberately not attempted
        // here. What this does close is the trivial single-flag bypass, and it means a forged
        // completion at least has to submit internally-consistent position/duration values rather
        // than a bare boolean.
        if (markCompleted && isTimedContentType(lessonContentId)) {
            markCompleted = false;
        }
        // 5.1, second half: prefer the duration recorded on the content itself over the one in the
        // request. This is what stops a consistent-but-forged {lastPosition: 100, duration: 100}
        // pair from certifying its own completion -- the ratio is now measured against a number
        // the learner has no way to set. The client's value is still accepted as a fallback for
        // content that has no authored duration, which is how everything behaved before.
        int authoredDuration = authoredDurationSeconds(lessonContentId);
        if (authoredDuration > 0) {
            durationSeconds = authoredDuration;
            // Re-clamp: a position past the real end (from a stale or forged duration) is capped
            // at the real end rather than counted as over-completion.
            if (lastPositionSeconds > durationSeconds) {
                lastPositionSeconds = durationSeconds;
            }
        }
        // Only auto-set completed from percent when we have a real duration; otherwise only explicit markCompleted
        boolean shouldSetCompleted = markCompleted || (durationSeconds > 0 && isWatched(lastPositionSeconds, durationSeconds));

        final int position = lastPositionSeconds;
        final int duration = durationSeconds;
        final boolean setCompleted = shouldSetCompleted;
        final int[] attemptHolder = {1};
        LearnerContentProgress entity;
        try {
            entity = inNewTransaction(() -> {
                // 5.5: work on the learner's current attempt. Earlier attempts are history and are never
                // written to again, so a retake starts from nothing rather than inheriting completions.
                Optional<LearnerContentProgress> existing =
                        repository.findTopByLearnerIdAndLessonContentIdOrderByAttemptDesc(learnerId, lessonContentId);
                LearnerContentProgress row;
                if (existing.isPresent()) {
                    row = existing.get();
                    attemptHolder[0] = row.getAttempt();
                } else {
                    row = new LearnerContentProgress();
                    row.setLearnerId(learnerId);
                    row.setLessonContentId(lessonContentId);
                    row.setAttempt(1);
                }
                applyProgress(row, position, duration, setCompleted, clearCompleted);
                return repository.saveAndFlush(row);
            });
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            final int attempt = attemptHolder[0];
            // CC-19: concurrent insert on (learner_id, lesson_content_id) unique constraint —
            // re-read and update the row that won the race
            // Reads that exact attempt rather than the highest: if a new attempt were started in
            // the same instant, the winner of THIS race is the row for the attempt we tried to
            // write, not whatever is newest.
            entity = inNewTransaction(() -> {
                LearnerContentProgress winner = repository
                        .findByLearnerIdAndLessonContentIdAndAttempt(learnerId, lessonContentId, attempt)
                        .orElseThrow(() -> e);
                applyProgress(winner, position, duration, setCompleted, clearCompleted);
                return repository.saveAndFlush(winner);
            });
        }
        return toResponse(entity);
    }

    /**
     * Applies one progress update onto (new or existing) entity in place. Shared by the normal
     * path and the concurrent-insert race-recovery path so both apply identical semantics.
     */
    private void applyProgress(LearnerContentProgress entity, int lastPositionSeconds, int durationSeconds,
                               boolean shouldSetCompleted, boolean clearCompleted) {
        entity.setLastPositionSeconds(lastPositionSeconds);
        // 5.2: duration is treated as authoritative once known, not overwritten on every save.
        // Two devices reporting slightly different durations for the same content (encoder
        // rounding, a slow metadata load) previously flip-flopped the stored value on every save.
        // A genuine duration for a fixed piece of content should never legitimately shrink, so the
        // larger of the stored and incoming values wins; 0 (unknown) is never preferred over a
        // real value already on file.
        entity.setDurationSeconds(Math.max(entity.getDurationSeconds(), durationSeconds));
        if (clearCompleted) {
            entity.setCompletedAt(null);
        }
        if (shouldSetCompleted && entity.getCompletedAt() == null) {
            Instant now = Instant.now();
            entity.setCompletedAt(now);
            // 5.4: set once, on the very first completion, and never cleared -- survives a later
            // {completed: false} rewatch, which only clears completedAt above.
            if (entity.getFirstCompletedAt() == null) {
                entity.setFirstCompletedAt(now);
            }
        }
    }

    private static int clampPositionOrDuration(int value) {
        if (value < 0) return 0;
        return Math.min(value, MAX_POSITION_DURATION_SECONDS);
    }

    @Override
    public ContentProgressResponse getProgress(int learnerId, int lessonContentId) {
        if (lessonContentId <= 0) {
            return notStartedResponse(lessonContentId);
        }
        return repository.findTopByLearnerIdAndLessonContentIdOrderByAttemptDesc(learnerId, lessonContentId)
                .map(this::toResponse)
                .orElse(notStartedResponse(lessonContentId));
    }

    @Override
    public List<ContentProgressResponse> getProgressBulk(int learnerId, List<Integer> lessonContentIds) {
        if (lessonContentIds == null || lessonContentIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<Integer> distinctIds = lessonContentIds.stream()
                .distinct()
                .filter(Objects::nonNull)
                .filter(id -> id > 0)
                .collect(Collectors.toList());
        if (distinctIds.isEmpty()) {
            return Collections.emptyList();
        }
        // 5.7: previously .limit(...) silently truncated an over-large request, so a
        // lesson with more than 500 content items returned partial progress with no indication
        // anything was cut. Reject outright instead -- the caller can page/chunk the request.
        if (distinctIds.size() > maxBulkIds()) {
            throw new IllegalArgumentException(
                    "Too many lessonContentIds in one request (max " + maxBulkIds() + "); split into smaller batches.");
        }
        List<LearnerContentProgress> list = repository.findByLearnerIdAndLessonContentIdIn(learnerId, distinctIds);
        Map<Integer, ContentProgressResponse> byContentId = list.stream()
                .map(this::toResponse)
                .collect(Collectors.toMap(ContentProgressResponse::getLessonContentId, r -> r, (r1, r2) -> r2));
        return distinctIds.stream()
                .map(id -> byContentId.getOrDefault(id, notStartedResponse(id)))
                .collect(Collectors.toList());
    }

    private ContentProgressResponse toResponse(LearnerContentProgress p) {
        int percent = computePercent(p.getLastPositionSeconds(), p.getDurationSeconds());
        String status = p.getCompletedAt() != null ? "WATCHED"
                : (percent >= watchedThresholdPercent() ? "WATCHED"
                : (percent > 0 ? "IN_PROGRESS" : "NOT_STARTED"));
        if (p.getCompletedAt() != null) {
            percent = 100;
        }
        return ContentProgressResponse.builder()
                .lessonContentId(p.getLessonContentId())
                .lastPositionSeconds(p.getLastPositionSeconds())
                .durationSeconds(p.getDurationSeconds())
                .completedAt(p.getCompletedAt())
                .firstCompletedAt(p.getFirstCompletedAt())
                .status(status)
                .percentWatched(percent)
                .build();
    }

    private ContentProgressResponse notStartedResponse(int lessonContentId) {
        return ContentProgressResponse.builder()
                .lessonContentId(lessonContentId)
                .lastPositionSeconds(0)
                .durationSeconds(0)
                .completedAt(null)
                .status("NOT_STARTED")
                .percentWatched(0)
                .build();
    }

    private static int computePercent(int position, int duration) {
        if (duration <= 0) return 0;
        return (int) Math.min(100, Math.round(100.0 * position / duration));
    }

    private boolean isWatched(int position, int duration) {
        if (duration <= 0) return false;
        if (position <= 0) return false;
        return 100.0 * position / duration >= watchedThresholdPercent();
    }

    private boolean isTimedContentType(int lessonContentId) {
        if (lessonContentsRepository == null) return false;
        return lessonContentsRepository.findById(lessonContentId)
                .map(c -> c.getContentType() != null
                        && TIMED_CONTENT_TYPES.contains(c.getContentType().toLowerCase()))
                .orElse(false);
    }

    /**
     * 5.1: the authored duration of a piece of content, in seconds, or 0 when none was recorded.
     *
     * <p>Both sides of the watched-percentage calculation used to come from the learner's own
     * request, so {@code {lastPosition: 100, duration: 100}} self-certified a completion. The
     * position genuinely has to come from the client — only the player knows where the learner
     * got to — but the duration does not: it is a property of the content, set through the
     * faculty authoring path, which a learner cannot reach.
     *
     * <p>Where a duration was authored it is the only one trusted. Where it wasn't, behaviour is
     * unchanged, so no existing content stops working.
     */
    private int authoredDurationSeconds(int lessonContentId) {
        if (lessonContentsRepository == null) return 0;
        return lessonContentsRepository.findById(lessonContentId)
                .map(com._42students.lms.model.LessonContents::getContentDataDTO)
                .map(data -> data.getDuration())
                .filter(d -> d != null && d > 0 && d <= MAX_POSITION_DURATION_SECONDS)
                .map(Long::intValue)
                .orElse(0);
    }
}

