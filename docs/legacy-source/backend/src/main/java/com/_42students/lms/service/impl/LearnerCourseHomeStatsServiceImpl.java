package com._42students.lms.service.impl;

import com._42students.lms.dto.response.*;
import com._42students.lms.model.*;
import com._42students.lms.repository.LearnerContentProgressRepository;
import com._42students.lms.repository.LessonContentClassSequenceRepository;
import com._42students.lms.repository.LessonContentsRepository;
import com._42students.lms.repository.StudentAssignmentRepository;
import com._42students.lms.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class LearnerCourseHomeStatsServiceImpl implements LearnerCourseHomeStatsService {

    private static final int WATCHED_THRESHOLD_PERCENT_DEFAULT = 90;
    /** Minimum progress (%) to consider a video "in progress". Below this, treat as not started (e.g. opened randomly and left). */
    private static final int MIN_IN_PROGRESS_PERCENT_DEFAULT = 5;

    private final CourseService courseService;
    private final LessonService lessonService;
    private final LessonContentsRepository lessonContentsRepository;
    private final LessonContentClassSequenceRepository lessonContentClassSequenceRepository;
    private final StudentAssignmentRepository studentAssignmentRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.service.AppSettingsService appSettingsService;

    // Same GLOBAL keys as LearnerContentProgressServiceImpl — kept as two independent reads
    // (rather than merging the two services) so this fix doesn't also refactor unrelated stats
    // code; both now source the same configurable value instead of two separate hardcoded 90s.
    private int watchedThresholdPercent() {
        return appSettingsService != null
                ? appSettingsService.getInt("GLOBAL", null, "course.watchedThresholdPercent", WATCHED_THRESHOLD_PERCENT_DEFAULT)
                : WATCHED_THRESHOLD_PERCENT_DEFAULT;
    }

    private int minInProgressPercent() {
        return appSettingsService != null
                ? appSettingsService.getInt("GLOBAL", null, "course.minInProgressPercent", MIN_IN_PROGRESS_PERCENT_DEFAULT)
                : MIN_IN_PROGRESS_PERCENT_DEFAULT;
    }
    private final LearnerContentProgressRepository learnerContentProgressRepository;
    private final LearnerService learnerService;

    @Override
    public LearnerCourseHomeStatsDTO getHomeStats(int learnerId, int courseId, Integer classId) {
        int effectiveClassId = (classId != null && classId > 0) ? classId : 0;

        Course course = courseService.fetchCourse(courseId);
        if (course == null) return null;

        List<Lesson> lessons = lessonService.getLessons(courseId);
        if (lessons == null) lessons = Collections.emptyList();

        // Fetch content by type (course + class scoped)
        List<LessonContents> videoContents = fetchVideoContentsSafe(courseId, effectiveClassId);
        List<LessonContents> assignmentContents = fetchAssignmentContentsSafe(courseId, effectiveClassId);
        List<LessonContents> quizContents = fetchQuizContentsSafe(courseId, effectiveClassId);

        int videosTotal = videoContents.size();
        int assignmentsTotal = assignmentContents.size();
        int quizzesTotal = quizContents.size();
        int lessonsTotal = lessons.size();

        // Video progress (cap list size to avoid excessive IN clause)
        List<Integer> videoContentIds = videoContents.stream().map(LessonContents::getId).collect(Collectors.toList());
        // Same cap as LearnerContentProgressServiceImpl -- one shared GLOBAL setting now.
        final int MAX_BULK_IDS = appSettingsService != null ? appSettingsService.getProgressBulkIdsMax() : 500;
        if (videoContentIds.size() > MAX_BULK_IDS) {
            videoContentIds = videoContentIds.subList(0, MAX_BULK_IDS);
        }
        Map<Integer, LearnerContentProgress> progressMap = new HashMap<>();
        if (!videoContentIds.isEmpty()) {
            List<LearnerContentProgress> progressList = learnerContentProgressRepository
                    .findByLearnerIdAndLessonContentIdIn(learnerId, videoContentIds);
            progressList.forEach(p -> progressMap.put(p.getLessonContentId(), p));
        }

        int videosWatched = 0;
        for (LessonContents vc : videoContents) {
            LearnerContentProgress p = progressMap.get(vc.getId());
            if (p != null) {
                int percent = p.getDurationSeconds() > 0
                        ? (int) Math.min(100, Math.round(100.0 * p.getLastPositionSeconds() / p.getDurationSeconds()))
                        : 0;
                if (p.getCompletedAt() != null || percent >= watchedThresholdPercent()) {
                    videosWatched++;
                }
            }
        }

        // Assignment/Quiz submissions
        List<StudentAssignment> assignmentSubmissions = studentAssignmentRepository
                .fetchAssignmentSubmissionsByLearnerAndCourse(learnerId, courseId);
        List<StudentAssignment> quizSubmissions = studentAssignmentRepository
                .fetchQuizSubmissionsByLearnerAndCourse(learnerId, courseId);

        Set<Integer> submittedAssignmentIds = assignmentSubmissions.stream()
                .map(StudentAssignment::getLessonContentId).collect(Collectors.toSet());
        Set<Integer> submittedQuizIds = quizSubmissions.stream()
                .map(StudentAssignment::getLessonContentId).collect(Collectors.toSet());

        int assignmentsSubmitted = submittedAssignmentIds.size();
        int quizzesCompleted = submittedQuizIds.size();

        // Grades
        double assignmentAvgPercent = computeAssignmentAvg(assignmentSubmissions);
        double quizAvgPercent = computeQuizAvg(quizSubmissions);
        boolean hasGrades = assignmentAvgPercent >= 0 || quizAvgPercent >= 0;

        // Lessons completed: count lessons where all trackable content is done
        Map<Integer, List<LessonContents>> contentsByLesson = new HashMap<>();
        for (LessonContents lc : videoContents) { contentsByLesson.computeIfAbsent(lc.getLessonId(), k -> new ArrayList<>()).add(lc); }
        for (LessonContents lc : assignmentContents) { contentsByLesson.computeIfAbsent(lc.getLessonId(), k -> new ArrayList<>()).add(lc); }
        for (LessonContents lc : quizContents) { contentsByLesson.computeIfAbsent(lc.getLessonId(), k -> new ArrayList<>()).add(lc); }

        int lessonsCompleted = 0;
        final Set<Integer> finalSubmittedAssignmentIds = submittedAssignmentIds;
        final Set<Integer> finalSubmittedQuizIds = submittedQuizIds;
        for (Lesson lesson : lessons) {
            List<LessonContents> trackable = contentsByLesson.getOrDefault(lesson.getId(), Collections.emptyList());
            if (trackable.isEmpty()) { lessonsCompleted++; continue; }
            boolean allDone = trackable.stream().allMatch(lc -> {
                String type = (lc.getContentType() != null ? lc.getContentType() : "").toLowerCase();
                if ("video".equals(type) || "youtube".equals(type)) {
                    LearnerContentProgress pr = progressMap.get(lc.getId());
                    if (pr == null) return false;
                    int pct = pr.getDurationSeconds() > 0 ? (int)(100.0 * pr.getLastPositionSeconds() / pr.getDurationSeconds()) : 0;
                    return pr.getCompletedAt() != null || pct >= watchedThresholdPercent();
                }
                if ("assignment".equals(type)) return finalSubmittedAssignmentIds.contains(lc.getId());
                if ("quiz".equals(type)) return finalSubmittedQuizIds.contains(lc.getId());
                return true;
            });
            if (allDone) lessonsCompleted++;
        }

        // Overall percent: weighted by trackable items
        int totalTrackable = videosTotal + assignmentsTotal + quizzesTotal;
        int completedTrackable = videosWatched + assignmentsSubmitted + quizzesCompleted;
        int overallPercent = totalTrackable > 0 ? (int) Math.round(100.0 * completedTrackable / totalTrackable) : 0;

        // Next content: first trackable item in syllabus order (lesson.sequence, content.sequence)
        LessonContents nextContentLc = null;
        String nextStatus = null;
        Integer lastPosSec = null;
        Integer totalSec = null;

        Map<Integer, Long> lessonSequenceMap = lessons.stream()
                .collect(Collectors.toMap(Lesson::getId, Lesson::getSequence, (a, b) -> a));

        // Consider all content types for next-content (not just video/quiz/assignment), but still keep
        // overallPercent weighted by the trackable totals above.
        List<LessonContents> allTrackable;
        try {
            allTrackable = lessonContentsRepository.fetchAllContentsByCourseAndClass(courseId, effectiveClassId);
        } catch (Exception e) {
            log.warn("Fetch all contents failed for course {} class {}: {}", courseId, effectiveClassId, e.getMessage());
            allTrackable = new ArrayList<>();
            allTrackable.addAll(videoContents);
            allTrackable.addAll(assignmentContents);
            allTrackable.addAll(quizContents);
        }

        // Apply per-class content order overrides when classId > 0 (same as fetchCombinedLessonContents)
        Map<Integer, Long> contentSequenceOverrideMap = Collections.emptyMap();
        if (effectiveClassId > 0 && lessonContentClassSequenceRepository != null && !allTrackable.isEmpty()) {
            List<Integer> contentIds = allTrackable.stream().map(LessonContents::getId).distinct().collect(Collectors.toList());
            List<LessonContentClassSequence> overrides = lessonContentClassSequenceRepository
                    .findByLessonContentIdInAndClassId(contentIds, effectiveClassId);
            if (overrides != null && !overrides.isEmpty()) {
                contentSequenceOverrideMap = overrides.stream()
                        .collect(Collectors.toMap(LessonContentClassSequence::getLessonContentId, LessonContentClassSequence::getSequence, (a, b) -> a));
            }
        }
        final Map<Integer, Long> overrideSeq = contentSequenceOverrideMap;
        allTrackable.sort(Comparator
                .comparingLong((LessonContents lc) -> lessonSequenceMap.getOrDefault(lc.getLessonId(), Long.MAX_VALUE))
                .thenComparingLong((LessonContents lc) -> overrideSeq.getOrDefault(lc.getId(), lc.getSequence()))
                .thenComparingInt(LessonContents::getId));

        // Progress for all content ids (needed for manual completion types like pdf/youtube/live_class)
        List<Integer> allContentIds = allTrackable.stream()
                .map(LessonContents::getId)
                .filter(Objects::nonNull)
                .filter(id -> id > 0)
                .distinct()
                .limit(MAX_BULK_IDS)
                .collect(Collectors.toList());
        Map<Integer, LearnerContentProgress> progressAllMap = new HashMap<>();
        if (!allContentIds.isEmpty()) {
            List<LearnerContentProgress> progressAllList = learnerContentProgressRepository
                    .findByLearnerIdAndLessonContentIdIn(learnerId, allContentIds);
            progressAllList.forEach(p -> progressAllMap.put(p.getLessonContentId(), p));
        }

        for (LessonContents lc : allTrackable) {
            String type = (lc.getContentType() != null ? lc.getContentType() : "").toLowerCase();
            if ("video".equals(type) || "youtube".equals(type)) {
                LearnerContentProgress p = progressAllMap.get(lc.getId());
                int percent = 0;
                if (p != null && p.getDurationSeconds() > 0) {
                    percent = (int) Math.min(100, Math.round(100.0 * p.getLastPositionSeconds() / p.getDurationSeconds()));
                }
                boolean completed = p != null && (p.getCompletedAt() != null || percent >= watchedThresholdPercent());
                if (completed) {
                    continue; // skip completed videos
                }
                if (p == null || percent < minInProgressPercent()) {
                    // Not started, or opened briefly (< 5%) and left - treat as next item to do
                    nextContentLc = lc;
                    nextStatus = "NOT_STARTED";
                    if (p != null) {
                        lastPosSec = p.getLastPositionSeconds();
                        totalSec = p.getDurationSeconds();
                    }
                    break;
                }
                // In progress (5% <= percent < 90%) - and no not-started before it
                nextContentLc = lc;
                nextStatus = "IN_PROGRESS";
                lastPosSec = p.getLastPositionSeconds();
                totalSec = p.getDurationSeconds();
                break;
            } else if ("assignment".equals(type)) {
                if (!submittedAssignmentIds.contains(lc.getId())) {
                    nextContentLc = lc;
                    nextStatus = "NOT_STARTED";
                    break;
                }
            } else if ("quiz".equals(type)) {
                if (!submittedQuizIds.contains(lc.getId())) {
                    nextContentLc = lc;
                    nextStatus = "NOT_STARTED";
                    break;
                }
            } else {
                // Other content types: rely on manual completion stored in learner_content_progress.completed_at
                LearnerContentProgress p = progressAllMap.get(lc.getId());
                if (p == null || p.getCompletedAt() == null) {
                    nextContentLc = lc;
                    nextStatus = "NOT_STARTED";
                    break;
                }
            }
        }

        LearnerCourseNextContentDTO nextContentDTO = null;
        if (nextContentLc != null) {
            final int nextLessonId = nextContentLc.getLessonId();
            Lesson lesson = lessons.stream().filter(l -> l.getId() == nextLessonId).findFirst().orElse(null);
            String lessonName = lesson != null ? lesson.getLessonName() : null;
            String slug = course.getSlug();
            String resumeUrl = slug != null
                    ? "/learn/courses/" + slug + "/syllabus?lesson=" + nextContentLc.getLessonId() + "&content=" + nextContentLc.getId()
                    : null;
            nextContentDTO = LearnerCourseNextContentDTO.builder()
                    .lessonId(nextContentLc.getLessonId())
                    .lessonName(lessonName)
                    .contentId(nextContentLc.getId())
                    .contentTitle(nextContentLc.getContentTitle())
                    .contentType(nextContentLc.getContentType() != null ? nextContentLc.getContentType() : "VIDEO")
                    .progressStatus(nextStatus != null ? nextStatus : "NOT_STARTED")
                    .lastPositionSeconds(lastPosSec != null ? lastPosSec : 0)
                    .totalSeconds(totalSec != null ? totalSec : 0)
                    .resumeUrl(resumeUrl)
                    .build();
        }

        // Attendance
        double attendancePercent = -1;
        try {
            attendancePercent = learnerService.getAttendancePercentage(String.valueOf(learnerId));
        } catch (Exception e) {
            log.warn("Attendance calculation failed for learner {} course {}: {}", learnerId, courseId, e.getMessage());
            if (log.isDebugEnabled()) {
                log.debug("Attendance stack trace: learnerId={} courseId={}", learnerId, courseId, e);
            }
        }
        boolean attendanceAvailable = attendancePercent >= 0;

        // Content breakdown
        List<ContentBreakdownItemDTO> breakdown = new ArrayList<>();
        if (videosTotal > 0) {
            int pct = (int) Math.round(100.0 * videosWatched / videosTotal);
            breakdown.add(ContentBreakdownItemDTO.builder().type("VIDEO").completed(videosWatched).total(videosTotal).percent(pct).build());
        }
        if (assignmentsTotal > 0) {
            int pct = (int) Math.round(100.0 * assignmentsSubmitted / assignmentsTotal);
            breakdown.add(ContentBreakdownItemDTO.builder().type("ASSIGNMENT").completed(assignmentsSubmitted).total(assignmentsTotal).percent(pct).build());
        }
        if (quizzesTotal > 0) {
            int pct = (int) Math.round(100.0 * quizzesCompleted / quizzesTotal);
            breakdown.add(ContentBreakdownItemDTO.builder().type("QUIZ").completed(quizzesCompleted).total(quizzesTotal).percent(pct).build());
        }

        return LearnerCourseHomeStatsDTO.builder()
                .version(1)
                .course(LearnerCourseHomeStatsDTO.CourseInfoSection.builder()
                        .id(course.getId())
                        .slug(course.getSlug())
                        .name(course.getCourseName())
                        .build())
                .progress(LearnerCourseProgressDTO.builder()
                        .overallPercent(overallPercent)
                        .lessonsCompleted(lessonsCompleted)
                        .lessonsTotal(lessonsTotal)
                        .videosWatched(videosWatched)
                        .videosTotal(videosTotal)
                        .assignmentsSubmitted(assignmentsSubmitted)
                        .assignmentsTotal(assignmentsTotal)
                        .quizzesCompleted(quizzesCompleted)
                        .quizzesTotal(quizzesTotal)
                        .build())
                .grades(LearnerCourseGradesDTO.builder()
                        .assignmentAvgPercent(assignmentAvgPercent >= 0 ? assignmentAvgPercent : null)
                        .quizAvgPercent(quizAvgPercent >= 0 ? quizAvgPercent : null)
                        .hasGrades(hasGrades)
                        .build())
                .attendance(LearnerCourseHomeStatsDTO.AttendanceSection.builder()
                        .percent(attendanceAvailable ? attendancePercent : null)
                        .available(attendanceAvailable)
                        .build())
                .nextContent(nextContentDTO)
                .contentBreakdown(breakdown)
                .build();
    }

    private List<LessonContents> fetchVideoContentsSafe(int courseId, int classId) {
        try {
            if (classId <= 0) {
                return lessonContentsRepository.fetchVideoContentsByCourseAndClass(courseId, 0);
            }
            return lessonContentsRepository.fetchVideoContentsByCourseAndClass(courseId, classId);
        } catch (Exception e) {
            log.warn("Fetch video contents failed for course {} class {}: {}", courseId, classId, e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<LessonContents> fetchAssignmentContentsSafe(int courseId, int classId) {
        try {
            if (classId <= 0) {
                return lessonContentsRepository.fetchAssignmentContentsByCourseAndClass(courseId, 0);
            }
            return lessonContentsRepository.fetchAssignmentContentsByCourseAndClass(courseId, classId);
        } catch (Exception e) {
            log.warn("Fetch assignment contents failed for course {} class {}: {}", courseId, classId, e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<LessonContents> fetchQuizContentsSafe(int courseId, int classId) {
        try {
            if (classId <= 0) {
                return lessonContentsRepository.fetchQuizContentsByCourseAndClass(courseId, 0);
            }
            return lessonContentsRepository.fetchQuizContentsByCourseAndClass(courseId, classId);
        } catch (Exception e) {
            log.warn("Fetch quiz contents failed for course {} class {}: {}", courseId, classId, e.getMessage());
            return Collections.emptyList();
        }
    }

    private double computeAssignmentAvg(List<StudentAssignment> submissions) {
        if (submissions == null || submissions.isEmpty()) return -1;
        Set<Integer> contentIds = submissions.stream()
                .map(StudentAssignment::getLessonContentId)
                .collect(Collectors.toSet());
        if (contentIds.isEmpty()) return -1;
        List<LessonContents> contents = lessonContentsRepository.findByIdIn(new ArrayList<>(contentIds));
        Map<Integer, LessonContents> contentMap = contents.stream().collect(Collectors.toMap(LessonContents::getId, lc -> lc));
        long totalPoints = 0;
        long totalObtained = 0;
        for (StudentAssignment sa : submissions) {
            LessonContents lc = contentMap.get(sa.getLessonContentId());
            if (lc != null && lc.getPoints() > 0) {
                totalPoints += lc.getPoints();
                totalObtained += sa.getPointsObtained();
            }
        }
        if (totalPoints <= 0) return -1;
        return 100.0 * totalObtained / totalPoints;
    }

    private double computeQuizAvg(List<StudentAssignment> submissions) {
        return computeAssignmentAvg(submissions);
    }
}

