package com._42students.lms.projects;

import com._42students.lms.dto.projects.AdminProjectCreateDTO;
import org.junit.jupiter.api.Test;

import javax.validation.Validation;
import javax.validation.Validator;
import javax.validation.ValidatorFactory;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/** Project creation request validation at the bean-validation boundary. */
class AdminProjectCreateValidationRegressionTest {
    private static final ValidatorFactory FACTORY = Validation.buildDefaultValidatorFactory();
    private static final Validator VALIDATOR = FACTORY.getValidator();

    private AdminProjectCreateDTO valid() {
        AdminProjectCreateDTO dto = new AdminProjectCreateDTO();
        dto.setTitle("Capstone");
        dto.setCollegeId(7);
        return dto;
    }

    private Set<String> invalidFields(AdminProjectCreateDTO dto) {
        return VALIDATOR.validate(dto).stream().map(v -> v.getPropertyPath().toString()).collect(Collectors.toSet());
    }

    @Test void validMinimalRequestPasses() { assertTrue(invalidFields(valid()).isEmpty()); }
    @Test void missingTitleIsRejected() { AdminProjectCreateDTO dto = valid(); dto.setTitle(null); assertTrue(invalidFields(dto).contains("title")); }
    @Test void emptyTitleIsRejected() { AdminProjectCreateDTO dto = valid(); dto.setTitle(""); assertTrue(invalidFields(dto).contains("title")); }
    @Test void whitespaceOnlyTitleIsRejected() { AdminProjectCreateDTO dto = valid(); dto.setTitle(" \t "); assertTrue(invalidFields(dto).contains("title")); }
    @Test void titleAtDatabaseLimitIsAccepted() { AdminProjectCreateDTO dto = valid(); dto.setTitle("a".repeat(160)); assertFalse(invalidFields(dto).contains("title")); }
    @Test void titleBeyondDatabaseLimitIsRejected() { AdminProjectCreateDTO dto = valid(); dto.setTitle("a".repeat(161)); assertTrue(invalidFields(dto).contains("title")); }
    @Test void missingCollegeIsRejected() { AdminProjectCreateDTO dto = valid(); dto.setCollegeId(null); assertTrue(invalidFields(dto).contains("collegeId")); }
    @Test void progressZeroIsAccepted() { AdminProjectCreateDTO dto = valid(); dto.setProgress(0); assertFalse(invalidFields(dto).contains("progress")); }
    @Test void progressHundredIsAccepted() { AdminProjectCreateDTO dto = valid(); dto.setProgress(100); assertFalse(invalidFields(dto).contains("progress")); }
    @Test void negativeProgressIsRejected() { AdminProjectCreateDTO dto = valid(); dto.setProgress(-1); assertTrue(invalidFields(dto).contains("progress")); }
    @Test void progressOverHundredIsRejected() { AdminProjectCreateDTO dto = valid(); dto.setProgress(101); assertTrue(invalidFields(dto).contains("progress")); }
    @Test void nullProgressIsAccepted() { AdminProjectCreateDTO dto = valid(); dto.setProgress(null); assertFalse(invalidFields(dto).contains("progress")); }
    @Test void courseLabelAtLimitIsAccepted() { AdminProjectCreateDTO dto = valid(); dto.setCourseLabel("c".repeat(160)); assertFalse(invalidFields(dto).contains("courseLabel")); }
    @Test void courseLabelBeyondLimitIsRejected() { AdminProjectCreateDTO dto = valid(); dto.setCourseLabel("c".repeat(161)); assertTrue(invalidFields(dto).contains("courseLabel")); }
    @Test void dueLabelAtLimitIsAccepted() { AdminProjectCreateDTO dto = valid(); dto.setDueLabel("d".repeat(80)); assertFalse(invalidFields(dto).contains("dueLabel")); }
    @Test void dueLabelBeyondLimitIsRejected() { AdminProjectCreateDTO dto = valid(); dto.setDueLabel("d".repeat(81)); assertTrue(invalidFields(dto).contains("dueLabel")); }
    @Test void multipleInvalidFieldsAreReportedTogether() {
        AdminProjectCreateDTO dto = valid(); dto.setTitle(" "); dto.setCollegeId(null); dto.setProgress(101);
        assertEquals(Set.of("title", "collegeId", "progress"), invalidFields(dto));
    }
}
