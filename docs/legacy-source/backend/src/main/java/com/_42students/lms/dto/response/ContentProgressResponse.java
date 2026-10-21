package com._42students.lms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Progress for one lesson content (e.g. video). status: NOT_STARTED | IN_PROGRESS | WATCHED.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentProgressResponse {

    private int lessonContentId;
    private int lastPositionSeconds;
    private int durationSeconds;
    private Instant completedAt;
    /** Set once on first completion and never cleared, even if completedAt is later cleared by a rewatch. */
    private Instant firstCompletedAt;
    /** NOT_STARTED, IN_PROGRESS, WATCHED */
    private String status;
    /** 0–100, derived from lastPositionSeconds/durationSeconds or completed */
    private int percentWatched;
}

