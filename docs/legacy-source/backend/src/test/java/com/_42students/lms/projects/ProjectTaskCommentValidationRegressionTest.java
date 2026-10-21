package com._42students.lms.projects;

import com._42students.lms.dto.projects.ProjectTaskCommentUpsertDTO;
import org.junit.jupiter.api.Test;
import javax.validation.Validation;
import javax.validation.Validator;
import javax.validation.ConstraintViolation;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.*;

/** Regression checks for the task-comment request contract. */
class ProjectTaskCommentValidationRegressionTest {
    private static final Validator VALIDATOR = Validation.buildDefaultValidatorFactory().getValidator();

    private Set<ConstraintViolation<ProjectTaskCommentUpsertDTO>> violations(String message) {
        ProjectTaskCommentUpsertDTO dto = new ProjectTaskCommentUpsertDTO();
        dto.setMessage(message);
        return VALIDATOR.validate(dto);
    }

    private void invalid(String message) {
        Set<ConstraintViolation<ProjectTaskCommentUpsertDTO>> errors = violations(message);
        assertEquals(1, errors.size());
        assertEquals("message", errors.iterator().next().getPropertyPath().toString());
        assertEquals("message is required", errors.iterator().next().getMessage());
    }

    @Test void nullCommentIsRejected() { invalid(null); }
    @Test void emptyCommentIsRejected() { invalid(""); }
    @Test void singleSpaceCommentIsRejected() { invalid(" "); }
    @Test void tabOnlyCommentIsRejected() { invalid("\t"); }
    @Test void newlineOnlyCommentIsRejected() { invalid("\n"); }
    @Test void carriageReturnOnlyCommentIsRejected() { invalid("\r"); }
    @Test void mixedWhitespaceCommentIsRejected() { invalid(" \t\n\r "); }
    @Test void ordinaryCommentIsAccepted() { assertTrue(violations("Progress updated").isEmpty()); }
    @Test void multilineCommentWithTextIsAccepted() { assertTrue(violations("Done\nReview pending").isEmpty()); }
    @Test void unicodeCommentIsAccepted() { assertTrue(violations("कार्य पूरा हुआ").isEmpty()); }
    @Test void htmlTextCommentIsNotRejectedByBeanValidation() { assertTrue(violations("<script>alert(1)</script>").isEmpty()); }
    @Test void longNonblankCommentIsNotTruncatedByDto() {
        String text = "a".repeat(4096);
        ProjectTaskCommentUpsertDTO dto = new ProjectTaskCommentUpsertDTO();
        dto.setMessage(text);
        assertEquals(text, dto.getMessage());
        assertTrue(VALIDATOR.validate(dto).isEmpty());
    }
    @Test void progressValueIsPreservedAlongsideComment() {
        ProjectTaskCommentUpsertDTO dto = new ProjectTaskCommentUpsertDTO();
        dto.setMessage("Halfway"); dto.setProgressValue(50);
        assertEquals(50, dto.getProgressValue());
        assertTrue(VALIDATOR.validate(dto).isEmpty());
    }
    @Test void commentTypeIsPreservedAlongsideComment() {
        ProjectTaskCommentUpsertDTO dto = new ProjectTaskCommentUpsertDTO();
        dto.setMessage("Blocked"); dto.setCommentType("BLOCKER");
        assertEquals("BLOCKER", dto.getCommentType());
        assertTrue(VALIDATOR.validate(dto).isEmpty());
    }
    @Test void taskStatusSnapshotIsPreservedAlongsideComment() {
        ProjectTaskCommentUpsertDTO dto = new ProjectTaskCommentUpsertDTO();
        dto.setMessage("Ready"); dto.setTaskStatusSnapshot("IN_REVIEW");
        assertEquals("IN_REVIEW", dto.getTaskStatusSnapshot());
        assertTrue(VALIDATOR.validate(dto).isEmpty());
    }
}
